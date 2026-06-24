use crate::ai;

pub async fn synthesize_reflections(p1_text: String, p2_text: String) -> Result<String, String> {
    ai::generate_synthesis(&p1_text, &p2_text).await
}
