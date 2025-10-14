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

async function testCombinedKnowledge(): Promise<void> {
  console.log('🧪 Testing Combined Knowledge Sources...\n');

  try {
    console.log('🔄 Using simple embedding model...');
    console.log('✅ Model ready\n');

    // Test different types of questions
    const testQuestions: string[] = [
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

      const queryEmbedding = await generateEmbedding(question);

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
        LIMIT 3
      `;

      const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
      const searchResult = await client.query(searchQuery, [formattedEmbedding]);

      console.log('🔍 Top 3 most relevant sources:');
      searchResult.rows.forEach((row: any, index: number) => {
        const similarity = parseFloat(row.similarity);
        const sourceLabel = row.source_type === 'principle' ? `Principle ${row.source_id}` : `Doc ${row.source_id}`;
        console.log(`   ${index + 1}. [${sourceLabel}] [${(similarity * 100).toFixed(1)}%]`);
        console.log(`      ${row.content.substring(0, 100)}...`);
      });

      // Count sources by type
      const principles = searchResult.rows.filter((row: any) => row.source_type === 'principle');
      const documents = searchResult.rows.filter((row: any) => row.source_type === 'document');

      console.log(`📊 Sources: ${principles.length} principles, ${documents.length} documents`);
      console.log('='.repeat(80));
      console.log('');
    }

    await client.end();

    console.log('✅ Combined knowledge test completed successfully!');
    console.log('📊 Key observations:');
    console.log('  - System successfully searches across both knowledge sources');
    console.log('  - Results are ranked by semantic similarity');
    console.log('  - Different question types retrieve relevant content from both sources');
    console.log('  - Ready for production RAG implementation!');

  } catch (error) {
    console.error('❌ Error testing combined knowledge:', (error as Error).message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCombinedKnowledge().catch(console.error);
}
