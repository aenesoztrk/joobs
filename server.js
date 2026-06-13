'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

const providersRouter = require('./routes/providers');
const reviewsRouter   = require('./routes/reviews');
const authRouter      = require('./routes/auth');
const messagesRouter  = require('./routes/messages');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── API ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', authRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/providers/:id/reviews', reviewsRouter);
app.use('/api/providers', providersRouter);

// ── SPA fallback (bilinmeyen non-API yolları index'e gönder) ──────────────
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Hata yakalayıcı ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Sunucu hatası' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n\x1b[35m🛠  Joobs Marketplace\x1b[0m → \x1b[36mhttp://localhost:${PORT}\x1b[0m\n`);
  });
});
