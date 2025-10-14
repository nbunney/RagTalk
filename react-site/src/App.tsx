import React, { useState } from 'react';
import './App.css';

interface ApiResponse {
  answer: string;
  original_question: string;
  augmented_question?: string;
  model: string;
  context_used?: string;
  context_length?: number;
  relevant_content?: string[];
  relevant_principle_numbers?: string[];
  total_sources?: number;
  selected_count?: number;
  principles_found?: number;
  documents_found?: number;
  rag_mode?: string;
  similarity_scores?: number[];
  avg_similarity?: string;
}

function App(): JSX.Element {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Forward the question to the API
      const apiResponse = await fetch('http://localhost:8000/api/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const data: ApiResponse = await apiResponse.json();
      setResponse(data.answer || 'No response received');
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>RAG Talk Demo</h1>
          <p>Ask a question and see how it gets processed through our RAG system</p>
        </header>

        <div className="question-section">
          <form onSubmit={handleSubmit} className="question-form">
            <div className="input-group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question here..."
                className="question-input"
                rows={4}
                disabled={loading}
              />
              <button
                type="submit"
                className="submit-button"
                disabled={loading || !question.trim()}
              >
                {loading ? 'Processing...' : 'Ask Question'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {response && (
          <div className="response-section">
            <h3>Response:</h3>
            <div className="response-content">
              {response}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Processing your question...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
