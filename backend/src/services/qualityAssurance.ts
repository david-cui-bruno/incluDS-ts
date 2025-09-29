// backend/src/services/qualityAssurance.ts
export interface QualityReport {
  wordCount: number;
  processingTime: number;
}

export class QualityAssurance {
  static async assessSummary(
    summary: string,
    processingTime: number
  ): Promise<QualityReport> {
    return {
      wordCount: this.countWords(summary),
      processingTime
    };
  }
  
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}