/* ═══════════════════════════════════════════════════════════════════════════
   Joobs — Paylaşılan istemci yardımcıları (API, kimlik, tema, favoriler)
   r10 tasarım dili ile uyumlu
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Tema (dark varsayılan, r10 stili) ──────────────────────────────────────
const Theme = {
  init() {
    const t = localStorage.getItem('joobs_theme') || 'dark';
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
    Theme.syncIcons();
  },
  toggle() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('joobs_theme', dark ? 'dark' : 'light');
    Theme.syncIcons();
  },
  syncIcons() {
    const dark = document.documentElement.classList.contains('dark');
    document.getElementById('icon-sun')?.classList.toggle('hidden', dark);
    document.getElementById('icon-moon')?.classList.toggle('hidden', !dark);
  },
};

// ─── Kimlik (JWT) ───────────────────────────────────────────────────────────
const Auth = {
  token() { return localStorage.getItem('joobs_token'); },
  user() { try { return JSON.parse(localStorage.getItem('joobs_user')); } catch { return null; } },
  isLoggedIn() { return !!Auth.token(); },
  set(token, user) {
    localStorage.setItem('joobs_token', token);
    localStorage.setItem('joobs_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('joobs_token');
    localStorage.removeItem('joobs_user');
    location.reload();
  },
  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = Auth.token();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  },
};

// ─── API istemcisi ──────────────────────────────────────────────────────────
const API = {
  async req(method, url, body) {
    const opts = { method, headers: Auth.headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Hata (${res.status})`);
    return data;
  },
  get(u) { return API.req('GET', u); },
  post(u, b) { return API.req('POST', u, b); },

  // Domain yardımcıları
  providers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return API.get('/api/providers' + (q ? '?' + q : ''));
  },
  provider(id) { return API.get('/api/providers/' + id); },
  categories() { return API.get('/api/providers/categories'); },
  stats() { return API.get('/api/providers/stats'); },
  createProvider(b) { return API.post('/api/providers', b); },
  myListings() { return API.get('/api/providers/my-listings'); },
  updateProvider(id, b) { return API.req('PUT', '/api/providers/' + id, b); },
  deleteProvider(id) { return API.req('DELETE', '/api/providers/' + id); },
  reviews(id) { return API.get(`/api/providers/${id}/reviews`); },
  addReview(id, b) { return API.post(`/api/providers/${id}/reviews`, b); },
  register(b) { return API.post('/api/auth/register', b); },
  login(b) { return API.post('/api/auth/login', b); },
  toggleFavorite(id) { return API.post('/api/auth/favorites/' + id); },
  syncFavorites(arr) { return API.post('/api/auth/favorites/sync', { favorites: arr }); },
};

// ─── Favoriler (misafir → localStorage, üye → sunucu) ───────────────────────
const Favorites = {
  local() { try { return JSON.parse(localStorage.getItem('joobs_favorites')) || []; } catch { return []; } },
  saveLocal(arr) { localStorage.setItem('joobs_favorites', JSON.stringify(arr)); },
  has(id) { return Favorites.local().includes(String(id)); },

  async toggle(id) {
    id = String(id);
    const arr = Favorites.local();
    const idx = arr.indexOf(id);
    if (idx > -1) arr.splice(idx, 1); else arr.push(id);
    Favorites.saveLocal(arr);
    if (Auth.isLoggedIn()) { try { await API.toggleFavorite(id); } catch (_) { } }
    return arr;
  },

  // Giriş sonrası sunucu ve yerel favorileri birleştir
  async sync() {
    if (!Auth.isLoggedIn()) return;
    try {
      const { favorites } = await API.syncFavorites(Favorites.local());
      Favorites.saveLocal((favorites || []).map(String));
    } catch (_) { }
  },
};

// ─── Yardımcılar ────────────────────────────────────────────────────────────
const esc = s => (s ?? '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = n => (Number(n) || 0).toLocaleString('tr-TR') + ' TL';

function toast(msg, kind = 'ok') {
  const colors = {
    ok: 'from-violet-600 to-purple-600',
    err: 'from-red-600 to-rose-600',
    info: 'from-sky-600 to-cyan-600',
  };
  const el = document.createElement('div');
  el.className = `fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2.5 rounded-xl text-white text-sm
                  font-medium shadow-2xl shadow-black/30 bg-gradient-to-r ${colors[kind] || colors.ok} toast-in`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, 12px)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

// Avatar/gradient renkleri
function bannerStyle(color) { return `background: linear-gradient(135deg, ${color}, #1e1b2e);`; }

window.Theme = Theme;
window.Auth = Auth;
window.API = API;
window.Favorites = Favorites;
