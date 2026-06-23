use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

pub async fn generate_synthesis(p1_text: &str, p2_text: &str) -> Result<String, String> {
    let prompt = format!(
        "Analiza estas dos reflexiones post-partida de un juego de estrategia asimétrica abstracta. Haz una síntesis filosófica breve (1 párrafo) sobre el choque de estas dos mentes. \nReflexión P1: {}\nReflexión P2: {}",
        p1_text, p2_text
    );

    let req = OllamaRequest {
        model: "gemma:2b".to_string(),
        prompt,
        stream: false,
    };

    let client = reqwest::Client::new();
    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&req)
        .send()
        .await;

    match res {
        Ok(response) => {
            if response.status().is_success() {
                if let Ok(json) = response.json::<OllamaResponse>().await {
                    return Ok(json.response);
                }
            }
            Err("Error parsing Ollama response".to_string())
        }
        Err(e) => Err(format!("Ollama local API no disponible. {}", e))
    }
}
