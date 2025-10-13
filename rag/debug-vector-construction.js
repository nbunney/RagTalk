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

async function debugVectorConstruction() {
  console.log('🔍 Debugging Vector Construction...\n');
  
  try {
    // Load embedding model
    console.log('🔄 Loading embedding model...');
    const { pipeline } = await import('@xenova/transformers');
    const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model loaded\n');
    
    // Generate embedding
    const testQuery = 'What is the optimal number of software engineers for a large project?';
    console.log(`📝 Test query: "${testQuery}"`);
    
    const result = await model(testQuery, {
      pooling: 'mean',
      normalize: true,
    });
    
    const queryEmbedding = Array.from(result.data);
    console.log(`📊 Original embedding array length: ${queryEmbedding.length}`);
    console.log(`📊 First 5 values: [${queryEmbedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);
    
    // Test different ways of constructing the vector string
    const vectorString1 = `[${queryEmbedding.join(',')}]`;
    console.log(`📊 Vector string 1 length: ${vectorString1.length} characters`);
    console.log(`📊 Vector string 1 first 100 chars: ${vectorString1.substring(0, 100)}...`);
    
    // Test with proper formatting (matching stored embeddings)
    const queryEmbeddingFormatted = queryEmbedding.map(v => {
      return parseFloat(v.toFixed(8)).toString();
    });
    const vectorString2 = `[${queryEmbeddingFormatted.join(',')}]`;
    console.log(`📊 Vector string 2 length: ${vectorString2.length} characters`);
    console.log(`📊 Vector string 2 first 100 chars: ${vectorString2.substring(0, 100)}...`);
    
    // Test database connection
    const client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test vector construction in database
    console.log('🔍 Testing vector construction in database...');
    
    try {
      const testQuery1 = `SELECT $1::vector as test_vector`;
      const result1 = await client.query(testQuery1, [vectorString1]);
      console.log(`✅ Vector string 1 works - dimensions: ${result1.rows[0].test_vector.length}`);
    } catch (error) {
      console.log(`❌ Vector string 1 failed: ${error.message}`);
    }
    
    try {
      const testQuery2 = `SELECT $1::vector as test_vector`;
      const result2 = await client.query(testQuery2, [vectorString2]);
      console.log(`✅ Vector string 2 works - dimensions: ${result2.rows[0].test_vector.length}`);
    } catch (error) {
      console.log(`❌ Vector string 2 failed: ${error.message}`);
    }
    
    // Test actual similarity search with the working vector
    console.log('\n🔍 Testing similarity search...');
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
    
    const searchResult = await client.query(searchQuery, [vectorString2]);
    console.log(`📚 Found ${searchResult.rows.length} similar principles:`);
    
    searchResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Principle ${row.principle_number} [${(row.similarity * 100).toFixed(1)}%]`);
      console.log(`   ${row.principle_text.substring(0, 60)}...`);
    });
    
    await client.end();
    console.log('\n✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  debugVectorConstruction().catch(console.error);
}

module.exports = { debugVectorConstruction };
