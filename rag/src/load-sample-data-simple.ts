import fs from 'fs';
import path from 'path';
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


// Load Agile principles from text file
async function loadAgilePrinciples(): Promise<void> {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('📚 Loading Agile principles from text file...');

    // Read the agile principles file
    const principlesPath = path.join(__dirname, '..', 'sample-data', 'agileprinciples.txt');
    const principlesContent = fs.readFileSync(principlesPath, 'utf8');

    // Split into individual principles (assuming each principle is on a new line or separated by numbers)
    const principles = principlesContent
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, index) => ({
        number: index + 1,
        text: line.trim()
      }));

    console.log(`📝 Found ${principles.length} principles to process`);

    // Clear existing principles
    await client.query('DELETE FROM agile_principles');
    console.log('🗑️  Cleared existing principles');

    // Process each principle
    for (const principle of principles) {
      console.log(`\n🔄 Processing Principle ${principle.number}: ${principle.text.substring(0, 50)}...`);

      // Generate embedding for the principle
      const embedding = await generateEmbedding(principle.text);

      console.log(`  📊 Generated embedding: ${embedding.length} dimensions`);
      console.log(`  📊 First 8 values: [${embedding.slice(0, 8).map((v: number) => v.toFixed(4)).join(', ')}...]`);

      // Insert into database
      await client.query(
        'INSERT INTO agile_principles (principle_number, principle_text, embedding) VALUES ($1, $2, $3)',
        [principle.number, principle.text, `[${embedding.join(',')}]`]
      );

      console.log(`  ✅ Stored principle ${principle.number} with embedding`);
    }

    console.log('\n✅ All Agile principles loaded successfully!');

  } catch (error) {
    console.error('❌ Error loading Agile principles:', (error as Error).message);
    throw error;
  } finally {
    await client.end();
  }
}

// Load sample Q&A documents
async function loadSampleDocuments(): Promise<void> {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('\n📚 Loading sample Q&A documents...');

    // Read the sample data file
    const sampleDataPath = path.join(__dirname, '..', 'sample-data', 'software-engineering-qa.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

    console.log(`📝 Found ${sampleData.length} Q&A pairs to process`);

    // Clear existing documents
    await client.query('DELETE FROM documents');
    console.log('🗑️  Cleared existing documents');

    // Process each Q&A pair
    for (let i = 0; i < sampleData.length; i++) {
      const qa = sampleData[i];
      const content = `Question: ${qa.question}\nAnswer: ${qa.answer}`;

      console.log(`\n🔄 Processing Q&A ${i + 1}: ${qa.question.substring(0, 50)}...`);

      // Generate embedding for the content
      const embedding = await generateEmbedding(content);

      console.log(`  📊 Generated embedding: ${embedding.length} dimensions`);

      // Insert into database
      await client.query(
        'INSERT INTO documents (content, embedding) VALUES ($1, $2)',
        [content, `[${embedding.join(',')}]`]
      );

      console.log(`  ✅ Stored Q&A ${i + 1} with embedding`);
    }

    console.log('\n✅ All sample documents loaded successfully!');

  } catch (error) {
    console.error('❌ Error loading sample documents:', (error as Error).message);
    throw error;
  } finally {
    await client.end();
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('🚀 Starting sample data loading process with simple embeddings...\n');

    // Load Agile principles
    await loadAgilePrinciples();

    // Load sample documents
    await loadSampleDocuments();

    console.log('\n🎉 Sample data loading completed successfully!');
    console.log('📊 Database now contains:');
    console.log('  - Agile principles with simple embeddings (TF-IDF based)');
    console.log('  - Software engineering Q&A documents with embeddings');
    console.log('\n🔧 You can now test the RAG system with vector similarity search!');

  } catch (error) {
    console.error('❌ Error in main process:', (error as Error).message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
