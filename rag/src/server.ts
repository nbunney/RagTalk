import express, { Request, Response } from 'express';
import cors from 'cors';
import axios, { AxiosResponse } from 'axios';
import { Client } from 'pg';
import { generateEmbedding } from './embedding-utils';
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

// RAG Configuration - Always use vector database
const USE_VECTOR_DB = true;

// Augmentation text for eighth-grade level responses
const AUGMENTATION = "Reply using the first person 'we' and as if you are talking to an eighth grader.";


// Interface for similar content result
interface SimilarContent {
  sourceType: 'principle' | 'document';
  sourceId: string;
  content: string;
  similarity: number;
}

// Vector similarity search in database - combines both knowledge sources
async function findSimilarContent(queryEmbedding: number[], limit: number = 5): Promise<SimilarContent[]> {
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

    return result.rows.map((row: any) => ({
      sourceType: row.source_type as 'principle' | 'document',
      sourceId: row.source_id,
      content: row.content,
      similarity: parseFloat(row.similarity)
    }));

  } finally {
    await client.end();
  }
}

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

// Helper function to call X.ai API
async function callXaiAPI(messages: XaiMessage[], maxTokens: number = 1000): Promise<string> {
  const response: AxiosResponse<XaiResponse> = await axios.post(XAI_API_URL, {
    model: 'grok-3',
    messages: messages,
    max_tokens: maxTokens,
    temperature: 0.7
  } as XaiRequest, {
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
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
  relevant_content: string[];
  relevant_principle_numbers: string[];
  total_sources: number;
  selected_count: number;
  principles_found: number;
  documents_found: number;
  model: string;
  rag_mode: string;
  similarity_scores?: number[];
  avg_similarity?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    service: 'RAG API Server',
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

    console.log('🔍 Original question:', question);
    console.log('🔧 RAG Mode: Vector Database (with enhanced TF-IDF embeddings)');

    let relevantPrinciples: string[] = [];
    let relevantNumbers: string[] = [];
    let similarityScores: number[] = [];

    // VECTOR DATABASE RAG - Use semantic similarity search across both knowledge sources
    console.log('🔍 Step 1: Generating query embedding...');
    const queryEmbedding = await generateEmbedding(question);
    console.log(`📊 Query embedding: ${queryEmbedding.length} dimensions (enhanced TF-IDF embeddings)`);

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

    const response: QuestionResponse = {
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
    console.error('❌ Error in RAG process:', (error as any).response?.data || (error as Error).message);

    res.status(500).json({
      error: 'Failed to process RAG request',
      details: (error as any).response?.data?.error?.message || (error as Error).message
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
  console.log(`🔧 RAG Mode: Vector Database (with enhanced TF-IDF embeddings)`);
  console.log(`🗄️  Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

export default app;
