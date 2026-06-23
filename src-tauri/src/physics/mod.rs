use rapier2d::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum PieceType {
    Base,
    Dampener,
    Amplifier,
    Slingshot,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PieceData {
    pub id: String,
    #[serde(rename = "playerId")]
    pub player_id: u8,
    #[serde(rename = "type")]
    pub piece_type: PieceType,
    pub x: f32,
    pub y: f32,
    pub radius: f32,
    pub hp: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PositionUpdate {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub hp: f32,
}

pub struct PhysicsCore {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub integration_parameters: IntegrationParameters,
    pub physics_pipeline: PhysicsPipeline,
    pub island_manager: IslandManager,
    pub broad_phase: BroadPhaseMultiSap,
    pub narrow_phase: NarrowPhase,
    pub impulse_joint_set: ImpulseJointSet,
    pub multibody_joint_set: MultibodyJointSet,
    pub ccd_solver: CCDSolver,
    pub query_pipeline: QueryPipeline,
    pub piece_handles: HashMap<String, RigidBodyHandle>,
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
        // Create 4 walls using cuboids
        let thickness = 50.0;
        let walls = vec![
            // Top
            (vector![width / 2.0, -thickness / 2.0], Cuboid::new(vector![width / 2.0, thickness / 2.0])),
            // Bottom
            (vector![width / 2.0, height + thickness / 2.0], Cuboid::new(vector![width / 2.0, thickness / 2.0])),
            // Left
            (vector![-thickness / 2.0, height / 2.0], Cuboid::new(vector![thickness / 2.0, height / 2.0])),
            // Right
            (vector![width + thickness / 2.0, height / 2.0], Cuboid::new(vector![thickness / 2.0, height / 2.0])),
        ];

        for (pos, shape) in walls {
            let collider = ColliderBuilder::new(SharedShape::new(shape))
                .translation(pos)
                .restitution(1.0) // Perfectly bouncy walls
                .friction(0.0)
                .build();
            self.collider_set.insert(collider);
        }
    }

    pub fn add_piece(&mut self, piece: PieceData) {
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![piece.x, piece.y])
            .linear_damping(0.0) // Zero friction for infinite movement
            .angular_damping(0.0)
            .build();
            
        let handle = self.rigid_body_set.insert(rigid_body);
        
        let mass = match piece.piece_type {
            PieceType::Dampener => 2.0,
            PieceType::Slingshot => 0.5,
            _ => 1.0,
        };
        
        // Pack player_id and hp into user_data (u128)
        let packed_data: u128 = ((piece.player_id as u128) << 32) | (piece.hp as u32 as u128);
        
        let collider = ColliderBuilder::ball(piece.radius)
            .restitution(1.0) // Perfect bounciness
            .friction(0.0)
            .mass(mass)
            .active_events(ActiveEvents::COLLISION_EVENTS | ActiveEvents::CONTACT_FORCE_EVENTS)
            .user_data(packed_data)
            .build();
            
        self.collider_set.insert_with_parent(collider, handle, &mut self.rigid_body_set);
        self.piece_handles.insert(piece.id.clone(), handle);
    }
    
    pub fn step(&mut self) -> Vec<PositionUpdate> {
        let gravity = vector![0.0, 0.0]; // Top-down game, no gravity
        let physics_hooks = ();
        let (collision_send, collision_recv) = crossbeam::channel::unbounded();
        let (contact_force_send, _contact_force_recv) = crossbeam::channel::unbounded();
        let event_handler = rapier2d::pipeline::ChannelEventCollector::new(collision_send, contact_force_send);

        self.physics_pipeline.step(
            &gravity,
            &self.integration_parameters,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.rigid_body_set,
            &mut self.collider_set,
            &mut self.impulse_joint_set,
            &mut self.multibody_joint_set,
            &mut self.ccd_solver,
            Some(&mut self.query_pipeline),
            &physics_hooks,
            &event_handler,
        );
        
        // Process contacts for damage
        while let Ok(collision_event) = collision_recv.try_recv() {
            if let rapier2d::prelude::CollisionEvent::Started(handle1, handle2, _) = collision_event {
                let mut data1: Option<u128> = None;
                let mut data2: Option<u128> = None;
                
                if let Some(c1) = self.collider_set.get(handle1) {
                    data1 = Some(c1.user_data);
                }
                if let Some(c2) = self.collider_set.get(handle2) {
                    data2 = Some(c2.user_data);
                }
                
                if let (Some(d1), Some(d2)) = (data1, data2) {
                    let player1 = (d1 >> 32) as u8;
                    let mut hp1 = (d1 & 0xFFFFFFFF) as f32; 
                    
                    let player2 = (d2 >> 32) as u8;
                    let mut hp2 = (d2 & 0xFFFFFFFF) as f32;
                    
                    // If adversaries, deduct health
                    if player1 != player2 && player1 != 0 && player2 != 0 {
                        hp1 -= 1.0;
                        hp2 -= 1.0;
                        
                        // write back
                        if let Some(c1) = self.collider_set.get_mut(handle1) {
                            c1.user_data = ((player1 as u128) << 32) | (hp1 as u32 as u128);
                        }
                        if let Some(c2) = self.collider_set.get_mut(handle2) {
                            c2.user_data = ((player2 as u128) << 32) | (hp2 as u32 as u128);
                        }
                    }
                }
            }
        }
        
        let mut updates = Vec::new();
        for (id, handle) in &self.piece_handles {
            if let Some(body) = self.rigid_body_set.get(*handle) {
                let mut hp = 0.0;
                if let Some(collider_handle) = body.colliders().first() {
                    if let Some(collider) = self.collider_set.get(*collider_handle) {
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
    
    pub fn apply_impulse(&mut self, piece_id: &str, fx: f32, fy: f32) {
        if let Some(handle) = self.piece_handles.get(piece_id) {
            if let Some(body) = self.rigid_body_set.get_mut(*handle) {
                body.apply_impulse(vector![fx, fy], true);
            }
        }
    }
    
    pub fn teleport_piece(&mut self, piece_id: &str, x: f32, y: f32) {
        if let Some(handle) = self.piece_handles.get(piece_id) {
            if let Some(body) = self.rigid_body_set.get_mut(*handle) {
                body.set_translation(vector![x, y], true);
            }
        }
    }
}
