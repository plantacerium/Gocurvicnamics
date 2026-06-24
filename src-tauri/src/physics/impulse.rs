use rapier2d::prelude::*;
use std::collections::HashMap;

pub fn apply_impulse(
    rigid_body_set: &mut RigidBodySet,
    piece_handles: &HashMap<String, RigidBodyHandle>,
    piece_id: &str,
    fx: f32,
    fy: f32,
) {
    if let Some(handle) = piece_handles.get(piece_id) {
        if let Some(body) = rigid_body_set.get_mut(*handle) {
            body.apply_impulse(vector![fx, fy], true);
        }
    }
}

pub fn teleport_piece(
    rigid_body_set: &mut RigidBodySet,
    piece_handles: &HashMap<String, RigidBodyHandle>,
    piece_id: &str,
    x: f32,
    y: f32,
) {
    if let Some(handle) = piece_handles.get(piece_id) {
        if let Some(body) = rigid_body_set.get_mut(*handle) {
            body.set_translation(vector![x, y], true);
        }
    }
}
