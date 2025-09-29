// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { documentsRouter } from './controllers/documents';

dotenv.config();

console.log('🚀 Starting incluDS Backend API Server');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('🌐 Frontend URL from env:', process.env.FRONTEND_URL || 'NOT SET');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('⚙️ Configuring Express app...');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    timestamp: new Date().toISOString()
  });
  next();
});

// Security middleware
console.log('🔒 Setting up security middleware...');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "'unsafe-inline'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Enhanced CORS configuration with pattern matching
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://includs.org',
  'https://www.includs.org',
  'https://includs.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

// Function to check if origin matches allowed patterns
function isOriginAllowed(origin: string): boolean {
  // Check exact matches first
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check Vercel deployment patterns for david-cuis-projects
  const vercelPatterns = [
    /^https:\/\/includs-[a-z0-9]+-david-cuis-projects\.vercel\.app$/,
    /^https:\/\/includs-[a-z0-9]+\.vercel\.app$/
  ];
  
  for (const pattern of vercelPatterns) {
    if (pattern.test(origin)) {
      console.log('✅ CORS: Origin matches Vercel pattern:', origin);
      return true;
    }
  }
  
  return false;
}

console.log('🌍 Setting up CORS with allowed origins and patterns:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 CORS check - Request origin:', origin);
    console.log('🔍 CORS check - Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    if (isOriginAllowed(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin rejected:', origin);
      console.log('❌ CORS: This origin does not match any allowed patterns');
      
      // Enhanced error for debugging
      const error = new Error(`CORS: Origin ${origin} not allowed`);
      callback(error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Enhanced CORS error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message && err.message.includes('CORS')) {
    console.error('🚫 CORS Error Details:', {
      error: err.message,
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
    return;
  }
  next(err);
});

// Rate limiting
console.log('⏱️ Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests, please try again later',
  handler: (req, res) => {
    console.log('🚫 Rate limit exceeded for:', req.ip, req.headers.origin);
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});
app.use('/api', limiter);

// Body parsing
console.log('📦 Setting up body parsing...');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
console.log('🛣️ Setting up routes...');

// Root route
app.get('/', (req, res) => {
  console.log('📋 Root route accessed from:', req.headers.origin);
  res.json({ 
    message: 'incluDS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/documents',
      textSummarize: '/api/documents/text-summarize',
      documentSummarize: '/api/documents/upload-and-summarize'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('❤️ Health check accessed from:', req.headers.origin);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: req.headers.origin,
    allowedOrigins: allowedOrigins
  });
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  console.log('🖼️ Favicon requested from:', req.headers.origin);
  res.status(204).end();
});

// CORS debug endpoint
app.get('/debug/cors', (req, res) => {
  console.log('🔍 CORS debug endpoint accessed from:', req.headers.origin);
  res.json({
    requestOrigin: req.headers.origin,
    allowedOrigins: allowedOrigins,
    isAllowed: req.headers.origin ? isOriginAllowed(req.headers.origin) : 'No origin header',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// API routes
console.log('📝 Setting up documents API routes...');
app.use('/api/documents', documentsRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl} from origin:`, req.headers.origin);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /debug/cors',
      'GET /favicon.ico',
      'POST /api/documents/text-summarize',
      'POST /api/documents/upload-and-summarize'
    ]
  });
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Global error occurred:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Express app configuration complete');

// For Vercel deployment
export default app;

// For local development
if (require.main === module) {
  console.log(`🚀 Starting server on port ${PORT}...`);
  app.listen(PORT, () => {
    console.log(`🎉 Backend server running successfully on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base: http://localhost:${PORT}/api/documents`);
  });
}