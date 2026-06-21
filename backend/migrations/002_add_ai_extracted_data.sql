ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS ai_extracted_data JSONB,
  ADD COLUMN IF NOT EXISTS ai_red_flags JSONB;
