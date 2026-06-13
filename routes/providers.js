'use strict';

const express  = require('express');
const Provider = require('../models/Provider');
const Review   = require('../models/Review');
const { optionalAuth, protect } = require('../middleware/auth');

const router = express.Router();

const CATEGORY_META = [
  { key: 'all',      icon: '🌐', label: 'Tümü' },
  { key: 'yazilim',  icon: '💻', label: 'Yazılım' },
  { key: 'tasarim',  icon: '🎨', label: 'Tasarım' },
  { key: 'temizlik', icon: '🧹', label: 'Temizlik' },
  { key: 'tamirat',  icon: '🔧', label: 'Tamirat' },
];

// ── GET /api/providers  (filtre + arama + sıralama) ───────────────────────
router.get('/', async (req, res) => {
  try {
    const { category = 'all', search = '', sort = 'default' } = req.query;

    const query = {};
    if (category !== 'all') query.category = category;
    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { title: rx }, { skills: rx }];
    }

    const sortMap = {
      'price-asc':  { priceNum: 1 },
      'price-desc': { priceNum: -1 },
      'rate-desc':  { ratingNum: -1, reviewCount: -1 },
      'default':    { featured: -1, createdAt: -1 },
    };

    const providers = await Provider.find(query).sort(sortMap[sort] || sortMap.default);
    res.json({ providers, total: providers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/providers/categories ─────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  try {
    const counts = await Provider.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const map = counts.reduce((a, c) => ((a[c._id] = c.count), a), {});
    const total = Object.values(map).reduce((s, n) => s + n, 0);
    const categories = CATEGORY_META.map(c => ({
      ...c,
      count: c.key === 'all' ? total : (map[c.key] || 0),
    }));
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/providers/stats ──────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const total = await Provider.countDocuments();
    const reviews = await Review.countDocuments();
    const avg = await Provider.aggregate([
      { $match: { reviewCount: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$ratingNum' } } },
    ]);
    res.json({
      total,
      reviews,
      avgRating: avg.length ? Number(avg[0].avg.toFixed(2)) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/providers/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Uzman bulunamadı' });
    const reviews = await Review.find({ provider: provider._id }).sort({ createdAt: -1 });
    res.json({ provider, reviews });
  } catch (err) {
    res.status(400).json({ error: 'Geçersiz uzman kimliği' });
  }
});

// ── POST /api/providers  (yeni ilan oluştur) ──────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const required = ['name', 'title', 'category', 'priceNum'];
    for (const f of required)
      if (body[f] === undefined || body[f] === '' || body[f] === null)
        return res.status(400).json({ error: `Eksik alan: ${f}` });

    const toArray = v =>
      Array.isArray(v) ? v
        : typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const provider = await Provider.create({
      name:      body.name,
      title:     body.title,
      category:  body.category,
      priceNum:  Number(body.priceNum) || 0,
      color:     body.color || '#7c3aed',
      location:  body.location || '',
      hours:     body.hours || '09:00 - 18:00',
      phone:     body.phone || '',
      email:     body.email || '',
      skills:    toArray(body.skills),
      portfolio: toArray(body.portfolio),
      owner:     req.user ? req.user._id : null,
    });

    res.status(201).json({ provider });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
