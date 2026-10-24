require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Load the sample data (for fallback logic)
const sampleData = require('./data.js');

// Helper function to call Groq
async function callGroq(systemPrompt, userPrompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      max_tokens: 1024
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

// POST /ask - Answer questions about the Constitution
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const systemPrompt = `You are a legal expert on the Constitution of India. 
When answering questions:
1. Provide a clear, plain-language explanation
2. Cite relevant articles by number
3. Mention related Supreme Court cases if applicable
4. Keep responses concise and practical

Respond in JSON format:
{
  "answer": "your explanation",
  "articles": [{"number": "21", "title": "Article title", "text": "plain text"}],
  "cases": [{"name": "Case name", "year": "year", "summary": "brief summary", "articles": ["21"]}]
}`;

    const response = await callGroq(systemPrompt, question);
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      // If JSON parsing fails, wrap the text response
      parsedResponse = {
        answer: response,
        articles: [],
        cases: []
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('/ask error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// POST /extract - Extract fields from legal documents
app.post('/extract', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const systemPrompt = `You are a legal document processor. Extract key information from legal notices and documents.
Extract the following fields:
- parties: The parties involved in the case
- court: The court name
- caseNumber: The case number
- dates: Important dates (filing, hearing, etc.)
- articles: Any constitutional articles mentioned

Respond in JSON format:
{
  "parties": "string",
  "court": "string",
  "caseNumber": "string",
  "dates": "string",
  "articles": "string"
}`;

    const response = await callGroq(systemPrompt, text);
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      parsedResponse = {
        parties: '',
        court: '',
        caseNumber: '',
        dates: '',
        articles: ''
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('/extract error:', error);
    res.status(500).json({ error: 'Failed to extract fields' });
  }
});

// POST /anonymize - Remove identifying information
app.post('/anonymize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const systemPrompt = `You are a document anonymizer. Remove all personally identifiable information from legal documents.
Replace with placeholders:
- Names → [NAME]
- Addresses → [ADDRESS]
- Phone numbers → [PHONE]
- Email addresses → [EMAIL]
- Case numbers → [CASE NUMBER]
- Any other identifying details → [REDACTED]

Return only the anonymized text.`;

    const anonymized = await callGroq(systemPrompt, text);
    res.json({ anonymized });
  } catch (error) {
    console.error('/anonymize error:', error);
    res.status(500).json({ error: 'Failed to anonymize text' });
  }
});

app.listen(PORT, () => {
  console.log(`Vakeel Desk server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
