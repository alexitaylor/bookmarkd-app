-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for faster trigram searches on book titles and author names
CREATE INDEX IF NOT EXISTS idx_book_title_trgm ON book USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_author_name_trgm ON author USING GIN (name gin_trgm_ops);

-- Optional: Create index on ISBN for exact matches
CREATE INDEX IF NOT EXISTS idx_book_isbn ON book (isbn) WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_isbn13 ON book (isbn13) WHERE isbn13 IS NOT NULL;
