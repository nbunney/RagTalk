# Sample Datasets for RAG Demo

This document describes available datasets for your RAG demonstration and how to
use them.

## 📦 Included Dataset

### Software Engineering Q&A

**File:** `sample-data/software-engineering-qa.json`

A curated collection of 26 software engineering questions and answers covering:

- **Agile Methodology** (3 items) - Sprints, Scrum Master, Product Backlog
- **Software Design** (3 items) - Technical Debt, SOLID, Dependency Injection
- **Testing** (3 items) - TDD, Unit vs Integration, Mocking
- **Version Control** (3 items) - Pull Requests, Merge vs Rebase, Conflicts
- **DevOps** (3 items) - CI, CD, Containerization
- **Architecture** (3 items) - Microservices, API Gateway, Event-Driven
- **Performance** (2 items) - Caching, Database Indexing
- **Security** (3 items) - SQL Injection, OAuth, XSS
- **Team Collaboration** (3 items) - Pair Programming, Code Review, Daily
  Standup

**Perfect for demos because:**

- ✅ Relevant to your audience
- ✅ Questions have semantic variety (good for vector search)
- ✅ Clear categories for filtering
- ✅ Already formatted and ready to use
- ✅ 26 documents = small enough to load quickly, large enough to be interesting

## 🚀 Loading the Dataset

### Prerequisites

```bash
# Install required packages
npm install pg openai

# Make sure Docker database is running
docker-compose up -d

# Set up your .env file
cp env.example .env
# Add your OPENAI_API_KEY
```

### Load the Data

```bash
node load-sample-data.js
```

This script will:

1. Connect to your PostgreSQL database
2. Load the JSON dataset
3. Generate embeddings using OpenAI (text-embedding-3-small)
4. Insert documents with embeddings into the database
5. Update Agile principles with embeddings

**Time:** ~30-60 seconds depending on API speed

## 🎯 Demo Queries to Try

Once loaded, try these questions to showcase semantic search:

### Exact Match Queries

- "What is a sprint?"
- "What is continuous integration?"

### Semantic Queries (different wording, same meaning)

- "How does agile handle timeboxed iterations?" → finds "sprint"
- "What's the practice of writing tests first?" → finds "TDD"
- "How do I safely review code changes?" → finds "pull request" and "code
  review"
- "What protects against malicious database queries?" → finds "SQL injection"

### Cross-Category Queries

- "How do teams work together effectively?" → finds multiple collaboration
  practices
- "What makes code maintainable?" → finds design principles, testing, etc.

## 📚 Alternative Public Datasets

If you want to expand or use different data:

### 1. **Stanford Question Answering Dataset (SQuAD)**

- **URL:** https://rajpurkar.github.io/SQuAD-explorer/
- **Size:** 100,000+ questions
- **Format:** JSON
- **Good for:** Large-scale demos, academic contexts
- **Note:** Requires preprocessing

### 2. **Wikipedia Articles**

- **URL:** https://dumps.wikimedia.org/
- **Size:** Millions of articles
- **Format:** XML/JSON dumps
- **Good for:** General knowledge, comprehensive coverage
- **Note:** Large download, needs chunking

### 3. **Kaggle Datasets**

Popular RAG-ready datasets:

- **COVID-19 Research Papers (CORD-19)**
- **Stack Overflow Questions**
- **Product Reviews**
- **News Articles**

### 4. **HuggingFace Datasets**

- **URL:** https://huggingface.co/datasets
- **Popular choices:**
  - `squad` - Question answering
  - `natural_questions` - Google's QA dataset
  - `hotpot_qa` - Multi-hop reasoning
  - `ms_marco` - Microsoft's machine reading

### 5. **Your Own Data**

Consider using:

- Your company's documentation
- Product knowledge base
- Support tickets (anonymized)
- Internal wiki pages
- Technical specifications

## 🛠️ Creating Custom Datasets

### JSON Format

```json
[
  {
    "category": "Category Name",
    "question": "Question text",
    "answer": "Answer text",
    "tags": ["tag1", "tag2"]
  }
]
```

### CSV Format

Create `data.csv`:

```csv
category,question,answer,tags
Agile,"What is a sprint?","A sprint is...","agile,scrum"
```

Then convert to JSON or modify the loader script.

### Markdown Format

Create individual `.md` files and use a script to parse them:

```markdown
---
category: Agile
tags: [scrum, process]
---

# What is a sprint?

A sprint is a time-boxed iteration...
```

## 📊 Dataset Size Recommendations

### For Talks/Demos

- **Small (10-50 items):** Quick to load, easy to explain
- **Medium (50-500 items):** Shows scale without being overwhelming
- **Large (500+ items):** Demonstrates production-level performance

### For Different Demo Purposes

| Purpose            | Size     | Complexity          |
| ------------------ | -------- | ------------------- |
| Quick intro        | 10-20    | Simple Q&A          |
| Full demo          | 25-100   | Multiple categories |
| Performance test   | 500-1000 | Realistic scale     |
| Production example | 10,000+  | Real-world scale    |

## 🔄 Updating the Dataset

### Add More Documents

```bash
# Edit the JSON file
nano sample-data/software-engineering-qa.json

# Reload (this will add new documents)
node load-sample-data.js
```

### Clear and Reload

```sql
-- Connect to database
docker-compose exec postgres psql -U raguser -d ragdb

-- Clear documents
TRUNCATE TABLE documents;
TRUNCATE TABLE query_history;

-- Then reload
node load-sample-data.js
```

## 🎓 For Your Talk

### Simple Narrative

"We've loaded 26 software engineering Q&As into our vector database. Each answer
has been converted into a 1536-dimensional vector that captures its semantic
meaning. Now when someone asks a question, we can find the most similar
answers - even if they use completely different words!"

### Show the Magic

1. **Load the data:** `node load-sample-data.js`
2. **Show a query:** "How do teams collaborate?"
3. **Show results:** Multiple relevant docs across categories
4. **Compare to keyword search:** Would miss semantic connections

### Explain the Process

1. **Text → Embedding:** OpenAI converts text to vectors
2. **Storage:** Vectors stored in PostgreSQL with pgvector
3. **Query:** User question → embedding
4. **Search:** Cosine similarity finds closest vectors
5. **Retrieve:** Get most relevant documents
6. **Generate:** Use context to create answer

## 💡 Tips

- **Embed once, query many:** Embeddings are expensive to generate but cheap to
  search
- **Chunk size matters:** ~200-500 words per chunk is ideal
- **Metadata helps:** Categories and tags improve filtering
- **Test semantically:** Use synonyms and paraphrases to test
- **Monitor costs:** OpenAI charges per token for embeddings

---

**Happy Dataset Loading!** 📚
