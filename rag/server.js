const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// X.ai API configuration
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_API_KEY = process.env.XAI_API_KEY;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'raguser',
  password: process.env.DB_PASSWORD || 'ragpassword',
  database: process.env.DB_NAME || 'ragdb',
};

// RAG Configuration - Always use vector database
const USE_VECTOR_DB = true;

// Augmentation text for eighth-grade level responses
const AUGMENTATION = "Reply using the first person 'we' and as if you are talking to an eighth grader.";

// Local embedding model
let embeddingPipeline = null;
let pipeline = null;

// Note: Agile principles are now stored in the vector database
// No need to load from text file since we use semantic search

// Initialize the local embedding model
async function initializeEmbeddingModel() {
  if (!embeddingPipeline) {
    if (!pipeline) {
      // Dynamic import for ES module
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
    }
    console.log('🔄 Loading local embedding model (all-MiniLM-L6-v2)...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Local embedding model loaded successfully');
  }
  return embeddingPipeline;
}

// Generate embedding for text using local model
async function generateEmbedding(text) {
  try {
    const model = await initializeEmbeddingModel();
    
    // Generate embedding
    const result = await model(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Convert to array format
    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

// Vector similarity search in database - combines both knowledge sources
async function findSimilarContent(queryEmbedding, limit = 5) {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Search both Agile principles and software engineering Q&A documents
    const query = `
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
      LIMIT $2
    `;
    
    // Format the embedding array to match the stored format exactly
    const formattedEmbedding = `[${queryEmbedding.join(',')}]`;
    const result = await client.query(query, [formattedEmbedding, limit]);
    
    return result.rows.map(row => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      content: row.content,
      similarity: parseFloat(row.similarity)
    }));
    
  } finally {
    await client.end();
  }
}

// Helper function to call X.ai API
async function callXaiAPI(messages, maxTokens = 1000) {
  const response = await axios.post(XAI_API_URL, {
    model: 'grok-3',
    messages: messages,
    max_tokens: maxTokens,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'RAG API Server',
    timestamp: new Date().toISOString()
  });
});

// Main question endpoint
app.post('/api/question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    if (!XAI_API_KEY) {
      return res.status(500).json({ 
        error: 'X.ai API key not configured. Please set XAI_API_KEY environment variable.' 
      });
    }

    console.log('🔍 Original question:', question);
    console.log('🔧 RAG Mode: Vector Database (with local embeddings)');

    let relevantPrinciples = [];
    let relevantNumbers = [];
    let similarityScores = [];

    // VECTOR DATABASE RAG - Use semantic similarity search across both knowledge sources
    console.log('🔍 Step 1: Generating query embedding...');
    const queryEmbedding = await generateEmbedding(question);
    console.log(`📊 Query embedding: ${queryEmbedding.length} dimensions`);

    console.log('🔍 Step 2: Finding similar content using vector search...');
    const similarContent = await findSimilarContent(queryEmbedding, 5);
    
    // Separate principles and documents for response metadata
    const principles = similarContent.filter(item => item.sourceType === 'principle');
    const documents = similarContent.filter(item => item.sourceType === 'document');
    
    relevantPrinciples = similarContent.map(item => item.content);
    relevantNumbers = principles.map(p => p.sourceId);
    similarityScores = similarContent.map(item => item.similarity);

    console.log(`📚 Found ${similarContent.length} similar content items:`);
    similarContent.forEach((item, index) => {
      const sourceLabel = item.sourceType === 'principle' ? `Principle ${item.sourceId}` : `Doc ${item.sourceId}`;
      console.log(`   ${index + 1}. [${(item.similarity * 100).toFixed(1)}%] ${sourceLabel}: ${item.content.substring(0, 60)}...`);
    });

    // STEP 3: Generate final response with selected context
    const relevantContext = relevantPrinciples.join('\n');
    console.log('🤖 Step 3: Calling X.ai API with selected context...');
    
    const answer = await callXaiAPI([
      { 
        role: 'system', 
        content: `Context: Here are the relevant Agile principles for this question:\n\n${relevantContext}\n\n${AUGMENTATION}` 
      },
      { 
        role: 'user', 
        content: question 
      }
    ], 1000);

    console.log('✅ X.ai response received');
    console.log('📄 Response length:', answer.length, 'characters');

    const response = { 
      answer: answer,
      original_question: question,
      relevant_content: relevantPrinciples,
      relevant_principle_numbers: relevantNumbers,
      total_sources: similarContent.length,
      selected_count: relevantPrinciples.length,
      principles_found: principles.length,
      documents_found: documents.length,
      model: 'grok-4',
      rag_mode: 'vector_database_combined'
    };

    // Add similarity scores
    if (similarityScores.length > 0) {
      response.similarity_scores = similarityScores;
      response.avg_similarity = (similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length).toFixed(3);
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Error in RAG process:', error.response?.data || error.message);
    
    res.status(500).json({ 
      error: 'Failed to process RAG request',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RAG API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`❓ Question endpoint: http://localhost:${PORT}/api/question`);
  console.log(`🔑 Make sure to set XAI_API_KEY environment variable`);
  console.log(`📚 Knowledge sources: Vector database (Agile principles + Q&A documents)`);
  console.log(`🔧 RAG Mode: Vector Database (with local embeddings)`);
  console.log(`🗄️  Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

module.exports = app;
