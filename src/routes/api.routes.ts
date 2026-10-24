import express, { Router } from 'express';
import { postChat, getSearch, getHealth, getApiRoot } from '../controllers/chat.controller';

const router: Router = express.Router();

router.get('/', getApiRoot);
router.get('/health', getHealth);
router.get('/search', getSearch);
router.post('/chat', postChat);

export default router;
