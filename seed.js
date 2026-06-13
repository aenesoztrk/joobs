'use strict';
require('dotenv').config();

const mongoose  = require('mongoose');
const connectDB = require('./config/db');
const Provider  = require('./models/Provider');
const Review    = require('./models/Review');

// Eski "Joobs" projesindeki örnek veri + statik detaylar birleştirildi
const SEED = [
  {
    name: 'Ahmet Yılmaz', title: 'Full-Stack Web Geliştirici', category: 'yazilim',
    priceNum: 1500, color: '#7c3aed', location: 'İstanbul', hours: '09:00 - 19:00',
    phone: '+90 532 111 2233', email: 'ahmet.y@joobs.com', featured: true,
    skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js'],
    portfolio: ['E-Ticaret Paneli', 'Kurumsal Blog', 'CMS Geliştirme'],
    reviews: [{ user: 'Hasan K.', rate: 5, text: 'Harika iş çıkardı, kesinlikle tavsiye ederim.' }],
  },
  {
    name: 'Elif Kaya', title: 'UI/UX & Logo Tasarımcısı', category: 'tasarim',
    priceNum: 800, color: '#ec4899', location: 'İzmir', hours: '10:00 - 18:00',
    phone: '+90 544 222 3344', email: 'elif.kaya@joobs.com', featured: true,
    skills: ['UI/UX', 'Figma', 'Adobe Illustrator', 'Logo Tasarımı'],
    portfolio: ['Mobil App Çizimi', 'Logo Paket Tasarımı'],
    reviews: [{ user: 'Zeynep U.', rate: 5, text: 'Çok yaratıcı bir tasarımcı, iletişimi mükemmel.' }],
  },
  {
    name: 'Mehmet Demir', title: 'Profesyonel Ev ve Ofis Temizliği', category: 'temizlik',
    priceNum: 600, color: '#10b981', location: 'Ankara', hours: '08:00 - 20:00',
    phone: '+90 505 333 4455', email: 'mehmet.temizlik@joobs.com', featured: true,
    skills: ['Ofis Temizliği', 'Daire Dezenfeksiyonu'],
    portfolio: ['Komple Ev Temizliği'],
    reviews: [{ user: 'Ayşe T.', rate: 5, text: 'Tertemiz bıraktılar, çok memnun kaldım.' }],
  },
  {
    name: 'Can Onur', title: 'Kombi ve Beyaz Eşya Tamir Ustası', category: 'tamirat',
    priceNum: 450, color: '#f59e0b', location: 'Bursa', hours: '07:30 - 21:00',
    phone: '+90 555 444 5566', email: 'can.usta@joobs.com',
    skills: ['Kombi Tamiri', 'Klima Bakım'],
    portfolio: ['Kart Değişimi'], reviews: [],
  },
  {
    name: 'Selin Öztürk', title: 'Mobil Uygulama Geliştirici', category: 'yazilim',
    priceNum: 2200, color: '#06b6d4', location: 'Antalya', hours: '09:00 - 18:00',
    phone: '+90 533 555 6677', email: 'selin.dev@joobs.com',
    skills: ['Flutter', 'Firebase', 'React Native'],
    portfolio: ['Kurye App Uygulaması'], reviews: [],
  },
  {
    name: 'Murat Aksoy', title: 'Sosyal Medya Görsel Tasarımcısı', category: 'tasarim',
    priceNum: 500, color: '#8b5cf6', location: 'Kocaeli', hours: '11:00 - 23:00',
    phone: '+90 541 666 7788', email: 'murat.aksoy@joobs.com',
    skills: ['Canva', 'Video Montaj', 'Photoshop'],
    portfolio: ['Sosyal Medya Grid Çekimi'], reviews: [],
  },
];

async function run() {
  await connectDB();
  console.log('🌱 Eski veriler temizleniyor...');
  await Provider.deleteMany({});
  await Review.deleteMany({});

  for (const item of SEED) {
    const { reviews = [], ...data } = item;
    const provider = await Provider.create(data);

    if (reviews.length) {
      await Review.insertMany(reviews.map(r => ({ ...r, provider: provider._id })));
      const avg = reviews.reduce((s, r) => s + r.rate, 0) / reviews.length;
      provider.ratingNum = Number(avg.toFixed(2));
      provider.reviewCount = reviews.length;
      await provider.save();
    }
    console.log(`  ✓ ${provider.name} (${provider.category})`);
  }

  console.log(`\n✅ ${SEED.length} uzman eklendi.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
