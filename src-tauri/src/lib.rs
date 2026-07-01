mod physics;
mod state;
mod ai;
mod commands;

use state::AppState;
use physics::{PieceData, PositionUpdate};
use commands::{board, physics as physics_cmd, ai as ai_cmd};

fn lock_physics<'a>(state: &'a tauri::State<'a, AppState>) -> Result<std::sync::MutexGuard<'a, physics::PhysicsCore>, String> {
    state.physics.lock().map_err(|e| format!("Physics lock poisoned: {}", e))
}

#[tauri::command]
fn init_board(state: tauri::State<AppState>, width: f32, height: f32, pieces: Vec<PieceData>) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    board::init_board(&mut phys, width, height, pieces);
    Ok(())
}

#[tauri::command]
fn physics_step(state: tauri::State<AppState>) -> Result<Vec<PositionUpdate>, String> {
    let mut phys = lock_physics(&state)?;
    Ok(physics_cmd::physics_step(&mut phys))
}

#[tauri::command]
fn apply_impulse(state: tauri::State<AppState>, piece_id: String, fx: f32, fy: f32) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::apply_impulse(&mut phys, &piece_id, fx, fy);
    Ok(())
}

#[tauri::command]
fn teleport_piece(state: tauri::State<AppState>, piece_id: String, x: f32, y: f32) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::teleport_piece(&mut phys, &piece_id, x, y);
    Ok(())
}

#[tauri::command]
fn set_spin(state: tauri::State<AppState>, piece_id: String, spin: f32) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::set_spin(&mut phys, &piece_id, spin);
    Ok(())
}

#[tauri::command]
fn remove_piece(state: tauri::State<AppState>, piece_id: String) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::remove_piece(&mut phys, &piece_id);
    Ok(())
}

#[tauri::command]
fn add_piece(state: tauri::State<AppState>, piece: PieceData) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::add_piece(&mut phys, piece);
    Ok(())
}

#[tauri::command]
fn pin_piece(state: tauri::State<AppState>, piece_id: String) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::pin_piece(&mut phys, &piece_id);
    Ok(())
}

#[tauri::command]
fn unpin_piece(state: tauri::State<AppState>, piece_id: String) -> Result<(), String> {
    let mut phys = lock_physics(&state)?;
    physics_cmd::unpin_piece(&mut phys, &piece_id);
    Ok(())
}

#[tauri::command]
async fn synthesize_reflections(p1_text: String, p2_text: String) -> Result<String, String> {
    ai_cmd::synthesize_reflections(p1_text, p2_text).await
}

#[tauri::command]
fn ping() -> bool {
    true
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            init_board,
            physics_step,
            apply_impulse,
            teleport_piece,
            set_spin,
            remove_piece,
            add_piece,
            pin_piece,
            unpin_piece,
            synthesize_reflections,
            ping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
