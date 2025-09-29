import { Router } from 'express';
import { uploadMiddleware, handleUploadError } from '../middleware/upload';
import { DocumentParser } from '../services/documentParser';
import { TextProcessor } from '../services/textProcessor';
import { OpenAIService } from '../services/openai';
import { QualityAssurance } from '../services/qualityAssurance';
import type { SummaryAPIResponse } from '../types/index';

export const documentsRouter = Router();

console.log('📋 Setting up documents router...');

// Middleware to log all requests to documents API
documentsRouter.use((req, res, next) => {
  console.log(`📋 Documents API: ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    body: req.method === 'POST' ? (req.body ? 'BODY_PRESENT' : 'NO_BODY') : undefined,
    files: req.files || req.file ? 'FILE_PRESENT' : 'NO_FILES',
    timestamp: new Date().toISOString()
  });
  next();
});

documentsRouter.post('/upload-and-summarize', uploadMiddleware, handleUploadError, async (req: any, res: any) => {
  console.log('📄 File upload endpoint hit!');
  try {
    if (!req.file) {
      console.log('❌ No file in request');
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

    console.log('✅ Sending successful response for file upload');
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
  console.log('📝 Text summarize endpoint hit!');
  console.log('📝 Request details:', {
    origin: req.headers.origin,
    contentType: req.headers['content-type'],
    bodyKeys: req.body ? Object.keys(req.body) : 'NO_BODY',
    hasText: !!req.body?.text,
    textLength: req.body?.text?.length || 0
  });
  
  try {
    const { text, maxWords = 1000, gradeLevel = 8 } = req.body;
    
    console.log('📝 Request body received:', {
      textLength: text?.length || 0,
      maxWords,
      gradeLevel,
      hasText: !!text,
      textType: typeof text,
      textPreview: text ? text.substring(0, 100) + '...' : 'NO_TEXT'
    });
    
    if (!text || typeof text !== 'string') {
      console.log('❌ Invalid text provided:', { text: typeof text, hasText: !!text });
      return res.status(400).json({ 
        success: false,
        error: 'No text provided or invalid text format' 
      });
    }
    
    console.log(`📝 Processing text (${text.length} characters)`);
    
    // Preprocess text
    console.log('🔧 Preprocessing text...');
    const cleanText = TextProcessor.preprocess(text);
    console.log('🔧 Cleaned text length:', cleanText.length);
    
    // Generate summary
    console.log('🤖 Generating summary with GPT-4...');
    const summaryResponse = await OpenAIService.summarize({
      text: cleanText,
      maxWords,
      gradeLevel,
      isFile: false // Text gets converted to 8th grade level
    });
    
    console.log('🤖 OpenAI response received, summary length:', summaryResponse.summary.length);
    
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

    console.log('✅ Sending successful text summarization response');
    res.json(response);

  } catch (error: any) {
    console.error('❌ Error processing text:', {
      error: error.message,
      stack: error.stack,
      origin: req.headers.origin
    });
    res.status(500).json({
      success: false,
      error: 'Failed to process text',
      message: error.message
    });
  }
});

// Health check for documents service
documentsRouter.get('/health', (req, res) => {
  console.log('❤️ Documents health check from:', req.headers.origin);
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
  console.log('❓ Ask question endpoint hit from:', req.headers.origin);
  try {
    const { question, context } = req.body;
    
    console.log('❓ Question request:', {
      hasQuestion: !!question,
      hasContext: !!context,
      questionLength: question?.length || 0,
      contextLength: context?.length || 0
    });
    
    if (!question || !context) {
      console.log('❌ Missing question or context');
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
    
    console.log('✅ Question answered successfully');
    res.json({
      success: true,
      question,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error answering question:', {
      error: error.message,
      stack: error.stack,
      origin: req.headers.origin
    });
    res.status(500).json({
      success: false,
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

console.log('✅ Documents router setup complete');