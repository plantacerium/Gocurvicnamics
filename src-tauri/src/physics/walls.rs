use rapier2d::prelude::*;
use crate::physics::config::*;

pub fn setup_walls(
    collider_set: &mut ColliderSet,
    width: f32,
    height: f32,
) {
    let walls = vec![
        (vector![width / 2.0, -WALL_THICKNESS / 2.0], Cuboid::new(vector![width / 2.0, WALL_THICKNESS / 2.0])),
        (vector![width / 2.0, height + WALL_THICKNESS / 2.0], Cuboid::new(vector![width / 2.0, WALL_THICKNESS / 2.0])),
        (vector![-WALL_THICKNESS / 2.0, height / 2.0], Cuboid::new(vector![WALL_THICKNESS / 2.0, height / 2.0])),
        (vector![width + WALL_THICKNESS / 2.0, height / 2.0], Cuboid::new(vector![WALL_THICKNESS / 2.0, height / 2.0])),
    ];

    for (pos, shape) in walls {
        let collider = ColliderBuilder::new(SharedShape::new(shape))
            .translation(pos)
            .restitution(WALL_RESTITUTION)
            .friction(WALL_FRICTION)
            .build();
        collider_set.insert(collider);
    }
}
