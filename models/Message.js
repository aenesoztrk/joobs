'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text:     { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
