const axios = require('axios');

const RAG_SERVER_URL = 'http://localhost:8000';
const TEST_QUESTION = 'What is the optimal number of software engineers to have on a large project?';

async function testRAGMode(useVectorDB, modeName) {
  console.log(`\n🧪 Testing ${modeName}...`);
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.post(`${RAG_SERVER_URL}/api/question`, {
      question: TEST_QUESTION
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    
    console.log(`📝 Question: ${data.original_question}`);
    console.log(`🔧 RAG Mode: ${data.rag_mode}`);
    console.log(`📚 Selected ${data.selected_count} principles:`);
    
    data.relevant_principles.forEach((principle, index) => {
      const similarity = data.similarity_scores ? `[${(data.similarity_scores[index] * 100).toFixed(1)}%]` : '';
      console.log(`   ${index + 1}. ${similarity} ${principle.substring(0, 80)}...`);
    });
    
    if (data.avg_similarity) {
      console.log(`📊 Average Similarity: ${(data.avg_similarity * 100).toFixed(1)}%`);
    }
    
    console.log(`\n🤖 Answer: ${data.answer.substring(0, 200)}...`);
    
  } catch (error) {
    console.error(`❌ Error testing ${modeName}:`, error.message);
    if (error.response?.data) {
      console.error('   Details:', error.response.data);
    }
  }
}

async function main() {
  console.log('🚀 RAG Mode Comparison Test');
  console.log('Testing question:', TEST_QUESTION);
  
  // Test Simple Text Matching (CAG-style)
  console.log('\n📋 Starting server with USE_VECTOR_DB=false...');
  console.log('   (This simulates the CAG approach)');
  
  // Test Vector Database RAG
  console.log('\n📋 Starting server with USE_VECTOR_DB=true...');
  console.log('   (This uses our new vector database approach)');
  
  console.log('\n💡 To run this test:');
  console.log('1. Start server with: USE_VECTOR_DB=false npm start');
  console.log('2. Run this test script');
  console.log('3. Stop server and start with: USE_VECTOR_DB=true npm start');
  console.log('4. Run this test script again');
  console.log('5. Compare the results!');
  
  console.log('\n🎯 Expected Differences:');
  console.log('• Simple Text: Uses X.ai to select relevant principles');
  console.log('• Vector DB: Uses semantic similarity search with local embeddings');
  console.log('• Vector DB: Shows similarity scores for each principle');
  console.log('• Vector DB: More precise semantic matching');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRAGMode };
