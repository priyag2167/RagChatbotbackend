import dotenv from 'dotenv';

dotenv.config();

const parsedPort = Number(process.env.PORT || 5001);
if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

export const port: number = parsedPort;
export const nodeEnv: string = process.env.NODE_ENV || 'development';
export const frontendOrigin: string = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
export const groqApiKey: string | undefined = process.env.GROQ_API_KEY;
export const groqModel: string = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
export const groqApiUrl: string = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
