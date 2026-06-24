use crate::physics::{PieceData, PhysicsCore};

pub fn init_board(phys: &mut PhysicsCore, width: f32, height: f32, pieces: Vec<PieceData>) {
    *phys = PhysicsCore::new();
    phys.setup_walls(width, height);
    for piece in pieces {
        phys.add_piece(piece);
    }
}
