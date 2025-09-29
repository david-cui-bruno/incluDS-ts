// OpenAI API Types
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// Summarization API Types
export interface SummarizeRequest {
  text: string;
  maxWords: number;
  gradeLevel: number;
}

export interface SummaryResponse {
  summary: string;
  originalLength: number;
  summaryLength: number;
  gradeLevel: number;
}

export const OpenAIErrorCode = {
  RATE_LIMIT: 'rate_limit_exceeded',
  INVALID_API_KEY: 'invalid_api_key',
  CONTENT_FILTER: 'content_filter',
  TOKEN_LIMIT: 'context_length_exceeded',
  NETWORK_ERROR: 'network_error'
} as const;

export type OpenAIErrorCode = typeof OpenAIErrorCode[keyof typeof OpenAIErrorCode];