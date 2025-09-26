# RAG Talk Demo

A comprehensive demonstration of different AI approaches: X.ai (direct), CAG
(Context-Augmented Generation), and RAG (Retrieval-Augmented Generation). This
project showcases how context and retrieval strategies can improve AI responses.

## 🏗️ Project Structure

```
RAG talk/
├── react-site/          # React frontend for asking questions
├── xai/                 # Direct X.ai API integration
├── cag/                 # Context-Augmented Generation demo
├── rag/                 # Retrieval-Augmented Generation demo
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Set Up the React Frontend

```bash
cd react-site
npm install
npm start
```

The React app will be available at `http://localhost:3000`

### 2. Choose Your Backend API

You can run one of three different API servers to demonstrate different
approaches:

#### Option A: Direct X.ai (Baseline)

```bash
cd xai
cp env.example .env
# Edit .env and add your XAI_API_KEY
npm install
npm start
```

#### Option B: CAG (Context-Augmented Generation)

```bash
cd cag
cp env.example .env
# Edit .env and add your XAI_API_KEY
npm install
npm start
```

#### Option C: RAG (Retrieval-Augmented Generation)

```bash
cd rag
cp env.example .env
# Edit .env and add your XAI_API_KEY
npm install
npm start
```

## 📋 API Comparison

| Approach | Description                               | Context Usage            | Best For                     |
| -------- | ----------------------------------------- | ------------------------ | ---------------------------- |
| **X.ai** | Direct API calls with simple augmentation | Fixed instruction only   | Baseline comparison          |
| **CAG**  | All context included in every request     | All Agile principles     | When all context is relevant |
| **RAG**  | AI selects relevant context dynamically   | Only relevant principles | Large knowledge bases        |

## 🔧 Configuration

### Environment Variables

Each API server requires:

- `XAI_API_KEY` - Your X.ai API key
- `PORT` - Server port (default: 8000)

### API Endpoints

All servers provide:

- `GET /health` - Health check
- `POST /api/question` - Main question endpoint

## 📊 Demo Flow

1. **Start React Frontend** - Provides the user interface
2. **Start API Server** - Choose X.ai, CAG, or RAG
3. **Ask Questions** - Try questions like:
   - "How should we handle changing requirements?"
   - "What's the best way to measure progress?"
   - "How do we work with business people?"
4. **Compare Responses** - Switch between APIs to see the differences

## 🎯 Key Features

### React Frontend

- Clean, modern UI with gradient design
- Real-time loading states and error handling
- Responsive design for desktop and mobile
- Direct API integration (no proxy needed)

### X.ai Server (Baseline)

- Direct calls to X.ai's Grok-3 model
- Eighth-grade level responses
- Simple augmentation with fixed instructions

### CAG Server (Context-Augmented)

- Includes all 12 Agile principles in every request
- Demonstrates context augmentation
- Shows how additional context improves responses

### RAG Server (Retrieval-Augmented)

- Two-step process: relevance selection + generation
- AI intelligently selects relevant Agile principles
- Demonstrates true RAG with dynamic context retrieval
- Detailed logging of the RAG process

## 📚 Agile Principles Context

All servers use the 12 Agile principles from `agileprinciples.txt`:

1. Customer satisfaction through early delivery
2. Welcome changing requirements
3. Deliver working software frequently
4. Business and developers work together daily
5. Build around motivated individuals
6. Face-to-face conversation is most effective
7. Working software is primary measure of progress
8. Sustainable development pace
9. Continuous attention to technical excellence
10. Simplicity is essential
11. Self-organizing teams
12. Regular reflection and adjustment

## 🔄 Switching Between APIs

To demonstrate different approaches:

1. **Stop current server** (Ctrl+C)
2. **Start new server** in different directory
3. **React app continues working** - same endpoint, same port

## 🛠️ Development

### Adding New Context

To add new context files:

1. Add your text file to the desired server directory
2. Update the server code to read and include the file
3. Modify the augmentation logic as needed

### Customizing Responses

Each server can be customized:

- **X.ai**: Modify the `AUGMENTATION` constant
- **CAG**: Update context loading and augmentation
- **RAG**: Adjust relevance selection logic

## 📝 Example Questions for Demo

Try these questions to see the differences between approaches:

- "How should we handle changing requirements?"
- "What's the best way to measure our progress?"
- "How do we work effectively with business stakeholders?"
- "What makes a good development team?"
- "How do we ensure our software is valuable?"

## 🔐 Security Notes

- Never commit `.env` files with real API keys
- Use `env.example` files to show required variables
- The `.gitignore` file protects sensitive information

## 📄 License

MIT License - Feel free to use this demo for educational purposes.

## 🤝 Contributing

This is a demo project, but suggestions and improvements are welcome!

---

**Happy RAG-ing!** 🚀
