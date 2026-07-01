use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PieceType {
    Base,
    Dampener,
    Amplifier,
    Slingshot,
    Graviton,
    Phantom,
    Brawler,
    GlassCannon,
    Juggernaut,
    Pebble,
    Ghost,
    Mirage,
    Specter,
    Blink,
    Shadow,
    Wisp,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
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

impl PieceType {
    pub fn mass(&self) -> f32 {
        match self {
            PieceType::Base => 1.0,
            PieceType::Dampener => 1.5,
            PieceType::Amplifier => 0.5,
            PieceType::Slingshot => 0.8,
            PieceType::Graviton => 2.5,
            PieceType::Phantom => 0.6,
            PieceType::Brawler => 1.2,
            PieceType::GlassCannon => 1.5,
            PieceType::Juggernaut => 2.0,
            PieceType::Pebble => 0.2,
            PieceType::Ghost => 1.0,
            PieceType::Mirage => 0.5,
            PieceType::Specter => 0.8,
            PieceType::Blink => 1.0,
            PieceType::Shadow => 0.9,
            PieceType::Wisp => 0.4,
        }
    }

    pub fn curvature(&self) -> f32 {
        match self {
            PieceType::Phantom => 0.04,
            PieceType::Mirage => 0.06,
            PieceType::Specter => 0.02,
            PieceType::Shadow => 0.015,
            PieceType::Wisp => 0.10,
            _ => 0.0,
        }
    }
}
