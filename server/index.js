import express from 'express';
import cors from 'cors';
import booksRouter from './routes/books.js';
import bookDetailRouter from './routes/bookDetail.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', booksRouter);
app.use('/', bookDetailRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Books API: /kr-books, /us-books, /jp-books, /uk-books, /ch-books, /tw-books, /fr-books, /es-books`);
  console.log(`[Server] Book Detail API: /kr-book-detail, /us-book-detail, /jp-book-detail, /uk-book-detail, /ch-book-detail, /tw-book-detail, /fr-book-detail, /es-book-detail`);
});

// Keep server running
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] Process terminated');
    process.exit(0);
  });
});

