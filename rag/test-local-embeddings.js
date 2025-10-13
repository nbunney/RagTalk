async function testLocalEmbeddings() {
  // Dynamic import for ES module
  const { pipeline } = await import('@xenova/transformers');
  console.log('🧪 Testing local embedding generation...\n');
  
  try {
    // Load the model
    console.log('🔄 Loading all-MiniLM-L6-v2 model...');
    const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model loaded successfully\n');
    
    // Test texts
    const testTexts = [
      'Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.',
      'Welcome changing requirements, even late in development.',
      'Deliver working software frequently, from a couple of weeks to a couple of months.'
    ];
    
    console.log('📝 Generating embeddings for test texts...\n');
    
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`Text ${i + 1}: ${text.substring(0, 50)}...`);
      
      const result = await model(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      const embedding = Array.from(result.data);
      console.log(`  📊 Embedding dimensions: ${embedding.length}`);
      console.log(`  📊 First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log(`  📊 Embedding magnitude: ${Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}\n`);
    }
    
    // Test similarity between similar texts
    console.log('🔍 Testing similarity between similar texts...');
    const text1 = 'Our highest priority is to satisfy the customer';
    const text2 = 'Customer satisfaction is our top priority';
    
    const emb1 = await model(text1, { pooling: 'mean', normalize: true });
    const emb2 = await model(text2, { pooling: 'mean', normalize: true });
    
    const vec1 = Array.from(emb1.data);
    const vec2 = Array.from(emb2.data);
    
    // Calculate cosine similarity
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const similarity = dotProduct; // Already normalized, so this is cosine similarity
    
    console.log(`Text 1: "${text1}"`);
    console.log(`Text 2: "${text2}"`);
    console.log(`📊 Cosine similarity: ${similarity.toFixed(4)}`);
    console.log(`📊 Similarity percentage: ${(similarity * 100).toFixed(2)}%\n`);
    
    console.log('✅ Local embedding test completed successfully!');
    console.log('🎉 Ready to use local embeddings in your RAG system!');
    
  } catch (error) {
    console.error('❌ Error testing local embeddings:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLocalEmbeddings().catch(console.error);
}

module.exports = { testLocalEmbeddings };
