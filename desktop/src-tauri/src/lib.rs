mod api;
mod xplane;

use api::{
    api_get_airport, api_get_flight_duty, api_get_published, api_get_version_bundle,
    api_list_versions, api_login, api_post_events, api_reset_events, api_submit_flight,
};
use xplane::{xplane_connect, xplane_disconnect, xplane_read_string, XPlaneState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(XPlaneState::default())
        .invoke_handler(tauri::generate_handler![
            xplane_connect,
            xplane_disconnect,
            xplane_read_string,
            api_login,
            api_get_published,
            api_list_versions,
            api_get_version_bundle,
            api_get_flight_duty,
            api_get_airport,
            api_post_events,
            api_reset_events,
            api_submit_flight
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
