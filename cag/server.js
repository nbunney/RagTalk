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
try {
  const principlesPath = path.join(__dirname, 'agileprinciples.txt');
  AGILE_PRINCIPLES = fs.readFileSync(principlesPath, 'utf8');
  console.log('✅ Agile principles loaded successfully');
} catch (error) {
  console.error('❌ Error loading agile principles:', error.message);
  AGILE_PRINCIPLES = 'Agile principles not available.';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'X.ai API Server',
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

    // Augment the question with Agile principles context and fourth-grade instruction
    const augmentedQuestion = `Context: Here are the Agile principles that should guide the response:\n\n${AGILE_PRINCIPLES}\n\nQuestion: ${question}\n\n${AUGMENTATION}`;

    console.log('🔍 Original question:', question);
    console.log('📚 Context loaded:', AGILE_PRINCIPLES.length, 'characters');
    console.log('📝 System instruction:', AUGMENTATION);
    console.log('🤖 Calling X.ai API with full context...');

    // Call X.ai API
    const response = await axios.post(XAI_API_URL, {
      model: 'grok-3',
      messages: [
        {
          role: 'system',
          content: `Context: Here are the Agile principles that should guide the response:\n\n${AGILE_PRINCIPLES}\n\n${AUGMENTATION}`
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const answer = response.data.choices[0].message.content;

    console.log('✅ X.ai response received');
    console.log('📄 Response length:', answer.length, 'characters');

    res.json({ 
      answer: answer,
      original_question: question,
      augmented_question: augmentedQuestion,
      model: 'grok-3',
      context_used: 'Agile Principles',
      context_length: AGILE_PRINCIPLES.length
    });

  } catch (error) {
    console.error('❌ Error calling X.ai API:', error.response?.data || error.message);
    
    res.status(500).json({ 
      error: 'Failed to get response from X.ai API',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CAG API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`❓ Question endpoint: http://localhost:${PORT}/api/question`);
  console.log(`🔑 Make sure to set XAI_API_KEY environment variable`);
  console.log(`📚 Agile principles context loaded: ${AGILE_PRINCIPLES.length} characters`);
});

module.exports = app;
