// src/services/api.ts
export interface SummaryResponse {
  success: boolean;
  document?: {
    filename: string;
    metadata: {
      type: 'pdf' | 'docx' | 'txt';
      pages?: number;
      wordCount: number;
      size: number;
      title?: string;
      author?: string;
    };
  };
  summary: string;
  originalText: string; // Add this line
  metadata: {
    originalWordCount: number;
    summaryWordCount: number;
    compressionRatio: number;
    processingTime: number;
  };
  quality: {
    wordCount: number;
    processingTime: number;
  };
}

export class APIService {
  private static baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  static async summarizeFile(file: File): Promise<SummaryResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('maxWords', '1000');
    formData.append('gradeLevel', '8');
    
    const response = await fetch(`${this.baseURL}/documents/upload-and-summarize`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static async summarizeText(text: string): Promise<Omit<SummaryResponse, 'document'>> {
    const response = await fetch(`${this.baseURL}/documents/text-summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        maxWords: 1000,
        gradeLevel: 8
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  static async askQuestion(question: string, context: string): Promise<{question: string, answer: string}> {
    const response = await fetch(`${this.baseURL}/documents/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        context
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
