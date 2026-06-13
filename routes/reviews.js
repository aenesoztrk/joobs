'use strict';

const express  = require('express');
const Review   = require('../models/Review');
const Provider = require('../models/Provider');

const router = express.Router({ mergeParams: true });

// Bir uzmanın ortalama puanını ve yorum sayısını yeniden hesapla
async function recalcRating(providerId) {
  const agg = await Review.aggregate([
    { $match: { provider: providerId } },
    { $group: { _id: '$provider', avg: { $avg: '$rate' }, count: { $sum: 1 } } },
  ]);
  const { avg = 5, count = 0 } = agg[0] || {};
  await Provider.findByIdAndUpdate(providerId, {
    ratingNum: Number(avg.toFixed(2)),
    reviewCount: count,
  });
}

// ── GET /api/providers/:id/reviews ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.id }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/providers/:id/reviews ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { user, rate, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'Ad ve yorum zorunludur' });

    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Uzman bulunamadı' });

    const review = await Review.create({
      provider: provider._id,
      user,
      rate: Math.min(5, Math.max(1, Number(rate) || 5)),
      text,
    });

    await recalcRating(provider._id);
    const updated = await Provider.findById(provider._id);
    res.status(201).json({ review, provider: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
