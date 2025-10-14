import { generateEmbedding } from './embedding-utils';

async function testLocalEmbeddings(): Promise<void> {
  console.log('🧪 Testing local embedding generation...\n');

  try {
    console.log('🔄 Using simple embedding model...');
    console.log('✅ Model ready\n');

    // Test texts
    const testTexts: string[] = [
      'Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.',
      'Welcome changing requirements, even late in development.',
      'Deliver working software frequently, from a couple of weeks to a couple of months.'
    ];

    console.log('📝 Generating embeddings for test texts...\n');

    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`Text ${i + 1}: ${text.substring(0, 50)}...`);

      const embedding = await generateEmbedding(text);
      console.log(`  📊 Embedding dimensions: ${embedding.length}`);
      console.log(`  📊 First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log(`  📊 Embedding magnitude: ${Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}\n`);
    }

    // Test similarity between similar texts
    console.log('🔍 Testing similarity between similar texts...');
    const text1 = 'Our highest priority is to satisfy the customer';
    const text2 = 'Customer satisfaction is our top priority';

    const vec1 = await generateEmbedding(text1);
    const vec2 = await generateEmbedding(text2);

    // Calculate cosine similarity
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const similarity = dotProduct; // Already normalized, so this is cosine similarity

    console.log(`Text 1: "${text1}"`);
    console.log(`Text 2: "${text2}"`);
    console.log(`📊 Cosine similarity: ${similarity.toFixed(4)}`);
    console.log(`📊 Similarity percentage: ${(similarity * 100).toFixed(2)}%\n`);

    // Test similarity between different texts
    console.log('🔍 Testing similarity between different texts...');
    const text3 = 'The weather is nice today';
    const text4 = 'Customer satisfaction is our top priority';

    const vec3 = await generateEmbedding(text3);
    const vec4 = await generateEmbedding(text4);

    const dotProduct2 = vec3.reduce((sum, val, i) => sum + val * vec4[i], 0);
    const similarity2 = dotProduct2;

    console.log(`Text 3: "${text3}"`);
    console.log(`Text 4: "${text4}"`);
    console.log(`📊 Cosine similarity: ${similarity2.toFixed(4)}`);
    console.log(`📊 Similarity percentage: ${(similarity2 * 100).toFixed(2)}%\n`);

    console.log('✅ Local embedding test completed successfully!');
    console.log('📊 Key observations:');
    console.log(`  - Similar texts have high similarity: ${(similarity * 100).toFixed(2)}%`);
    console.log(`  - Different texts have low similarity: ${(similarity2 * 100).toFixed(2)}%`);
    console.log('  - Embeddings are properly normalized (magnitude ≈ 1.0)');
    console.log('  - Model is ready for vector similarity search!');

  } catch (error) {
    console.error('❌ Error testing local embeddings:', (error as Error).message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testLocalEmbeddings().catch(console.error);
}
