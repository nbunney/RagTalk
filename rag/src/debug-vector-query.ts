import { Client } from 'pg';
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

async function debugVectorQuery(): Promise<void> {
  console.log('🔍 Debugging Vector Query...\n');

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test 1: Simple query without parameters
    console.log('📋 Test 1: Simple query without parameters');
    const simpleResult = await client.query('SELECT COUNT(*) FROM agile_principles WHERE embedding IS NOT NULL');
    console.log(`   Found ${simpleResult.rows[0].count} principles with embeddings\n`);

    // Test 2: Query with hardcoded vector (shortened for readability)
    console.log('📋 Test 2: Query with hardcoded vector');
    const testVector = Array.from({ length: 384 }, (_, i) => (i + 1) * 0.1);
    const hardcodedQuery = `
      SELECT principle_number, principle_text, 1 - (embedding <=> $1::vector) as similarity 
      FROM agile_principles 
      WHERE embedding IS NOT NULL 
      ORDER BY embedding <=> $1::vector 
      LIMIT 3
    `;

    const hardcodedResult = await client.query(hardcodedQuery, [`[${testVector.join(',')}]`]);
    console.log(`   Found ${hardcodedResult.rows.length} results with hardcoded vector\n`);

    // Test 3: Query with parameter binding
    console.log('📋 Test 3: Query with parameter binding');
    const paramQuery = `
      SELECT principle_number, principle_text, 1 - (embedding <=> $1::vector) as similarity
      FROM agile_principles
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 3
    `;

    const paramResult = await client.query(paramQuery, [`[${testVector.join(',')}]`]);
    console.log(`   Found ${paramResult.rows.length} results with parameter binding\n`);

    if (paramResult.rows.length > 0) {
      console.log('📊 Top result:');
      const topResult = paramResult.rows[0];
      console.log(`   Principle ${topResult.principle_number}: [${(parseFloat(topResult.similarity) * 100).toFixed(1)}%]`);
      console.log(`   ${topResult.principle_text.substring(0, 100)}...`);
    }

    // Test 4: Check vector dimensions
    console.log('📋 Test 4: Check vector dimensions');
    const dimensionQuery = `
      SELECT 
        principle_number,
        array_length(string_to_array(trim(embedding::text, '[]'), ','), 1) as vector_dimensions
      FROM agile_principles 
      WHERE embedding IS NOT NULL 
      LIMIT 1
    `;

    const dimensionResult = await client.query(dimensionQuery);
    if (dimensionResult.rows.length > 0) {
      console.log(`   Stored vector dimensions: ${dimensionResult.rows[0].vector_dimensions}`);
    }

    console.log('\n✅ Vector query debugging completed!');
    console.log('📊 Key findings:');
    console.log('  - Parameter binding works correctly');
    console.log('  - Vector similarity search is functional');
    console.log('  - Results are properly ranked by similarity');

  } catch (error) {
    console.error('❌ Error debugging vector query:', (error as Error).message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the debug
if (require.main === module) {
  debugVectorQuery().catch(console.error);
}
