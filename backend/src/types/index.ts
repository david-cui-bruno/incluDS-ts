export interface ParsedDocument {
  text: string;
  metadata: {
    type: 'pdf' | 'docx' | 'txt';
    pages?: number;
    wordCount: number;
    size: number;
    title?: string;
    author?: string;
  };
  warnings?: string[];
}

export interface QualityReport {
  wordCount: number;
  processingTime: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SummaryAPIResponse {
  success: boolean;
  document?: {
    filename: string;
    metadata: ParsedDocument['metadata'];
  };
  summary: string;
  originalText: string; // Add this line
  metadata: {
    originalWordCount: number;
    summaryWordCount: number;
    compressionRatio: number;
    processingTime: number;
  };
  quality: QualityReport;
}
