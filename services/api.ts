import type { Settings } from '../types';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// A helper to handle API errors
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('API Error Response:', errorBody);
    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function generateEmbedding(settings: Settings, text: string): Promise<number[]> {
  const { embeddingProvider, embeddingModel, openRouterApiKey } = settings;

  try {
    if (embeddingProvider === 'ollama') {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embeddingModel, prompt: text }),
      });
      const data = await handleApiResponse(response);
      return data.embedding;
    } else if (embeddingProvider === 'openrouter') {
      if (!openRouterApiKey) throw new Error('OpenRouter API key is required.');
      const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({ model: embeddingModel, input: text }),
      });
      const data = await handleApiResponse(response);
      return data.data[0].embedding;
    } else {
      throw new Error(`Unsupported embedding provider: ${embeddingProvider}`);
    }
  } catch (error) {
    console.error(`Error generating embedding with ${embeddingProvider}:`, error);
    // Re-throw to be caught by the calling function
    throw error;
  }
}

export async function generateAnswer(settings: Settings, query: string, context: string): Promise<string> {
  const { llmProvider, llmModel, openRouterApiKey } = settings;

  const prompt = `You are a helpful AI assistant specialized in answering questions based on provided context.
Your task is to analyze the given context documents and answer the user's question accurately.

RULES:
- Base your answer strictly on the information found in the provided context.
- If the context does not contain enough information to answer the question, state that clearly. Do not make up information.
- Be concise and to the point.

CONTEXT:
---
${context || "No context provided."}
---

USER QUESTION:
${query}

ASSISTANT'S ANSWER:
`;

  try {
    if (llmProvider === 'ollama') {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: llmModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false, // For simplicity, we are not using streaming responses.
        }),
      });
      const data = await handleApiResponse(response);
      return data.message.content;
    } else if (llmProvider === 'openrouter') {
      if (!openRouterApiKey) throw new Error('OpenRouter API key is required.');
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await handleApiResponse(response);
      return data.choices[0].message.content;
    } else {
      throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }
  } catch (error) {
    console.error(`Error generating answer with ${llmProvider}:`, error);
    // Re-throw to be caught by the calling function
    throw error;
  }
}
