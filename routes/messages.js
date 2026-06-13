'use strict';

const express = require('express');
const Message = require('../models/Message');
const Provider = require('../models/Provider');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/messages  (mesaj gönder) ────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { providerId, receiverId, text } = req.body;
    if (!providerId || !receiverId || !text) {
      return res.status(400).json({ error: 'Eksik parametreler (providerId, receiverId, text)' });
    }

    const message = await Message.create({
      provider: providerId,
      sender: req.user._id,
      receiver: receiverId,
      text: text,
    });

    const populated = await Message.findById(message._id).populate('sender receiver provider');
    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/threads  (aktif sohbet başlıklarını getir) ──────────
router.get('/threads', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender receiver provider')
      .sort({ createdAt: 1 }); // Artan sıralama ki döngüde son mesaj en güncel kalsın

    const threadsMap = {};
    for (const msg of messages) {
      if (!msg.provider) continue; // Silinen ilanları atla
      
      const providerId = msg.provider._id.toString();
      const otherUser = msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
      if (!otherUser) continue;
      
      const otherUserId = otherUser._id.toString();
      const key = `${providerId}_${otherUserId}`;
      
      threadsMap[key] = {
        provider: msg.provider,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
        },
        lastMessage: {
          text: msg.text,
          createdAt: msg.createdAt,
        },
      };
    }

    const threads = Object.values(threadsMap).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/messages/:providerId/:otherUserId  (iki kişi arasındaki geçmiş) ──
router.get('/:providerId/:otherUserId', protect, async (req, res) => {
  try {
    const { providerId, otherUserId } = req.params;
    const messages = await Message.find({
      provider: providerId,
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ],
    })
      .populate('sender receiver provider')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
