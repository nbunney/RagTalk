const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Initialize local embedding model
let embeddingPipeline = null;
let pipeline = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'raguser',
  password: process.env.DB_PASSWORD || 'ragpassword',
  database: process.env.DB_NAME || 'ragdb',
};

// Initialize the local embedding model
async function initializeEmbeddingModel() {
  if (!embeddingPipeline) {
    if (!pipeline) {
      // Dynamic import for ES module
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
    }
    console.log('🔄 Loading local embedding model (all-MiniLM-L6-v2)...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Local embedding model loaded successfully');
  }
  return embeddingPipeline;
}

// Generate embedding for text using local model
async function generateEmbedding(text) {
  try {
    const model = await initializeEmbeddingModel();
    
    // Generate embedding
    const result = await model(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Convert to array format
    const embedding = Array.from(result.data);
    
    console.log(`  📊 Generated embedding: ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

// Load sample data from JSON file
function loadSampleData(filename) {
  const filePath = path.join(__dirname, 'sample-data', filename);
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Insert document with embedding into database
async function insertDocument(client, doc) {
  const content = `Category: ${doc.category}\nQuestion: ${doc.question}\nAnswer: ${doc.answer}`;
  
  console.log(`  📄 Processing: ${doc.question.substring(0, 50)}...`);
  
  // Generate embedding
  const embedding = await generateEmbedding(content);
  
  // Insert into database
  const query = `
    INSERT INTO documents (content, source, metadata, embedding)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  
  const metadata = {
    category: doc.category,
    question: doc.question,
    answer: doc.answer,
    tags: doc.tags,
  };
  
  const result = await client.query(query, [
    content,
    'software-engineering-qa.json',
    JSON.stringify(metadata),
    `[${embedding.join(',')}]`,
  ]);
  
  return result.rows[0].id;
}

// Update Agile principles with embeddings
async function updateAgilePrincipleEmbeddings(client) {
  console.log('\n📚 Generating embeddings for Agile principles...');
  
  const result = await client.query('SELECT id, principle_text FROM agile_principles ORDER BY id');
  
  for (const principle of result.rows) {
    console.log(`  🔢 Principle ${principle.id}...`);
    const embedding = await generateEmbedding(principle.principle_text);
    
    await client.query(
      'UPDATE agile_principles SET embedding = $1 WHERE id = $2',
      [`[${embedding.join(',')}]`, principle.id]
    );
  }
  
  console.log(`✅ Updated ${result.rows.length} Agile principle embeddings`);
}

// Main function
async function main() {
  console.log('🚀 Starting data loading process with LOCAL embeddings...\n');
  
  // No need to check for OpenAI API key anymore
  console.log('🏠 Using local embedding model (no external API required)');
  
  // Connect to database
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Load sample data
    console.log('📂 Loading sample data...');
    const sampleData = loadSampleData('software-engineering-qa.json');
    console.log(`✅ Loaded ${sampleData.length} documents\n`);
    
    // Insert documents with embeddings
    console.log('📝 Inserting documents with embeddings...');
    let successCount = 0;
    
    for (const doc of sampleData) {
      try {
        await insertDocument(client, doc);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Error processing document: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Successfully inserted ${successCount}/${sampleData.length} documents\n`);
    
    // Update Agile principles with embeddings
    await updateAgilePrincipleEmbeddings(client);
    
    // Show summary
    console.log('\n📊 Database Summary:');
    const docCount = await client.query('SELECT COUNT(*) FROM documents');
    const principleCount = await client.query('SELECT COUNT(*) FROM agile_principles WHERE embedding IS NOT NULL');
    
    console.log(`  📄 Documents: ${docCount.rows[0].count}`);
    console.log(`  📚 Agile Principles (with embeddings): ${principleCount.rows[0].count}`);
    
    console.log('\n✨ Data loading complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateEmbedding, loadSampleData, insertDocument };
