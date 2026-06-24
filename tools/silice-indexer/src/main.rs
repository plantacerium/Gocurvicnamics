mod config;
mod parser;
mod serializer;
mod indexer;

fn main() {
    indexer::run_indexer();
}
