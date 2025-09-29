export class TextProcessor {
  static preprocess(rawText: string): string {
    let processed = rawText;
    
    // Clean extraction artifacts
    processed = this.cleanExtractionArtifacts(processed);
    
    // Fix line breaks and spacing
    processed = this.normalizeWhitespace(processed);
    
    // Remove headers/footers
    processed = this.removeHeadersFooters(processed);
    
    // Fix hyphenated words
    processed = this.fixHyphenatedWords(processed);
    
    // Preserve structure
    processed = this.preserveStructure(processed);
    
    return processed.trim();
  }
  
  private static cleanExtractionArtifacts(text: string): string {
    return text
      // Remove form feeds and excessive whitespace
      .replace(/\f/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove weird unicode characters
      .replace(/[^\x20-\x7E\n\t]/g, ' ')
      // Clean up bullet points
      .replace(/•/g, '- ')
      .replace(/◦/g, '  - ')
      .replace(/▪/g, '  - ');
  }
  
  private static normalizeWhitespace(text: string): string {
    return text
      // Fix multiple spaces
      .replace(/ {2,}/g, ' ')
      // Fix multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing spaces
      .replace(/ +$/gm, '');
  }
  
  private static removeHeadersFooters(text: string): string {
    const lines = text.split('\n');
    const filtered = lines.filter((line, index) => {
      const trimmed = line.trim();
      
      // Skip common header/footer patterns
      if (trimmed.match(/^page \d+ of \d+$/i)) return false;
      if (trimmed.match(/^\d+$/)) return false; // Just page numbers
      if (trimmed.length < 3) return true; // Keep short lines that might be spacing
      
      return true;
    });
    
    return filtered.join('\n');
  }
  
  private static fixHyphenatedWords(text: string): string {
    // Fix words broken across lines
    return text.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
  }
  
  private static preserveStructure(text: string): string {
    let structured = text;
    
    // Convert common patterns to markdown for better GPT understanding
    structured = structured
      // Headers (all caps lines)
      .replace(/^([A-Z][A-Z\s]{10,})$/gm, '## $1')
      // Numbered lists
      .replace(/^(\d+\.\s+)/gm, '$1')
      // Bullet points
      .replace(/^[-•]\s+/gm, '- ');
    
    return structured;
  }
}