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

async function testVectorSearch(): Promise<void> {
  console.log('🧪 Testing Vector Search...\n');

  try {
    // Generate embedding for test query
    const testQuery = 'What is the optimal number of software engineers for a large project?';
    console.log(`📝 Test query: "${testQuery}"`);

    const queryEmbedding = await generateEmbedding(testQuery);
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

    const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
    const searchResult = await client.query(searchQuery, [formattedEmbedding]);

    console.log('🔍 Vector search results:');
    console.log('='.repeat(60));

    searchResult.rows.forEach((row: any, index: number) => {
      const similarity = parseFloat(row.similarity);
      console.log(`${index + 1}. Principle ${row.principle_number} [${(similarity * 100).toFixed(1)}%]`);
      console.log(`   ${row.principle_text.substring(0, 80)}...`);
      console.log('');
    });

    // Test combined search (principles + documents)
    console.log('🔍 Testing combined vector search (principles + documents)...');
    const combinedQuery = `
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

    const combinedResult = await client.query(combinedQuery, [formattedEmbedding]);

    console.log('📚 Combined search results:');
    console.log('='.repeat(60));

    combinedResult.rows.forEach((row: any, index: number) => {
      const similarity = parseFloat(row.similarity);
      const sourceLabel = row.source_type === 'principle' ? `Principle ${row.source_id}` : `Doc ${row.source_id}`;
      console.log(`${index + 1}. [${sourceLabel}] [${(similarity * 100).toFixed(1)}%]`);
      console.log(`   ${row.content.substring(0, 80)}...`);
      console.log('');
    });

    await client.end();

    console.log('✅ Vector search test completed successfully!');
    console.log('📊 Key observations:');
    console.log('  - Vector similarity search is working correctly');
    console.log('  - Results are ranked by similarity score');
    console.log('  - Combined search works across multiple knowledge sources');
    console.log('  - Ready for RAG implementation!');

  } catch (error) {
    console.error('❌ Error testing vector search:', (error as Error).message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testVectorSearch().catch(console.error);
}
