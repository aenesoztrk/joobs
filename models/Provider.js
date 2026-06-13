'use strict';

const mongoose = require('mongoose');

const CATEGORIES = ['yazilim', 'tasarim', 'temizlik', 'tamirat'];

const providerSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    title:     { type: String, required: true, trim: true },
    category:  { type: String, required: true, enum: CATEGORIES, index: true },
    priceNum:  { type: Number, required: true, min: 0 },
    color:     { type: String, default: '#7c3aed' },
    location:  { type: String, default: '', trim: true },
    hours:     { type: String, default: '09:00 - 18:00' },
    phone:     { type: String, default: '' },
    email:     { type: String, default: '', lowercase: true, trim: true },
    skills:    { type: [String], default: [] },
    portfolio: { type: [String], default: [] },
    avatar:    { type: String, default: '' },
    portfolioImages: { type: [String], default: [] },

    // Değerlendirme istatistikleri (yorumlar geldikçe güncellenir)
    ratingNum:   { type: Number, default: 5.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// İlk harf (avatar için)
providerSchema.virtual('initial').get(function () {
  return (this.name || '?').charAt(0).toUpperCase();
});

// "4.9 (42)" biçiminde gösterim
providerSchema.virtual('rating').get(function () {
  const r = (this.ratingNum || 0).toFixed(1);
  return this.reviewCount > 0 ? `${r} (${this.reviewCount})` : `${r} (Yeni Üye)`;
});

// "1.500 TL" biçiminde gösterim
providerSchema.virtual('price').get(function () {
  return `${(this.priceNum || 0).toLocaleString('tr-TR')} TL`;
});

providerSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Provider', providerSchema);
