import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { frontendOrigin } from './config/env';
import apiRoutes from './routes/api.routes';
import { getApiRoot } from './controllers/chat.controller';
import { notFound, errorHandler } from './middleware/error-handler';

const app: Application = express();
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin: frontendOrigin.split(',').map(origin => origin.trim()),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '8kb' }));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

app.use(['/api/v1', '/api/vi', '/api'], apiLimiter);
app.use(['/api/v1', '/api/vi', '/api'], apiRoutes);
app.get('/', getApiRoot);

app.use(notFound);
app.use(errorHandler);

export default app;
