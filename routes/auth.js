'use strict';

const express = require('express');
const User    = require('../models/User');
const { signToken, protect } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// ── GET /api/auth/favorites  (kullanıcının favori id listesi) ─────────────
router.get('/favorites', protect, (req, res) => {
  res.json({ favorites: req.user.favorites });
});

// ── POST /api/auth/favorites/:id  (favori ekle/çıkar) ─────────────────────
router.post('/favorites/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const idx = req.user.favorites.findIndex(f => f.toString() === id);
    if (idx > -1) req.user.favorites.splice(idx, 1);
    else req.user.favorites.push(id);
    await req.user.save();
    res.json({ favorites: req.user.favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/favorites/sync  (misafir favorilerini birleştir) ───────
router.post('/favorites/sync', protect, async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.favorites) ? req.body.favorites : [];
    const set = new Set(req.user.favorites.map(f => f.toString()));
    incoming.forEach(id => set.add(String(id)));
    req.user.favorites = [...set];
    await req.user.save();
    res.json({ favorites: req.user.favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
