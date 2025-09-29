import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import type { ParsedDocument } from '../types/index';

export class DocumentParser {
  static async parseFile(file: Express.Multer.File): Promise<ParsedDocument> {
    const fileType = this.getFileType(file);
    
    switch (fileType) {
      case 'pdf':
        return this.parsePDF(file);
      case 'docx':
        return this.parseDOCX(file);
      case 'txt':
        return this.parseTXT(file);
      default:
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
  }
  
  private static getFileType(file: Express.Multer.File): 'pdf' | 'docx' | 'txt' {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (file.mimetype === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    }
    if (file.mimetype.includes('wordprocessingml') || ['docx', 'doc'].includes(extension!)) {
      return 'docx';
    }
    if (file.mimetype === 'text/plain' || extension === 'txt') {
      return 'txt';
    }
    
    throw new Error('Unsupported file format');
  }
  
  private static async parsePDF(file: Express.Multer.File): Promise<ParsedDocument> {
    try {
      const data = await pdfParse(file.buffer);
      
      // If no text extracted, try OCR
      let text = data.text;
      if (text.trim().length < 50) {
        console.log('PDF appears to be scanned, attempting OCR...');
        text = await this.performOCR(file.buffer);
      }
      
      return {
        text,
        metadata: {
          type: 'pdf',
          pages: data.numpages,
          wordCount: this.countWords(text),
          size: file.size,
          title: data.info?.Title,
          author: data.info?.Author
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
  
  private static async parseDOCX(file: Express.Multer.File): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      
      return {
        text: result.value,
        metadata: {
          type: 'docx',
          wordCount: this.countWords(result.value),
          size: file.size
        },
        warnings: result.messages.map(m => m.message)
      };
    } catch (error: any) {
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }
  
  private static async parseTXT(file: Express.Multer.File): Promise<ParsedDocument> {
    const text = file.buffer.toString('utf-8');
    
    return {
      text,
      metadata: {
        type: 'txt',
        wordCount: this.countWords(text),
        size: file.size
      }
    };
  }
  
  private static async performOCR(buffer: Buffer): Promise<string> {
    const worker = await createWorker('eng');
    try {
      const { data: { text } } = await worker.recognize(buffer);
      return text;
    } finally {
      await worker.terminate();
    }
  }
  
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}