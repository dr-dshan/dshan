CREATE TABLE IF NOT EXISTS wiki_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  content_html TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'unknown',
  updated_by TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wiki_category ON wiki_pages(category);
CREATE INDEX IF NOT EXISTS idx_wiki_updated ON wiki_pages(updated_at DESC);
