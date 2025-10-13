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

async function testCombinedKnowledge() {
  console.log('🧪 Testing Combined Knowledge Sources...\n');
  
  try {
    // Load embedding model
    console.log('🔄 Loading embedding model...');
    const { pipeline } = await import('@xenova/transformers');
    const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model loaded\n');
    
    // Test different types of questions
    const testQuestions = [
      'What is the optimal number of software engineers for a large project?',
      'What is test-driven development?',
      'How should teams communicate effectively?',
      'What is continuous integration?'
    ];
    
    const client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected to database\n');
    
    for (const question of testQuestions) {
      console.log(`📝 Question: "${question}"`);
      
      // Generate embedding
      const result = await model(question, {
        pooling: 'mean',
        normalize: true,
      });
      
      const queryEmbedding = Array.from(result.data);
      
      // Test the combined search
      const searchQuery = `
        (
          SELECT 
            'principle' as source_type,
            principle_number::text as source_id,
            principle_text as content,
            1 - (embedding <=> $1::vector) as similarity
          FROM agile_principles
          WHERE embedding IS NOT NULL
        )
        UNION ALL
        (
          SELECT 
            'document' as source_type,
            id::text as source_id,
            content,
            1 - (embedding <=> $1::vector) as similarity
          FROM documents
          WHERE embedding IS NOT NULL
        )
        ORDER BY similarity DESC
        LIMIT 5
      `;
      
      const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
      const searchResult = await client.query(searchQuery, [formattedEmbedding]);
      
      console.log(`📚 Found ${searchResult.rows.length} similar content items:`);
      
      const principles = searchResult.rows.filter(row => row.source_type === 'principle');
      const documents = searchResult.rows.filter(row => row.source_type === 'document');
      
      searchResult.rows.forEach((row, index) => {
        const sourceLabel = row.source_type === 'principle' ? `Principle ${row.source_id}` : `Doc ${row.source_id}`;
        console.log(`   ${index + 1}. [${(row.similarity * 100).toFixed(1)}%] ${sourceLabel}: ${row.content.substring(0, 60)}...`);
      });
      
      console.log(`   📊 Summary: ${principles.length} principles, ${documents.length} documents\n`);
    }
    
    await client.end();
    console.log('✅ Combined knowledge test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testCombinedKnowledge().catch(console.error);
}

module.exports = { testCombinedKnowledge };
