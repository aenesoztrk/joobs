'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    user:     { type: String, required: true, trim: true },
    rate:     { type: Number, required: true, min: 1, max: 5 },
    text:     { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
