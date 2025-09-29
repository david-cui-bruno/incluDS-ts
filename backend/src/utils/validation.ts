// backend/src/utils/validation.ts
export class ValidationUtils {
  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.' };
    }
    
    return { valid: true };
  }
  
  static validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }
    
    if (text.length > 100000) { // 100k character limit
      return { valid: false, error: 'Text exceeds 100,000 character limit' };
    }
    
    return { valid: true };
  }
  
  static validateSummaryParams(maxWords?: number, gradeLevel?: number): { valid: boolean; error?: string } {
    if (maxWords && (maxWords < 100 || maxWords > 5000)) {
      return { valid: false, error: 'Max words must be between 100 and 5000' };
    }
    
    if (gradeLevel && (gradeLevel < 1 || gradeLevel > 12)) {
      return { valid: false, error: 'Grade level must be between 1 and 12' };
    }
    
    return { valid: true };
  }
}