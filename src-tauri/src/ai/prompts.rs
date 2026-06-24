pub fn build_synthesis_prompt(p1_text: &str, p2_text: &str) -> String {
    format!(
        "Analiza estas dos reflexiones post-partida de un juego de estrategia asimétrica abstracta. Haz una síntesis filosófica breve (1 párrafo) sobre el choque de estas dos mentes. \nReflexión P1: {}\nReflexión P2: {}",
        p1_text, p2_text
    )
}
