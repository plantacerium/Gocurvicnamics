use std::fs;
use std::path::Path;
use std::env;
use ignore::WalkBuilder;
use ast_grep_language::LanguageExt;
use crate::config::{should_skip, OUTPUT_PATH};
use crate::parser::{determine_lang, extract_symbols, classify_file_type};
use crate::serializer::{CodebaseJson, FileInfo};

pub fn run_indexer() {
    println!("Starting Silice AST Indexer...");
    let root_dir = env::current_dir().unwrap();
    let mut files_info = Vec::new();

    for result in WalkBuilder::new(&root_dir)
        .hidden(false)
        .git_ignore(true)
        .build()
    {
        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_file() { continue; }

        let p_str = path.display().to_string();
        if should_skip(&p_str) { continue; }

        if let Some(info) = process_file(path, &root_dir) {
            if !info.exports.is_empty() {
                files_info.push(info);
            }
        }
    }

    let db = CodebaseJson::new(files_info);
    let json = db.to_json_pretty().expect("Failed to serialize JSON");
    let out_path = root_dir.join(OUTPUT_PATH);

    if let Some(parent) = out_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    fs::write(&out_path, json).expect("Failed to write codebase.json");
    println!("Successfully indexed codebase.json at {}", out_path.display());
}

fn process_file(path: &Path, root_dir: &Path) -> Option<FileInfo> {
    let lang = determine_lang(path)?;
    let content = fs::read_to_string(path).ok()?;

    let root = lang.ast_grep(content);
    let mut symbols = Vec::new();
    extract_symbols(root.root(), &mut symbols);

    symbols.sort();
    symbols.dedup();

    let rel_path = path.strip_prefix(root_dir)
        .unwrap_or(path)
        .display()
        .to_string()
        .replace("\\", "/");

    let file_type = classify_file_type(&rel_path);

    Some(FileInfo::new(rel_path, file_type, symbols))
}
