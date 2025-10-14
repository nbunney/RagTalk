import express, { Request, Response } from 'express';
import cors from 'cors';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '8000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// X.ai API configuration
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_API_KEY: string | undefined = process.env.XAI_API_KEY;

// Augmentation text for eighth-grade level responses
const AUGMENTATION = "Reply using the first person 'we' and as if you are talking to an eighth grader.";

// Interface for X.ai API request
interface XaiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface XaiRequest {
  model: string;
  messages: XaiMessage[];
  max_tokens: number;
  temperature: number;
}

interface XaiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface QuestionRequest {
  question: string;
}

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface QuestionResponse {
  answer: string;
  original_question: string;
  augmented_question: string;
  model: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    service: 'X.ai API Server',
    timestamp: new Date().toISOString()
  });
});

// Main question endpoint
app.post('/api/question', async (req: Request<{}, QuestionResponse | ErrorResponse, QuestionRequest>, res: Response<QuestionResponse | ErrorResponse>): Promise<void> => {
  try {
    const { question } = req.body;

    if (!question) {
      res.status(400).json({
        error: 'Question is required'
      });
      return;
    }

    if (!XAI_API_KEY) {
      res.status(500).json({
        error: 'X.ai API key not configured. Please set XAI_API_KEY environment variable.'
      });
      return;
    }

    // Augment the question with fourth-grade instruction
    const augmentedQuestion = `${question}\n\n${AUGMENTATION}`;

    console.log('🔍 Original question:', question);
    console.log('📝 System instruction:', AUGMENTATION);
    console.log('🤖 Calling X.ai API...');

    // Call X.ai API
    const response: AxiosResponse<XaiResponse> = await axios.post(XAI_API_URL, {
      model: 'grok-4',
      messages: [
        {
          role: 'system',
          content: AUGMENTATION
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    } as XaiRequest, {
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
      model: 'grok-4'
    });

  } catch (error) {
    console.error('❌ Error calling X.ai API:', (error as any).response?.data || (error as Error).message);

    res.status(500).json({
      error: 'Failed to get response from X.ai API',
      details: (error as any).response?.data?.error?.message || (error as Error).message
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

export default app;
