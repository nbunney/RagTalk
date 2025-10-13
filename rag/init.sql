-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing documents and their embeddings
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    source TEXT,
    metadata JSONB,
    embedding vector(384),   -- all-MiniLM-L6-v2 embeddings are 384 dimensions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create table for storing Agile principles with embeddings
CREATE TABLE IF NOT EXISTS agile_principles (
    id SERIAL PRIMARY KEY,
    principle_number INTEGER NOT NULL,
    principle_text TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for Agile principles vector search
CREATE INDEX IF NOT EXISTS agile_principles_embedding_idx 
ON agile_principles USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 12);

-- Create table for query history
CREATE TABLE IF NOT EXISTS query_history (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    relevant_principle_ids INTEGER[],
    response TEXT,
    model TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for documents table
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Agile principles (without embeddings for now)
-- These will be populated with embeddings by the application
INSERT INTO agile_principles (principle_number, principle_text) VALUES
(1, 'Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.'),
(2, 'Welcome changing requirements, even late in development. Agile processes harness change for the customer''s competitive advantage.'),
(3, 'Deliver working software frequently, from a couple of weeks to a couple of months, with a preference to the shorter timescale.'),
(4, 'Business people and developers must work together daily throughout the project.'),
(5, 'Build projects around motivated individuals.Give them the environment and support they need, and trust them to get the job done.'),
(6, 'The most efficient and effective method of conveying information to and within a development team is face-to-face conversation.'),
(7, 'Working software is the primary measure of progress.'),
(8, 'Agile processes promote sustainable development.The sponsors, developers, and users should be able to maintain a constant pace indefinitely.'),
(9, 'Continuous attention to technical excellence and good design enhances agility.'),
(10, 'Simplicity--the art of maximizing the amount of work not done--is essential.'),
(11, 'The best architectures, requirements, and designs emerge from self-organizing teams.'),
(12, 'At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly.')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO raguser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO raguser;
