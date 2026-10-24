import { port } from './config/env';
import app from './app';

app.listen(port, () => {
  console.log(`RAGChatbot API listening on port ${port}`);
});
