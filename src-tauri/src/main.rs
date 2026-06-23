// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod physics;
mod state;
mod ai;

use state::AppState;
use physics::{PieceData, PositionUpdate};

#[tauri::command]
fn init_board(state: tauri::State<AppState>, width: f32, height: f32, pieces: Vec<PieceData>) {
    let mut phys = state.physics.lock().unwrap();
    // Reset physics core if re-initializing
    *phys = physics::PhysicsCore::new();
    phys.setup_walls(width, height);
    for piece in pieces {
        phys.add_piece(piece);
    }
}

#[tauri::command]
fn physics_step(state: tauri::State<AppState>) -> Vec<PositionUpdate> {
    let mut phys = state.physics.lock().unwrap();
    phys.step()
}

#[tauri::command]
fn apply_impulse(state: tauri::State<AppState>, piece_id: String, fx: f32, fy: f32) {
    let mut phys = state.physics.lock().unwrap();
    phys.apply_impulse(&piece_id, fx, fy);
}

#[tauri::command]
fn teleport_piece(state: tauri::State<AppState>, piece_id: String, x: f32, y: f32) {
    let mut phys = state.physics.lock().unwrap();
    phys.teleport_piece(&piece_id, x, y);
}

#[tauri::command]
async fn synthesize_reflections(p1_text: String, p2_text: String) -> Result<String, String> {
    ai::generate_synthesis(&p1_text, &p2_text).await
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            init_board,
            physics_step,
            apply_impulse,
            teleport_piece,
            synthesize_reflections
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
