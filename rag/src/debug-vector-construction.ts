import { Client } from 'pg';
import { generateEmbedding } from './embedding-utils';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const dbConfig: DbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'raguser',
  password: process.env.DB_PASSWORD || 'ragpassword',
  database: process.env.DB_NAME || 'ragdb',
};

async function debugVectorConstruction(): Promise<void> {
  console.log('🔍 Debugging Vector Construction...\n');

  try {
    console.log('🔄 Using simple embedding model...');
    console.log('✅ Model ready\n');

    // Generate embedding
    const testQuery = 'What is the optimal number of software engineers for a large project?';
    console.log(`📝 Test query: "${testQuery}"`);

    const queryEmbedding = await generateEmbedding(testQuery);
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

    // Test vector search with both formats
    console.log('🔍 Testing vector search with format 1...');
    const searchQuery1 = `
      SELECT 
        principle_number,
        principle_text,
        1 - (embedding <=> $1::vector) as similarity
      FROM agile_principles
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 1
    `;

    try {
      const result1 = await client.query(searchQuery1, [vectorString1]);
      if (result1.rows.length > 0) {
        console.log('✅ Format 1 works!');
        console.log(`   Best match: Principle ${result1.rows[0].principle_number} [${(parseFloat(result1.rows[0].similarity) * 100).toFixed(1)}%]`);
      } else {
        console.log('❌ Format 1: No results found');
      }
    } catch (error) {
      console.log('❌ Format 1 failed:', (error as Error).message);
    }

    console.log('\n🔍 Testing vector search with format 2...');
    try {
      const result2 = await client.query(searchQuery1, [vectorString2]);
      if (result2.rows.length > 0) {
        console.log('✅ Format 2 works!');
        console.log(`   Best match: Principle ${result2.rows[0].principle_number} [${(parseFloat(result2.rows[0].similarity) * 100).toFixed(1)}%]`);
      } else {
        console.log('❌ Format 2: No results found');
      }
    } catch (error) {
      console.log('❌ Format 2 failed:', (error as Error).message);
    }

    // Check stored embedding format
    console.log('\n🔍 Checking stored embedding format...');
    const checkQuery = `
      SELECT 
        principle_number,
        LEFT(embedding::text, 100) as embedding_preview
      FROM agile_principles
      WHERE embedding IS NOT NULL
      LIMIT 1
    `;

    const checkResult = await client.query(checkQuery);
    if (checkResult.rows.length > 0) {
      console.log('📊 Stored embedding format:');
      console.log(`   Principle ${checkResult.rows[0].principle_number}: ${checkResult.rows[0].embedding_preview}...`);
    }

    await client.end();

    console.log('\n✅ Vector construction debugging completed!');
    console.log('📊 Recommendations:');
    console.log('  - Use consistent formatting for vector strings');
    console.log('  - Ensure precision matches stored embeddings');
    console.log('  - Test vector search queries before production use');

  } catch (error) {
    console.error('❌ Error debugging vector construction:', (error as Error).message);
    throw error;
  }
}

// Run the debug
if (require.main === module) {
  debugVectorConstruction().catch(console.error);
}
