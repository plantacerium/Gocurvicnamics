use rapier2d::prelude::*;
use std::collections::HashMap;
use crate::physics::types::*;
use crate::physics::walls;
use crate::physics::piece;
use crate::physics::impulse;
use crate::physics::collision;

pub struct PhysicsCore {
    pub(crate) rigid_body_set: RigidBodySet,
    pub(crate) collider_set: ColliderSet,
    pub(crate) integration_parameters: IntegrationParameters,
    pub(crate) physics_pipeline: PhysicsPipeline,
    pub(crate) island_manager: IslandManager,
    pub(crate) broad_phase: BroadPhaseMultiSap,
    pub(crate) narrow_phase: NarrowPhase,
    pub(crate) impulse_joint_set: ImpulseJointSet,
    pub(crate) multibody_joint_set: MultibodyJointSet,
    pub(crate) ccd_solver: CCDSolver,
    pub(crate) query_pipeline: QueryPipeline,
    pub(crate) piece_handles: HashMap<String, RigidBodyHandle>,
}

impl PhysicsCore {
    pub fn new() -> Self {
        Self {
            rigid_body_set: RigidBodySet::new(),
            collider_set: ColliderSet::new(),
            integration_parameters: IntegrationParameters::default(),
            physics_pipeline: PhysicsPipeline::new(),
            island_manager: IslandManager::new(),
            broad_phase: BroadPhaseMultiSap::new(),
            narrow_phase: NarrowPhase::new(),
            impulse_joint_set: ImpulseJointSet::new(),
            multibody_joint_set: MultibodyJointSet::new(),
            ccd_solver: CCDSolver::new(),
            query_pipeline: QueryPipeline::new(),
            piece_handles: HashMap::new(),
        }
    }

    pub fn setup_walls(&mut self, width: f32, height: f32) {
        walls::setup_walls(&mut self.collider_set, width, height);
    }

    pub fn add_piece(&mut self, piece_data: PieceData) {
        piece::add_piece(
            &mut self.rigid_body_set,
            &mut self.collider_set,
            &mut self.piece_handles,
            piece_data,
        );
    }

    pub fn step(&mut self) -> Vec<PositionUpdate> {
        let updates = collision::step(
            &mut self.rigid_body_set,
            &mut self.collider_set,
            &self.integration_parameters,
            &mut self.physics_pipeline,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.impulse_joint_set,
            &mut self.multibody_joint_set,
            &mut self.ccd_solver,
            &mut self.query_pipeline,
            &self.piece_handles,
        );

        let dead_ids: Vec<String> = updates.iter()
            .filter(|u| u.hp <= 0.0)
            .map(|u| u.id.clone())
            .collect();
        for id in dead_ids {
            self.remove_piece(&id);
        }

        updates
    }

    pub fn apply_impulse(&mut self, piece_id: &str, fx: f32, fy: f32) {
        impulse::apply_impulse(&mut self.rigid_body_set, &self.piece_handles, piece_id, fx, fy);
    }

    pub fn teleport_piece(&mut self, piece_id: &str, x: f32, y: f32) {
        impulse::teleport_piece(&mut self.rigid_body_set, &self.piece_handles, piece_id, x, y);
    }

    pub fn set_spin(&mut self, piece_id: &str, spin: f32) {
        impulse::set_spin(&mut self.rigid_body_set, &self.piece_handles, piece_id, spin);
    }

    pub fn pin_piece(&mut self, piece_id: &str) {
        if let Some(handle) = self.piece_handles.get(piece_id) {
            if let Some(body) = self.rigid_body_set.get_mut(*handle) {
                body.set_body_type(RigidBodyType::Fixed, true);
            }
        }
    }

    pub fn unpin_piece(&mut self, piece_id: &str) {
        if let Some(handle) = self.piece_handles.get(piece_id) {
            if let Some(body) = self.rigid_body_set.get_mut(*handle) {
                body.set_body_type(RigidBodyType::Dynamic, true);
                body.wake_up(true);
            }
        }
    }

    pub fn remove_piece(&mut self, piece_id: &str) {
        if let Some(handle) = self.piece_handles.remove(piece_id) {
            self.rigid_body_set.remove(handle, &mut self.island_manager, &mut self.collider_set, &mut self.impulse_joint_set, &mut self.multibody_joint_set, true);
        }
    }
}
