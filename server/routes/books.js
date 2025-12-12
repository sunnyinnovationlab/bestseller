import express from 'express';
import { getBooksFromCache, cacheExists } from '../services/cache.js';

const router = express.Router();

/**
 * 한국 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/kr-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('kr');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] KR data load failed:', err.message);
    res.status(500).json({ error: 'KR 데이터 로드 실패', message: err.message });
  }
});

/**
 * 미국 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/us-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('us');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] US data load failed:', err.message);
    res.status(500).json({ error: 'US 데이터 로드 실패', message: err.message });
  }
});

/**
 * 대만 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/tw-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('tw');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] TW data load failed:', err.message);
    res.status(500).json({ error: 'TW 데이터 로드 실패', message: err.message });
  }
});

/**
 * 프랑스 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/fr-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('fr');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] FR data load failed:', err.message);
    res.status(500).json({ error: 'FR 데이터 로드 실패', message: err.message });
  }
});

/**
 * 영국 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/uk-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('uk');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] UK data load failed:', err.message);
    res.status(500).json({ error: 'UK 데이터 로드 실패', message: err.message });
  }
});

/**
 * 일본 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/jp-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('jp');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] JP data load failed:', err.message);
    res.status(500).json({ error: 'JP 데이터 로드 실패', message: err.message });
  }
});

/**
 * 중국 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/ch-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('ch');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] CH data load failed:', err.message);
    res.status(500).json({ error: 'CH 데이터 로드 실패', message: err.message });
  }
});

/**
 * 스페인 책 목록
 * 구글닥스에서만 읽어옴
 */
router.get('/es-books', async (req, res) => {
  try {
    const books = await getBooksFromCache('es');
    if (books.length > 0) {
      return res.json({ books });
    }
    res.json({ books: [] });
  } catch (err) {
    console.error('[Books] ES data load failed:', err.message);
    res.status(500).json({ error: 'ES 데이터 로드 실패', message: err.message });
  }
});

export default router;
