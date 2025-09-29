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
  
  private static checkBackendAvailable(): boolean {
    return !!import.meta.env.VITE_API_URL;
  }
  
  static async summarizeFile(file: File): Promise<SummaryResponse> {
    console.log('📤 Starting file summarization...');
    console.log('🔧 API Configuration:', {
      baseURL: this.baseURL,
      backendAvailable: this.checkBackendAvailable(),
      envApiUrl: import.meta.env.VITE_API_URL,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (!this.checkBackendAvailable()) {
      console.error('❌ Backend not available');
      throw new Error('Text summarization is currently unavailable. Backend service not configured.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('maxWords', '1000');
    formData.append('gradeLevel', '8');
    
    const url = `${this.baseURL}/documents/upload-and-summarize`;
    console.log('📡 Making file upload request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      console.log('📨 File upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ File upload error:', errorData);
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ File upload successful:', {
        success: result.success,
        summaryLength: result.summary?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('💥 File upload request failed:', error);
      throw error;
    }
  }
  
  static async summarizeText(text: string): Promise<SummaryResponse> {
    console.log('📤 Starting text summarization...');
    console.log('🔧 API Configuration:', {
      baseURL: this.baseURL,
      backendAvailable: this.checkBackendAvailable(),
      envApiUrl: import.meta.env.VITE_API_URL,
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...'
    });
    
    if (!this.checkBackendAvailable()) {
      console.error('❌ Backend not available');
      throw new Error('Text summarization is currently unavailable. Backend service not configured.');
    }
    
    const url = `${this.baseURL}/documents/text-summarize`;
    console.log('📡 Making text summarization request to:', url);
    
    const requestBody = {
      text,
      maxWords: 1000,
      gradeLevel: 8
    };
    
    console.log('📋 Request details:', {
      url,
      method: 'POST',
      bodyKeys: Object.keys(requestBody),
      textLength: requestBody.text.length,
      currentOrigin: window.location.origin
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📨 Text summarization response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        redirected: response.redirected,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        console.error('❌ Response not OK, attempting to read error data...');
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Error response data:', errorData);
        } catch (jsonError) {
          console.error('❌ Could not parse error response as JSON:', jsonError);
          const textData = await response.text();
          console.error('❌ Error response text:', textData);
          errorData = { message: textData || response.statusText };
        }
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }
      
      console.log('✅ Response OK, parsing JSON...');
      const result = await response.json();
      console.log('✅ Text summarization successful:', {
        success: result.success,
        summaryLength: result.summary?.length || 0,
        hasOriginalText: !!result.originalText,
        hasMetadata: !!result.metadata
      });
      
      return result;
    } catch (error) {
      console.error('💥 Text summarization request failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        url,
        origin: window.location.origin
      });
      throw error;
    }
  }
  
  static async healthCheck(): Promise<boolean> {
    console.log('🏥 Performing health check...');
    console.log('🔧 Health check URL:', `${this.baseURL.replace('/api', '')}/health`);
    
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      console.log('🏥 Health check response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      return response.ok;
    } catch (error) {
      console.error('💥 Health check failed:', error);
      return false;
    }
  }

  static async askQuestion(question: string, context: string): Promise<{question: string, answer: string}> {
    console.log('❓ Starting question request...');
    console.log('🔧 Question details:', {
      questionLength: question.length,
      contextLength: context.length,
      url: `${this.baseURL}/documents/ask-question`
    });
    
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
    
    console.log('❓ Question response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Question error:', errorData);
      throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Question answered successfully');
    return result;
  }
}