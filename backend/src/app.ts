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

// CORS configuration with multiple allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://includs.org',
  'https://www.includs.org',
  'https://includs.vercel.app',
  'https://includs-jsmblw22d-david-cuis-projects.vercel.app',
  'https://includs-nxq6a6q2j-david-cuis-projects.vercel.app',
  'https://includs-95cet7rll-david-cuis-projects.vercel.app', // NEW URL
  'http://localhost:5173',
  'http://localhost:5174'
];

console.log('🌍 Setting up CORS with allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 CORS check - Request origin:', origin);
    console.log('🔍 CORS check - Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  console.log('🖼️ Favicon requested from:', req.headers.origin);
  res.status(204).end();
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
      'GET /favicon.ico',
      'POST /api/documents/text-summarize',
      'POST /api/documents/upload-and-summarize'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Error occurred:', {
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