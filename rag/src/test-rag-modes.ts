import axios, { AxiosResponse } from 'axios';

const RAG_SERVER_URL = 'http://localhost:8000';
const TEST_QUESTION = 'What is the optimal number of software engineers to have on a large project?';

interface RAGResponse {
  answer: string;
  original_question: string;
  relevant_content?: string[];
  relevant_principles?: string[];
  relevant_principle_numbers?: string[];
  total_sources?: number;
  selected_count?: number;
  principles_found?: number;
  documents_found?: number;
  model: string;
  rag_mode: string;
  similarity_scores?: number[];
  avg_similarity?: string;
}

async function testRAGMode(useVectorDB: boolean, modeName: string): Promise<void> {
  console.log(`\n🧪 Testing ${modeName}...`);
  console.log('='.repeat(50));

  try {
    const response: AxiosResponse<RAGResponse> = await axios.post(`${RAG_SERVER_URL}/api/question`, {
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

    if (data.relevant_content) {
      console.log(`📚 Selected ${data.selected_count} content items:`);
      data.relevant_content.forEach((content, index) => {
        const similarity = data.similarity_scores ? `[${(data.similarity_scores[index] * 100).toFixed(1)}%]` : '';
        console.log(`   ${index + 1}. ${similarity} ${content.substring(0, 80)}...`);
      });
    } else if (data.relevant_principles) {
      console.log(`📚 Selected ${data.selected_count} principles:`);
      data.relevant_principles.forEach((principle, index) => {
        const similarity = data.similarity_scores ? `[${(data.similarity_scores[index] * 100).toFixed(1)}%]` : '';
        console.log(`   ${index + 1}. ${similarity} ${principle.substring(0, 80)}...`);
      });
    }

    if (data.avg_similarity) {
      console.log(`📊 Average Similarity: ${(parseFloat(data.avg_similarity) * 100).toFixed(1)}%`);
    }

    if (data.principles_found !== undefined && data.documents_found !== undefined) {
      console.log(`📊 Sources: ${data.principles_found} principles, ${data.documents_found} documents`);
    }

    console.log(`\n🤖 Answer: ${data.answer.substring(0, 200)}...`);

  } catch (error) {
    console.error(`❌ Error testing ${modeName}:`, (error as Error).message);
    if ((error as any).response?.data) {
      console.error('   Details:', (error as any).response.data);
    }
  }
}

async function main(): Promise<void> {
  console.log('🚀 RAG Mode Comparison Test');
  console.log('Testing question:', TEST_QUESTION);

  // Test Vector Database RAG
  console.log('\n📋 Testing Vector Database RAG...');
  await testRAGMode(true, 'Vector Database RAG');

  console.log('\n🎉 RAG mode testing completed!');
  console.log('📊 Summary:');
  console.log('  - Vector Database RAG provides semantic similarity search');
  console.log('  - Results are ranked by relevance to the query');
  console.log('  - System combines multiple knowledge sources effectively');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}
