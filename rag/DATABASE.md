# RAG Vector Database Setup

This document explains how to set up and use the PostgreSQL + pgvector database
for the RAG demo.

## 🗄️ Database Components

### PostgreSQL with pgvector

- **PostgreSQL 16** - Modern, reliable database
- **pgvector extension** - Vector similarity search capabilities
- **384-dimensional vectors** - Compatible with all-MiniLM-L6-v2 local
  embeddings

### pgAdmin

- Web-based database management tool
- Available at `http://localhost:5050`
- Default credentials: `admin@rag.local` / `admin`

## 🚀 Quick Start

### 1. Start the Database

```bash
cd rag
docker-compose up -d
```

This will start:

- PostgreSQL on port `5432`
- pgAdmin on port `5050`

### 2. Verify the Database is Running

```bash
docker-compose ps
```

You should see both services running and healthy.

### 3. Access pgAdmin (Optional)

1. Open `http://localhost:5050` in your browser
2. Login with:
   - Email: `admin@rag.local`
   - Password: `admin`
3. Add a new server:
   - Name: `RAG Database`
   - Host: `postgres` (service name in Docker)
   - Port: `5432`
   - Username: `raguser`
   - Password: `ragpassword`
   - Database: `ragdb`

## 📊 Database Schema

### Tables

#### `documents`

Stores general documents with their vector embeddings.

```sql
- id: SERIAL PRIMARY KEY
- content: TEXT (document content)
- source: TEXT (document source)
- metadata: JSONB (additional metadata)
- embedding: vector(384) (vector embedding)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `agile_principles`

Stores the 12 Agile principles with their vector embeddings.

```sql
- id: SERIAL PRIMARY KEY
- principle_number: INTEGER (1-12)
- principle_text: TEXT
- embedding: vector(384)
- created_at: TIMESTAMP
```

#### `query_history`

Tracks all queries and which principles were selected.

```sql
- id: SERIAL PRIMARY KEY
- question: TEXT
- relevant_principle_ids: INTEGER[]
- response: TEXT
- model: TEXT
- created_at: TIMESTAMP
```

## 🔍 Vector Search

The database uses **cosine similarity** for vector search:

```sql
-- Find most similar principles to a query embedding
SELECT 
    principle_number,
    principle_text,
    1 - (embedding <=> query_embedding) as similarity
FROM agile_principles
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## 🛠️ Management Commands

### Start the Database

```bash
docker-compose up -d
```

### Stop the Database

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

### View Logs

```bash
docker-compose logs -f postgres
```

### Connect via psql

```bash
docker-compose exec postgres psql -U raguser -d ragdb
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose up -d
```

## 📝 Using the Database with RAG Server

### Vector Database RAG (Default Implementation)

- Uses vector similarity search with local embeddings
- Uses local all-MiniLM-L6-v2 model for embeddings (no external API required)
- Always enabled - no configuration needed
- Requires additional npm packages (see below)

## 📦 Additional Dependencies for Vector RAG

To use the vector database, install these packages:

```bash
npm install pg @xenova/transformers
```

## 🔧 Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=raguser
DB_PASSWORD=ragpassword
DB_NAME=ragdb

# Local Embeddings (no API key needed)
# Uses all-MiniLM-L6-v2 model locally

# Vector database is always enabled
```

## 🎯 Demo Workflow

### Vector Database RAG Demo

1. Generate embeddings for Agile principles
2. Store embeddings in database
3. For each query:
   - Generate query embedding
   - Find similar principles using vector search
   - Use selected principles for context
   - Generate final response

## 📊 Sample Queries

### View All Agile Principles

```sql
SELECT principle_number, principle_text 
FROM agile_principles 
ORDER BY principle_number;
```

### Check Query History

```sql
SELECT 
    question,
    array_length(relevant_principle_ids, 1) as num_principles,
    created_at
FROM query_history
ORDER BY created_at DESC
LIMIT 10;
```

### See Which Principles Are Used Most

```sql
SELECT 
    unnest(relevant_principle_ids) as principle_id,
    count(*) as usage_count
FROM query_history
GROUP BY principle_id
ORDER BY usage_count DESC;
```

## 🐛 Troubleshooting

### Port 5432 Already in Use

```bash
# Find what's using the port
lsof -i :5432

# Stop local PostgreSQL if running
brew services stop postgresql
```

### Database Won't Start

```bash
# Check logs
docker-compose logs postgres

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Can't Connect from pgAdmin

- Use `postgres` as hostname (Docker service name)
- Not `localhost` when connecting from pgAdmin container

## 🎓 For Your Talk

### Simple Explanation

"RAG uses a vector database to store knowledge with semantic embeddings. When a
question comes in, we find the most similar pieces of knowledge using vector
similarity search, then use only that relevant context to generate the answer."

### Show the Difference

1. **First**: Run simple RAG (text-based with X.ai)
2. **Then**: Run vector RAG (embedding-based search)
3. **Compare**: Show how vector search can find semantically similar content
   even with different wording

---

**Happy Vector Searching!** 🔍
