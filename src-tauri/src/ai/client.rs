use std::sync::OnceLock;
use std::time::Duration;
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

fn http_client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client")
    })
}

pub async fn call_ollama(prompt: &str) -> Result<String, String> {
    let req = OllamaRequest {
        model: "gemma:2b".to_string(),
        prompt: prompt.to_string(),
        stream: false,
    };

    let res = http_client()
        .post("http://localhost:11434/api/generate")
        .json(&req)
        .send()
        .await;

    match res {
        Ok(response) => {
            let status = response.status();
            if !status.is_success() {
                return Err(format!("Ollama API returned HTTP {}", status));
            }
            response.json::<OllamaResponse>().await
                .map(|r| r.response)
                .map_err(|e| format!("Failed to parse Ollama response: {}", e))
        }
        Err(e) => Err(format!("Ollama API unavailable: {}", e)),
    }
}
