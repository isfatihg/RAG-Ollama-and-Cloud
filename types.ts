export type Provider = 'ollama' | 'openrouter';

export interface Settings {
  llmProvider: Provider;
  embeddingProvider: Provider;
  llmModel: string;
  embeddingModel: string;
  openRouterApiKey: string;
}

export type MessageAuthor = 'user' | 'assistant';

export interface DocumentChunk {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
  vector: number[];
}

export interface ChatMessage {
  author: MessageAuthor;
  content: string;
  context?: DocumentChunk[];
}

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  processedAt: string;
}
