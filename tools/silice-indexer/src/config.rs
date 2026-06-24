pub const EXCLUDED_DIRS: &[&str] = &["node_modules", "target", "dist", ".git", "gen", "icons"];
pub const OUTPUT_PATH: &str = "silice/codebase.json";

pub fn should_skip(path_str: &str) -> bool {
    EXCLUDED_DIRS.iter().any(|d| path_str.contains(d))
}
