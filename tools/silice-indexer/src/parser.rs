use ast_grep_core::Node;
use ast_grep_language::SupportLang;
use std::path::Path;

pub fn determine_lang(path: &Path) -> Option<SupportLang> {
    let ext = path.extension()?.to_str()?;
    match ext {
        "js" | "jsx" => Some(SupportLang::JavaScript),
        "ts" | "tsx" => Some(SupportLang::TypeScript),
        "rs" => Some(SupportLang::Rust),
        "py" => Some(SupportLang::Python),
        "go" => Some(SupportLang::Go),
        "cpp" | "cxx" | "cc" | "h" | "hpp" => Some(SupportLang::Cpp),
        "c" => Some(SupportLang::C),
        "java" => Some(SupportLang::Java),
        "cs" => Some(SupportLang::CSharp),
        "rb" => Some(SupportLang::Ruby),
        "php" => Some(SupportLang::Php),
        "swift" => Some(SupportLang::Swift),
        "kt" | "kts" => Some(SupportLang::Kotlin),
        "html" => Some(SupportLang::Html),
        "css" => Some(SupportLang::Css),
        _ => None,
    }
}

pub fn extract_symbols<D: ast_grep_core::Doc>(node: Node<D>, symbols: &mut Vec<String>) {
    let kind = node.kind();

    if kind.contains("function_declaration") || kind.contains("function_item")
        || kind.contains("class_declaration") || kind.contains("struct_item")
        || kind.contains("export_statement")
        || kind.contains("impl_item")
    {
        let name = node.children().find(|c| c.kind().contains("identifier") || c.kind() == "type_identifier");
        if let Some(n) = name {
            symbols.push(n.text().to_string());
        }
    }

    for child in node.children() {
        extract_symbols(child, symbols);
    }
}

pub fn classify_file_type(rel_path: &str) -> String {
    if rel_path.starts_with("src/") { "frontend".to_string() }
    else if rel_path.starts_with("src-tauri/") { "backend".to_string() }
    else if rel_path.starts_with("tools/") { "tools".to_string() }
    else { "other".to_string() }
}
