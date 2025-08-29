export default function handler(req, res) {
  console.log('Testing environment variables in Next.js context...');
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  res.status(200).json({
    geminiApiKeyExists: !!process.env.GEMINI_API_KEY,
    geminiApiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    mongodbUriExists: !!process.env.MONGODB_URI,
    envVars: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***EXISTS***' : 'NOT_FOUND',
      MONGODB_URI: process.env.MONGODB_URI ? '***EXISTS***' : 'NOT_FOUND'
    }
  });
} 