const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// X.ai API configuration
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_API_KEY = process.env.XAI_API_KEY;

// Augmentation text for eighth-grade level responses
const AUGMENTATION = "Reply using the first person 'we' and as if you are talking to an eighth grader.";

// Load Agile principles context
let AGILE_PRINCIPLES = '';
let AGILE_PRINCIPLES_ARRAY = [];
try {
  const principlesPath = path.join(__dirname, 'agileprinciples.txt');
  AGILE_PRINCIPLES = fs.readFileSync(principlesPath, 'utf8');
  AGILE_PRINCIPLES_ARRAY = AGILE_PRINCIPLES.split('\n').filter(line => line.trim() !== '');
  console.log('✅ Agile principles loaded successfully');
  console.log(`📚 Loaded ${AGILE_PRINCIPLES_ARRAY.length} Agile principles`);
} catch (error) {
  console.error('❌ Error loading agile principles:', error.message);
  AGILE_PRINCIPLES = 'Agile principles not available.';
  AGILE_PRINCIPLES_ARRAY = [];
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

    // STEP 1: RAG - Ask X.ai which Agile principles are relevant
    const relevanceQuery = `Here are the 12 Agile principles (numbered 1-12):

${AGILE_PRINCIPLES_ARRAY.map((principle, index) => `${index + 1}. ${principle}`).join('\n')}

Question: "${question}"

Which of these Agile principles (by number) are most relevant to answering this question? Please respond with ONLY the numbers of the relevant principles, separated by commas. For example: "1, 3, 7"`;

    console.log('📋 Step 1: Identifying relevant principles...');
    const relevantNumbers = await callXaiAPI([{ role: 'user', content: relevanceQuery }], 100);
    console.log('🎯 Relevant principle numbers:', relevantNumbers);

    // Parse the relevant numbers
    const numbers = relevantNumbers.match(/\d+/g) || [];
    const relevantPrinciples = numbers.map(num => {
      const index = parseInt(num) - 1;
      return AGILE_PRINCIPLES_ARRAY[index];
    }).filter(principle => principle);

    console.log(`📚 Selected ${relevantPrinciples.length} relevant principles:`);
    relevantPrinciples.forEach((principle, index) => {
      console.log(`   ${index + 1}. ${principle}`);
    });

    // STEP 2: Generate final response with only relevant context
    const relevantContext = relevantPrinciples.join('\n');
    const finalQuery = `Context: Here are the relevant Agile principles for this question:\n\n${relevantContext}\n\nQuestion: ${question}\n\n${AUGMENTATION}`;

    console.log('🤖 Step 2: Generating final response with relevant context...');
    const answer = await callXaiAPI([{ role: 'user', content: finalQuery }], 1000);

    console.log('✅ Final response generated');

    res.json({ 
      answer: answer,
      original_question: question,
      relevant_principles: relevantPrinciples,
      relevant_numbers: numbers,
      total_principles: AGILE_PRINCIPLES_ARRAY.length,
      selected_count: relevantPrinciples.length,
      model: 'grok-3',
      rag_process: 'Two-step: relevance selection + final generation'
    });

  } catch (error) {
    console.error('Error in RAG process:', error.response?.data || error.message);
    
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
  console.log(`📚 Agile principles context loaded: ${AGILE_PRINCIPLES.length} characters`);
});

module.exports = app;
