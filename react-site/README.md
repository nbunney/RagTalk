# RAG Talk Demo - React Site

This is a React application that provides a user interface for asking questions
that will be forwarded to your RAG system API.

## Features

- Clean, modern UI for entering questions
- Real-time loading states and error handling
- Responsive design that works on desktop and mobile
- API integration ready for your RAG backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the
   browser.

## API Integration

The app expects an API endpoint at `/api/question` that accepts POST requests
with the following format:

```json
{
  "question": "Your question here"
}
```

And should return a response in this format:

```json
{
  "answer": "The response to the question"
}
```

## Customization

- Modify `src/App.js` to change the API endpoint or request format
- Update `src/App.css` to customize the styling
- The app is built with modern React hooks and is fully functional out of the
  box

## Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.
