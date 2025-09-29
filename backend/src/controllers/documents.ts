import { Router } from 'express';
import { uploadMiddleware, handleUploadError } from '../middleware/upload';
import { DocumentParser } from '../services/documentParser';
import { TextProcessor } from '../services/textProcessor';
import { OpenAIService } from '../services/openai';
import { QualityAssurance } from '../services/qualityAssurance';
import type { SummaryAPIResponse } from '../types/index';

export const documentsRouter = Router();

documentsRouter.post('/upload-and-summarize', uploadMiddleware, handleUploadError, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const maxWords = parseInt(req.body.maxWords) || 1000;
    const gradeLevel = parseInt(req.body.gradeLevel) || 8;

    console.log(`📄 Processing ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Parse document
    console.log('📄 Parsing document...');
    const parsed = await DocumentParser.parseFile(req.file);
    console.log('📊 Extracted text preview:', parsed.text.substring(0, 200) + '...');
    console.log('📊 Total extracted characters:', parsed.text.length);
    
    // Step 2: Preprocess text
    console.log('🔧 Preprocessing text...');
    const cleanText = TextProcessor.preprocess(parsed.text);
    console.log('🔧 Cleaned text preview:', cleanText.substring(0, 200) + '...');
    
    // Step 3: Generate summary
    console.log('🤖 Generating summary with GPT-4...');
    const summaryResponse = await OpenAIService.summarize({
      text: cleanText,
      maxWords,
      gradeLevel,
      isFile: true // Files get summarized
    });
    
    // Step 4: Quality assessment
    console.log('✅ Processing complete');
    const qualityReport = await QualityAssurance.assessSummary(
      summaryResponse.summary,
      summaryResponse.metadata.processingTime
    );
    
    const response: SummaryAPIResponse = {
      success: true,
      document: {
        filename: req.file.originalname,
        metadata: parsed.metadata
      },
      summary: summaryResponse.summary,
      originalText: cleanText, // Add this line
      metadata: summaryResponse.metadata,
      quality: qualityReport
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error processing document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process document',
      message: error.message
    });
  }
});

documentsRouter.post('/text-summarize', async (req, res) => {
  try {
    const { text, maxWords = 1000, gradeLevel = 8 } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'No text provided or invalid text format' 
      });
    }
    
    console.log(`📝 Processing text (${text.length} characters)`);
    
    // Preprocess text
    console.log('🔧 Preprocessing text...');
    const cleanText = TextProcessor.preprocess(text);
    
    // Generate summary
    console.log('🤖 Generating summary with GPT-4...');
    const summaryResponse = await OpenAIService.summarize({
      text: cleanText,
      maxWords,
      gradeLevel,
      isFile: false // Text gets converted to 8th grade level
    });
    
    // Quality assessment
    console.log('✅ Assessing quality...');
    const qualityReport = await QualityAssurance.assessSummary(
      summaryResponse.summary,
      summaryResponse.metadata.processingTime
    );
    
    const response: Omit<SummaryAPIResponse, 'document'> & { originalText: string } = {
      success: true,
      summary: summaryResponse.summary,
      originalText: cleanText, // Add this line
      metadata: summaryResponse.metadata,
      quality: qualityReport
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Error processing text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process text',
      message: error.message
    });
  }
});

// Health check for documents service
documentsRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'documents',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /upload-and-summarize',
      'POST /text-summarize'
    ]
  });
});

documentsRouter.post('/ask-question', async (req: any, res: any) => {
  try {
    const { question, context } = req.body;
    
    if (!question || !context) {
      return res.status(400).json({
        success: false,
        error: 'Question and context are required'
      });
    }
    
    console.log(`❓ Processing question: "${question.substring(0, 50)}..."`);
    
    const answer = await OpenAIService.answerQuestion({
      question,
      context,
      gradeLevel: 8
    });
    
    res.json({
      success: true,
      question,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error answering question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer question',
      message: error.message
    });
  }
});