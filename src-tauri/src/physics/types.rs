use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum PieceType {
    Base,
    Dampener,
    Amplifier,
    Slingshot,
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
            PieceType::Dampener => 1.5,
            PieceType::Amplifier => 0.5,
            PieceType::Slingshot => 0.8,
            PieceType::Base => 1.0,
        }
    }
}
