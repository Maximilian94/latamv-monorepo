//! X-Plane Web API v2 connection manager.
//!
//! Runs in the Rust core (not the webview) so there is no CORS problem and it
//! can reconnect independently of the React lifecycle. It:
//!   1. HTTP `GET /api/v2/datarefs` to resolve dataref name -> id (ids are
//!      per X-Plane session, so this must run on every connect).
//!   2. Opens `ws://<host>/api/v2`, sends `dataref_subscribe_values`.
//!   3. Streams `dataref_update_values`, maps id -> name, and emits a
//!      `xplane://frame` Tauri event with { t, values: { name: value } }.
//!   4. Reconnects with a fixed backoff until `xplane_disconnect` is called.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;

#[derive(Default)]
pub struct XPlaneState {
    running: Arc<AtomicBool>,
}

#[derive(Serialize, Clone)]
struct FramePayload {
    t: u64,
    values: HashMap<String, Value>,
}

#[derive(Serialize, Clone)]
struct StatusPayload {
    connected: bool,
    message: String,
}

fn emit_status(app: &AppHandle, connected: bool, message: impl Into<String>) {
    let _ = app.emit(
        "xplane://status",
        StatusPayload {
            connected,
            message: message.into(),
        },
    );
}

/// GET {base_http}/datarefs -> { data: [{ id, name, value_type }] }, keep the
/// requested names, return id -> name.
async fn resolve_ids(
    base_http: &str,
    names: &[String],
) -> Result<HashMap<i64, String>, String> {
    let url = format!("{base_http}/datarefs");
    let resp = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    let json: Value = resp.json().await.map_err(|e| e.to_string())?;
    let arr = json
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or_else(|| "unexpected /datarefs response".to_string())?;

    let wanted: HashSet<&str> = names.iter().map(|s| s.as_str()).collect();
    let mut map = HashMap::new();
    for item in arr {
        let id = item.get("id").and_then(|v| v.as_i64());
        let name = item.get("name").and_then(|v| v.as_str());
        if let (Some(id), Some(name)) = (id, name) {
            if wanted.contains(name) {
                map.insert(id, name.to_string());
            }
        }
    }
    Ok(map)
}

async fn connect_once(
    app: &AppHandle,
    base_ws: &str,
    base_http: &str,
    names: &[String],
    running: &Arc<AtomicBool>,
    counter: &mut u64,
) -> Result<(), String> {
    let id_to_name = resolve_ids(base_http, names).await?;
    if id_to_name.is_empty() {
        return Err("none of the requested datarefs were found in X-Plane".into());
    }

    let (ws_stream, _) = connect_async(base_ws).await.map_err(|e| e.to_string())?;
    let (mut write, mut read) = ws_stream.split();

    let datarefs: Vec<Value> = id_to_name
        .keys()
        .map(|id| serde_json::json!({ "id": id }))
        .collect();
    let sub = serde_json::json!({
        "req_id": 1,
        "type": "dataref_subscribe_values",
        "params": { "datarefs": datarefs },
    });
    write
        .send(Message::Text(sub.to_string().into()))
        .await
        .map_err(|e| e.to_string())?;

    emit_status(
        app,
        true,
        format!("connected · subscribed to {} datarefs", id_to_name.len()),
    );

    while running.load(Ordering::SeqCst) {
        let msg = match read.next().await {
            Some(Ok(m)) => m,
            Some(Err(e)) => return Err(e.to_string()),
            None => return Err("connection closed by X-Plane".into()),
        };

        let txt = match msg {
            Message::Text(t) => t,
            Message::Close(_) => return Err("connection closed by X-Plane".into()),
            _ => continue,
        };

        let parsed: Value = match serde_json::from_str(txt.as_str()) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if parsed.get("type").and_then(|t| t.as_str()) != Some("dataref_update_values") {
            continue;
        }
        let Some(data) = parsed.get("data").and_then(|d| d.as_object()) else {
            continue;
        };

        let mut values: HashMap<String, Value> = HashMap::new();
        for (id_str, val) in data {
            if let Ok(id) = id_str.parse::<i64>() {
                if let Some(name) = id_to_name.get(&id) {
                    values.insert(name.clone(), val.clone());
                }
            }
        }
        if !values.is_empty() {
            *counter += 1;
            let _ = app.emit(
                "xplane://frame",
                FramePayload {
                    t: *counter,
                    values,
                },
            );
        }
    }
    Ok(())
}

async fn run_connection(
    app: AppHandle,
    base_ws: String,
    base_http: String,
    names: Vec<String>,
    running: Arc<AtomicBool>,
) {
    let mut counter: u64 = 0;
    while running.load(Ordering::SeqCst) {
        if let Err(e) =
            connect_once(&app, &base_ws, &base_http, &names, &running, &mut counter).await
        {
            emit_status(&app, false, format!("{e} · retrying in 2s"));
        }
        if !running.load(Ordering::SeqCst) {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    }
    emit_status(&app, false, "stopped");
}

#[tauri::command]
pub async fn xplane_connect(
    app: AppHandle,
    state: State<'_, XPlaneState>,
    base: Option<String>,
    datarefs: Vec<String>,
) -> Result<(), String> {
    let host = base.unwrap_or_else(|| "localhost:8086".to_string());
    let base_http = format!("http://{host}/api/v2");
    let base_ws = format!("ws://{host}/api/v2");

    // Stop any prior run, then arm a fresh flag for this one.
    state.running.store(false, Ordering::SeqCst);
    let running = state.running.clone();
    running.store(true, Ordering::SeqCst);

    let app2 = app.clone();
    tauri::async_runtime::spawn(async move {
        run_connection(app2, base_ws, base_http, datarefs, running).await;
    });
    Ok(())
}

#[tauri::command]
pub fn xplane_disconnect(state: State<'_, XPlaneState>) -> Result<(), String> {
    state.running.store(false, Ordering::SeqCst);
    Ok(())
}
