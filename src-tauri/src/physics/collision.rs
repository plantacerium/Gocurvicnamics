use rapier2d::prelude::*;
use std::collections::HashMap;
use crate::physics::types::PositionUpdate;
use crate::physics::config::{DAMAGE_PER_COLLISION, MIN_IMPACT_VELOCITY};

pub fn step(
    rigid_body_set: &mut RigidBodySet,
    collider_set: &mut ColliderSet,
    integration_parameters: &IntegrationParameters,
    physics_pipeline: &mut PhysicsPipeline,
    island_manager: &mut IslandManager,
    broad_phase: &mut BroadPhaseMultiSap,
    narrow_phase: &mut NarrowPhase,
    impulse_joint_set: &mut ImpulseJointSet,
    multibody_joint_set: &mut MultibodyJointSet,
    ccd_solver: &mut CCDSolver,
    query_pipeline: &mut QueryPipeline,
    piece_handles: &HashMap<String, RigidBodyHandle>,
) -> Vec<PositionUpdate> {
    let gravity = vector![0.0, 0.0];
    let physics_hooks = ();
    let (collision_send, collision_recv) = crossbeam::channel::unbounded();
    let (_cf_send, _cf_recv) = crossbeam::channel::unbounded();
    let event_handler = ChannelEventCollector::new(collision_send, _cf_send);

    physics_pipeline.step(
        &gravity,
        integration_parameters,
        island_manager,
        broad_phase,
        narrow_phase,
        rigid_body_set,
        collider_set,
        impulse_joint_set,
        multibody_joint_set,
        ccd_solver,
        Some(query_pipeline),
        &physics_hooks,
        &event_handler,
    );

    while let Ok(collision_event) = collision_recv.try_recv() {
        if let CollisionEvent::Started(handle1, handle2, _) = collision_event {
            resolve_collision(rigid_body_set, collider_set, handle1, handle2);
        }
    }

    collect_updates(rigid_body_set, collider_set, piece_handles)
}

fn resolve_collision(rigid_body_set: &mut RigidBodySet, collider_set: &mut ColliderSet, handle1: ColliderHandle, handle2: ColliderHandle) {
    let data1 = collider_set.get(handle1).map(|c| c.user_data);
    let data2 = collider_set.get(handle2).map(|c| c.user_data);

    if let (Some(d1), Some(d2)) = (data1, data2) {
        let player1 = (d1 >> 32) as u8;
        let hp1 = (d1 & 0xFFFFFFFF) as f32;
        let player2 = (d2 >> 32) as u8;
        let hp2 = (d2 & 0xFFFFFFFF) as f32;

        if player1 != player2 && player1 != 0 && player2 != 0 {
            let rel_vel = relative_velocity(rigid_body_set, collider_set, handle1, handle2);
            if rel_vel < MIN_IMPACT_VELOCITY {
                return;
            }

            let new_hp1 = (hp1 - DAMAGE_PER_COLLISION).max(0.0);
            let new_hp2 = (hp2 - DAMAGE_PER_COLLISION).max(0.0);

            if let Some(c1) = collider_set.get_mut(handle1) {
                c1.user_data = ((player1 as u128) << 32) | (new_hp1 as u32 as u128);
            }
            if let Some(c2) = collider_set.get_mut(handle2) {
                c2.user_data = ((player2 as u128) << 32) | (new_hp2 as u32 as u128);
            }
        }
    }
}

fn relative_velocity(rigid_body_set: &RigidBodySet, collider_set: &ColliderSet, handle1: ColliderHandle, handle2: ColliderHandle) -> f32 {
    let vel1 = collider_set.get(handle1)
        .and_then(|c| c.parent())
        .and_then(|h| rigid_body_set.get(h))
        .map(|b| *b.linvel())
        .unwrap_or(vector![0.0, 0.0]);

    let vel2 = collider_set.get(handle2)
        .and_then(|c| c.parent())
        .and_then(|h| rigid_body_set.get(h))
        .map(|b| *b.linvel())
        .unwrap_or(vector![0.0, 0.0]);

    let dv = vel1 - vel2;
    dv.magnitude()
}

fn collect_updates(
    rigid_body_set: &RigidBodySet,
    collider_set: &ColliderSet,
    piece_handles: &HashMap<String, RigidBodyHandle>,
) -> Vec<PositionUpdate> {
    let mut updates = Vec::new();
    for (id, handle) in piece_handles {
        if let Some(body) = rigid_body_set.get(*handle) {
            let mut hp = 0.0;
            if let Some(collider_handle) = body.colliders().first() {
                if let Some(collider) = collider_set.get(*collider_handle) {
                    hp = (collider.user_data & 0xFFFFFFFF) as f32;
                }
            }
            updates.push(PositionUpdate {
                id: id.clone(),
                x: body.translation().x,
                y: body.translation().y,
                hp,
            });
        }
    }
    updates
}
