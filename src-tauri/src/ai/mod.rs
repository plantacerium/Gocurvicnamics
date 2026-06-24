pub mod client;
pub mod prompts;

use client::call_ollama;
use prompts::build_synthesis_prompt;

pub async fn generate_synthesis(p1_text: &str, p2_text: &str) -> Result<String, String> {
    let prompt = build_synthesis_prompt(p1_text, p2_text);
    call_ollama(&prompt).await
}
