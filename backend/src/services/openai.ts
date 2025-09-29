import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface SummaryRequest {
  text: string;
  maxWords: number;
  gradeLevel: number;
  isFile?: boolean; // Add flag to distinguish between file and text
}

export interface SummaryResponse {
  summary: string;
  metadata: {
    originalWordCount: number;
    summaryWordCount: number;
    compressionRatio: number;
    processingTime: number;
  };
}

export interface QuestionRequest {
  question: string;
  context: string;
  gradeLevel: number;
}

export class OpenAIService {
  static async summarize(request: SummaryRequest): Promise<SummaryResponse> {
    const startTime = Date.now();
    
    const prompt = request.isFile ? 
      this.buildSummaryPrompt(request) : 
      this.buildConversionPrompt(request);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Changed from 'gpt-4-turbo-preview'
        messages: [
          {
            role: 'system',
            content: 'You are an expert at making text accessible to people with Down syndrome and their families.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: Math.min(request.maxWords * 1.5, 4000),
      });
      
      const summary = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;
      
      return {
        summary,
        metadata: {
          originalWordCount: this.countWords(request.text),
          summaryWordCount: this.countWords(summary),
          compressionRatio: this.countWords(summary) / this.countWords(request.text),
          processingTime
        }
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  static async answerQuestion(request: QuestionRequest): Promise<string> {
    const prompt = this.buildQuestionPrompt(request);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions about documents in simple language for people with Down syndrome and their families.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300, // Shorter responses for Q&A
      });
      
      return completion.choices[0]?.message?.content || 'I could not answer that question.';
    } catch (error: any) {
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }
  
  // For files: Summarize into paragraphs
  private static buildSummaryPrompt(request: SummaryRequest): string {
    return `You are helping families affected by Down syndrome understand documents.

TASK: Summarize the following document content at an 8th grade reading level.

CRITICAL: You MUST summarize the actual content provided below. Do NOT generate generic information about Down syndrome.

REQUIREMENTS:
- Summarize ONLY what is written in the document below
- Use simple, everyday language (8th grade level)
- Short sentences (15-20 words max)
- Maximum length: ${request.maxWords} words
- Organize into 2-3 clear paragraphs

DOCUMENT CONTENT TO SUMMARIZE:
${request.text}

Your summary of the above document:`;
  }
  
  // For text: Convert to 8th grade reading level
  private static buildConversionPrompt(request: SummaryRequest): string {
    return `TASK: Rewrite the following text at an 8th grade reading level.

CRITICAL: You MUST rewrite the exact content provided below. Do NOT add any other information.

REQUIREMENTS:
- Keep ALL the important information from the original text
- Use simple, everyday words  
- Short sentences (15-20 words max)
- Explain complex terms in parentheses
- Keep the same meaning and topics as the original

ORIGINAL TEXT TO REWRITE:
${request.text}

Rewritten version:`;
  }

  private static buildQuestionPrompt(request: QuestionRequest): string {
    return `You are having a conversation about a document with families affected by Down syndrome.

REQUIREMENTS:
- Answer at an 8th grade reading level
- Use simple, clear language
- Short sentences (15-20 words max)
- You can refer to previous questions and answers in the conversation
- Be helpful and accurate
- If the answer isn't in the content, say "I don't see that information in this document"

DOCUMENT AND CONVERSATION CONTEXT:
${request.context}

CURRENT QUESTION: ${request.question}

ANSWER:`;
  }
  
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}
