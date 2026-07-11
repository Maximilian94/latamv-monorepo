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

/// GET /procedures/versions?aircraftModelCode=... -> raw versions JSON array.
/// Used by the desktop "test mode" to let the user pick a draft or published
/// version to run against.
#[tauri::command]
pub async fn api_list_versions(
    base: String,
    token: String,
    aircraft_model_code: String,
) -> Result<String, String> {
    let url = format!("{}/procedures/versions", base.trim_end_matches('/'));
    let resp = client()?
        .get(&url)
        .query(&[("aircraftModelCode", aircraft_model_code)])
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}

/// GET /procedures/versions/:id/bundle -> raw bundle JSON string for ANY
/// version (draft included), so a draft can be tested before publishing.
#[tauri::command]
pub async fn api_get_version_bundle(
    base: String,
    token: String,
    version_id: i64,
) -> Result<String, String> {
    let url = format!(
        "{}/procedures/versions/{}/bundle",
        base.trim_end_matches('/'),
        version_id
    );
    let resp = client()?
        .get(&url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}

/// GET /flight-duty -> the pilot's open duty (or `{}`) as a raw JSON string.
#[tauri::command]
pub async fn api_get_flight_duty(base: String, token: String) -> Result<String, String> {
    let url = format!("{}/flight-duty", base.trim_end_matches('/'));
    let resp = client()?
        .get(&url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}

/// GET /airport/:icao -> airport record incl. lat/lon (backend has no auth here).
#[tauri::command]
pub async fn api_get_airport(base: String, icao: String) -> Result<String, String> {
    let url = format!("{}/airport/{}", base.trim_end_matches('/'), icao);
    let resp = client()?
        .get(&url)
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

/// POST /flight-duty/submit-flight -> finalize + score the current leg.
/// Events are NOT sent here; they were streamed live during the flight.
/// OOOI marks are optional (the backend defaults missing ones to end_acars_time).
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn api_submit_flight(
    base: String,
    token: String,
    flight_id: i64,
    flight_duty_id: i64,
    start_acars_time: String,
    end_acars_time: String,
    out_time: Option<String>,
    off_time: Option<String>,
    on_time: Option<String>,
    in_time: Option<String>,
) -> Result<String, String> {
    let url = format!("{}/flight-duty/submit-flight", base.trim_end_matches('/'));
    let mut payload = json!({
        "flightId": flight_id,
        "flightDutyId": flight_duty_id,
        "startAcarsTime": start_acars_time,
        "endAcarsTime": end_acars_time,
    });
    let obj = payload.as_object_mut().unwrap();
    if let Some(v) = out_time {
        obj.insert("OUT".into(), json!(v));
    }
    if let Some(v) = off_time {
        obj.insert("OFF".into(), json!(v));
    }
    if let Some(v) = on_time {
        obj.insert("ON".into(), json!(v));
    }
    if let Some(v) = in_time {
        obj.insert("IN".into(), json!(v));
    }
    let resp = client()?
        .post(&url)
        .bearer_auth(token)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    ensure_ok(resp).await
}
