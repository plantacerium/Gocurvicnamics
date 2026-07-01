use crate::physics::{PhysicsCore, PositionUpdate, PieceData};

pub fn physics_step(phys: &mut PhysicsCore) -> Vec<PositionUpdate> {
    phys.step()
}

pub fn apply_impulse(phys: &mut PhysicsCore, piece_id: &str, fx: f32, fy: f32) {
    phys.apply_impulse(piece_id, fx, fy);
}

pub fn teleport_piece(phys: &mut PhysicsCore, piece_id: &str, x: f32, y: f32) {
    phys.teleport_piece(piece_id, x, y);
}

pub fn set_spin(phys: &mut PhysicsCore, piece_id: &str, spin: f32) {
    phys.set_spin(piece_id, spin);
}

pub fn remove_piece(phys: &mut PhysicsCore, piece_id: &str) {
    phys.remove_piece(piece_id);
}

pub fn add_piece(phys: &mut PhysicsCore, piece: PieceData) {
    phys.add_piece(piece);
}

pub fn pin_piece(phys: &mut PhysicsCore, piece_id: &str) {
    phys.pin_piece(piece_id);
}

pub fn unpin_piece(phys: &mut PhysicsCore, piece_id: &str) {
    phys.unpin_piece(piece_id);
}
