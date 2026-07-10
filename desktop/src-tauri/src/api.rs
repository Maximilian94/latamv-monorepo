//! Thin HTTP bridge to the LATAM backend.
//!
//! Runs in the Rust core (via `reqwest`, already a dependency) rather than the
//! webview, so there is no CORS problem talking to the NestJS API from the
//! desktop app. Each command returns the response body as a raw JSON string
//! that the TypeScript side parses into typed shapes.

use serde::Deserialize;
use serde_json::json;

/// Build a client with a sane timeout. Errors surface as strings to the front end.
fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())
}

/// Turn a non-2xx response into a readable error including the body.
async fn ensure_ok(resp: reqwest::Response) -> Result<String, String> {
    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if status.is_success() {
        Ok(body)
    } else {
        Err(format!("HTTP {}: {}", status.as_u16(), body))
    }
}

/// POST /auth/login -> returns the raw `{ authToken, user }` JSON string.
#[tauri::command]
pub async fn api_login(
    base: String,
    email_or_username: String,
    password: String,
) -> Result<String, String> {
    let url = format!("{}/auth/login", base.trim_end_matches('/'));
    let resp = client()?
        .post(&url)
        .json(&json!({ "emailOrUsername": email_or_username, "password": password }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}

/// GET /procedures/published?aircraftModelCode=... -> raw bundle JSON string.
#[tauri::command]
pub async fn api_get_published(
    base: String,
    token: String,
    aircraft_model_code: String,
) -> Result<String, String> {
    let url = format!("{}/procedures/published", base.trim_end_matches('/'));
    let resp = client()?
        .get(&url)
        .query(&[("aircraftModelCode", aircraft_model_code)])
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}

#[derive(Deserialize)]
pub struct EventIn {
    #[serde(rename = "eventId")]
    event_id: String,
    timestamp: String,
    #[serde(default)]
    details: Option<serde_json::Value>,
}

/// POST /flight/:id/events -> raw response JSON string (or error with body).
#[tauri::command]
pub async fn api_post_events(
    base: String,
    token: String,
    flight_id: i64,
    events: Vec<EventIn>,
) -> Result<String, String> {
    let url = format!(
        "{}/flight/{}/events",
        base.trim_end_matches('/'),
        flight_id
    );
    let payload = json!({
        "events": events.iter().map(|e| json!({
            "eventId": e.event_id,
            "timestamp": e.timestamp,
            "details": e.details,
        })).collect::<Vec<_>>()
    });
    let resp = client()?
        .post(&url)
        .bearer_auth(token)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}
