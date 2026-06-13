'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'joobs_dev_secret';

function signToken(userId) {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Zorunlu kimlik doğrulama
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });

    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' });
  }
}

// İsteğe bağlı kimlik doğrulama (varsa req.user'ı doldurur, yoksa devam eder)
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (_) { /* sessizce geç */ }
  next();
}

module.exports = { signToken, protect, optionalAuth };
