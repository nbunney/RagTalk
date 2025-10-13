# RAG API Server - RAG Talk Demo

This is the third API server for your RAG talk demo. It takes questions from the
React frontend and forwards them to the RAG API with a specific augmentation to
make responses appropriate for eighth graders.

## Features

- Forwards questions to RAG's API
- Augments requests with: "Reply using the first person 'we' and as if you are
  talking to an eighth grader."
- Provides detailed logging for demo purposes
- Health check endpoint
- Error handling and validation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env and add your X.ai API key
   ```

3. Start the server:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/question` - Main question endpoint

## Request Format

```json
{
   "question": "What is photosynthesis?"
}
```

## Response Format

```json
{
   "answer": "We use sunlight to make food for plants! It's like a kitchen in the leaves...",
   "original_question": "What is photosynthesis?",
   "augmented_question": "What is photosynthesis?\n\nReply using the first person 'we' and as if you are talking to a fourth grader.",
   "model": "grok-4"
}
```

## Demo Usage

1. Start this server: `npm start`
2. Start the React frontend: `cd ../react-site && npm start`
3. Ask questions in the React app - they'll be processed through X.ai with
   fourth-grade augmentation

## Environment Variables

- `XAI_API_KEY` - Your X.ai API key (required)
- `PORT` - Server port (default: 8000)
