use crate::physics::{PhysicsCore, PositionUpdate};

pub fn physics_step(phys: &mut PhysicsCore) -> Vec<PositionUpdate> {
    phys.step()
}

pub fn apply_impulse(phys: &mut PhysicsCore, piece_id: &str, fx: f32, fy: f32) {
    phys.apply_impulse(piece_id, fx, fy);
}

pub fn teleport_piece(phys: &mut PhysicsCore, piece_id: &str, x: f32, y: f32) {
    phys.teleport_piece(piece_id, x, y);
}

pub fn remove_piece(phys: &mut PhysicsCore, piece_id: &str) {
    phys.remove_piece(piece_id);
}
