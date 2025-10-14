import * as natural from 'natural';

// Global vocabulary and IDF weights for better semantic understanding
let globalVocabulary: Set<string> = new Set();
let idfWeights: Map<string, number> = new Map();
let documentCount = 0;

// Initialize with a basic vocabulary from common words
function initializeVocabulary(): void {
  const commonWords = [
    'software', 'development', 'team', 'project', 'customer', 'satisfaction', 'working', 'frequently',
    'deliver', 'collaboration', 'individuals', 'interactions', 'processes', 'tools', 'comprehensive',
    'documentation', 'face', 'conversation', 'effective', 'method', 'conveying', 'information',
    'development', 'team', 'business', 'people', 'motivated', 'trust', 'environment', 'support',
    'needs', 'challenge', 'skills', 'expertise', 'self', 'organizing', 'teams', 'best', 'architectures',
    'requirements', 'designs', 'emerge', 'regular', 'intervals', 'team', 'reflects', 'becomes',
    'more', 'effective', 'tuning', 'adjusting', 'behavior', 'accordingly', 'optimal', 'number',
    'developers', 'complex', 'agile', 'principles', 'scrum', 'master', 'sprint', 'backlog',
    'standup', 'retrospective', 'kanban', 'continuous', 'integration', 'deployment', 'testing',
    'quality', 'assurance', 'code', 'review', 'refactoring', 'architecture', 'design', 'patterns'
  ];

  commonWords.forEach(word => globalVocabulary.add(word));
}

// Enhanced embedding function using TF-IDF with better semantic understanding
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Initialize vocabulary if not done
    if (globalVocabulary.size === 0) {
      initializeVocabulary();
    }

    // Tokenize and process text
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];

    // Remove stopwords and stem
    const stopwords = natural.stopwords;
    const processedTokens = tokens
      .filter(token => token.length > 2 && !stopwords.includes(token))
      .map(token => stemmer.stem(token));

    // Create 384-dimensional embedding
    const embedding = new Array(384).fill(0);

    // Use multiple hash functions for better distribution
    processedTokens.forEach(token => {
      // Add to global vocabulary
      globalVocabulary.add(token);

      // Use multiple hash functions to distribute words across dimensions
      for (let i = 0; i < 3; i++) {
        let hash = 0;
        const seed = i * 31; // Different seed for each hash function

        for (let j = 0; j < token.length; j++) {
          hash = ((hash << 5) - hash + token.charCodeAt(j) + seed) & 0xffffffff;
        }

        const dimension = Math.abs(hash) % 384;
        embedding[dimension] += 1 / (i + 1); // Weight decreases with hash function index
      }
    });

    // Apply TF-IDF weighting (simplified)
    const tf = processedTokens.length > 0 ? 1 / processedTokens.length : 0;
    for (let i = 0; i < embedding.length; i++) {
      if (embedding[i] > 0) {
        embedding[i] = embedding[i] * tf * Math.log(1 + globalVocabulary.size / (embedding[i] + 1));
      }
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
