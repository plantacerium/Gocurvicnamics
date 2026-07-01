use rapier2d::prelude::*;
use std::collections::HashMap;
use crate::physics::types::PieceData;
use crate::physics::config::*;

pub fn add_piece(
    rigid_body_set: &mut RigidBodySet,
    collider_set: &mut ColliderSet,
    piece_handles: &mut HashMap<String, RigidBodyHandle>,
    piece: PieceData,
) {
    let rigid_body = RigidBodyBuilder::dynamic()
        .translation(vector![piece.x, piece.y])
        .linear_damping(BODY_LINEAR_DAMPING)
        .angular_damping(BODY_ANGULAR_DAMPING)
        .ccd_enabled(true)
        .build();

    let handle = rigid_body_set.insert(rigid_body);

    let mass = piece.piece_type.mass();
    let curvature = piece.piece_type.curvature();
    let curvature_bits = curvature.to_bits() as u128;
    let packed_data: u128 = (curvature_bits << 64) | ((piece.player_id as u128) << 32) | (piece.hp as u32 as u128);

    let collider = ColliderBuilder::ball(piece.radius)
        .restitution(COLLIDER_RESTITUTION)
        .friction(COLLIDER_FRICTION)
        .mass(mass)
        .active_events(ActiveEvents::COLLISION_EVENTS)
        .user_data(packed_data)
        .build();

    collider_set.insert_with_parent(collider, handle, rigid_body_set);
    piece_handles.insert(piece.id.clone(), handle);
}
