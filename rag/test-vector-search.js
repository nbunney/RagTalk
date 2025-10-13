const { Client } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'raguser',
  password: process.env.DB_PASSWORD || 'ragpassword',
  database: process.env.DB_NAME || 'ragdb',
};

async function testVectorSearch() {
  console.log('🧪 Testing Vector Search...\n');
  
  try {
    // Load embedding model
    console.log('🔄 Loading embedding model...');
    const { pipeline } = await import('@xenova/transformers');
    const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model loaded\n');
    
    // Generate embedding for test query
    const testQuery = 'What is the optimal number of software engineers for a large project?';
    console.log(`📝 Test query: "${testQuery}"`);
    
    const result = await model(testQuery, {
      pooling: 'mean',
      normalize: true,
    });
    
    const queryEmbedding = Array.from(result.data);
    console.log(`📊 Query embedding: ${queryEmbedding.length} dimensions\n`);
    
    // Test database connection and vector search
    const client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test the vector search query
    const searchQuery = `
      SELECT 
        principle_number,
        principle_text,
        1 - (embedding <=> $1::vector) as similarity
      FROM agile_principles
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 3
    `;
    
    console.log('🔍 Running vector search...');
    const searchResult = await client.query(searchQuery, [`[${queryEmbedding.join(',')}]`]);
    
    console.log(`📚 Found ${searchResult.rows.length} similar principles:\n`);
    
    searchResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Principle ${row.principle_number} [${(row.similarity * 100).toFixed(1)}%]`);
      console.log(`   ${row.principle_text.substring(0, 80)}...\n`);
    });
    
    if (searchResult.rows.length === 0) {
      console.log('❌ No results found - there might be an issue with the vector search');
      
      // Debug: Check if embeddings exist
      const countResult = await client.query('SELECT COUNT(*) FROM agile_principles WHERE embedding IS NOT NULL');
      console.log(`📊 Principles with embeddings: ${countResult.rows[0].count}`);
      
      // Debug: Try a simple query
      const simpleResult = await client.query('SELECT principle_number, principle_text FROM agile_principles LIMIT 1');
      console.log(`📊 Sample principle: ${simpleResult.rows[0].principle_text.substring(0, 50)}...`);
    }
    
    await client.end();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testVectorSearch().catch(console.error);
}

module.exports = { testVectorSearch };
