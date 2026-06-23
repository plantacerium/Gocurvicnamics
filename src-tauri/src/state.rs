use std::sync::Mutex;
use crate::physics::PhysicsCore;

pub struct AppState {
    pub physics: Mutex<PhysicsCore>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            physics: Mutex::new(PhysicsCore::new()),
        }
    }
}
