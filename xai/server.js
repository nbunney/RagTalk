const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// X.ai API configuration
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_API_KEY = process.env.XAI_API_KEY;

// Augmentation text for fourth-grade level responses
const AUGMENTATION = "Reply using the first person 'we' and as if you are talking to a fourth grader.";

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

    // Augment the question with fourth-grade instruction
    const augmentedQuestion = `${question}\n\n${AUGMENTATION}`;

    console.log('Original question:', question);
    console.log('Augmented question:', augmentedQuestion);

    // Call X.ai API
    const response = await axios.post(XAI_API_URL, {
      model: 'grok-3',
      messages: [
        {
          role: 'user',
          content: augmentedQuestion
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

    console.log('X.ai response:', answer);

    res.json({ 
      answer: answer,
      original_question: question,
      augmented_question: augmentedQuestion,
      model: 'grok-3'
    });

  } catch (error) {
    console.error('Error calling X.ai API:', error.response?.data || error.message);
    
    res.status(500).json({ 
      error: 'Failed to get response from X.ai API',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 X.ai API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`❓ Question endpoint: http://localhost:${PORT}/api/question`);
  console.log(`🔑 Make sure to set XAI_API_KEY environment variable`);
});

module.exports = app;
