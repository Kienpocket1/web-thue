/* =========================================================================
 * app.js — Điều hướng (hash router) và các màn hình theo vai trò
 * ========================================================================= */
(function () {
  'use strict';
  const D = window.DB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');

  // ------------------------------------------------------------ helpers
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';
  const fdate = (t) => t ? new Date(t).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const ftime = (t) => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const toLocalInput = (t) => { if (!t) return ''; const d = new Date(t - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
  const fromLocalInput = (v) => v ? new Date(v).getTime() : null;
  const CATS = ['Nhạc sống', 'Sân khấu', 'Thể thao', 'Hội thảo', 'Khác'];
  const CAT_ICON = { 'Nhạc sống': '🎵', 'Sân khấu': '🎭', 'Thể thao': '🏃', 'Hội thảo': '🎤', 'Khác': '🎪' };
  const ROLE_NAME = { CUSTOMER: 'Khách hàng', ORGANIZER: 'Đơn vị tổ chức', ADMIN: 'Quản trị viên', CSKH: 'Nhân viên CSKH', CHECKIN: 'Nhân sự check-in' };

  const ST = {
    event: { DRAFT: ['Bản nháp', 'gray'], PENDING: ['Chờ duyệt', 'yellow'], PUBLISHED: ['Đã công bố', 'green'], REJECTED: ['Bị từ chối', 'red'], CANCELLED: ['Đã hủy', 'red'] },
    order: { PENDING_PAYMENT: ['Chờ thanh toán', 'yellow'], PAID: ['Đã thanh toán', 'green'], CANCELLED: ['Đã hủy', 'gray'], EXPIRED: ['Hết hạn', 'gray'] },
    ticket: { VALID: ['Còn hiệu lực', 'green'], USED: ['Đã check-in', 'blue'], VOID: ['Đã vô hiệu', 'red'] },
    support: { NEW: ['Mới', 'yellow'], IN_PROGRESS: ['Đang xử lý', 'blue'], NEED_INFO: ['Chờ bổ sung', 'yellow'], FORWARDED: ['Đã chuyển xử lý', 'blue'], ANSWERED: ['Đã phản hồi', 'green'], CLOSED: ['Đã đóng', 'gray'] },
    refund: { WAIT_CS: ['Chờ CSKH kiểm tra', 'yellow'], WAIT_ORG: ['Chờ BTC xét duyệt', 'yellow'], WAIT_ADMIN: ['Chờ QTV xác minh', 'yellow'], APPROVED: ['Đã chấp thuận', 'blue'], REJECTED: ['Bị từ chối', 'red'], PROCESSING: ['Đang hoàn tiền', 'blue'], DONE: ['Đã hoàn tiền', 'green'] },
    issue: { NONE: ['—', 'gray'], ISSUED: ['Đã phát hành', 'green'], ERROR: ['Lỗi phát hành', 'red'] },
    user: { HOAT_DONG: ['Hoạt động', 'green'], KHOA: ['Đã khóa', 'red'] },
  };
  const badge = (kind, v) => { const x = (ST[kind] || {})[v] || [v, 'gray']; return `<span class="badge ${x[1]}">${esc(x[0])}</span>`; };

  function toast(msg, type) {
    const el = document.createElement('div'); el.className = 'toast ' + (type || ''); el.textContent = msg;
    const box = $('#toast'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), type === 'err' ? 6000 : 3500);
  }
  // Bọc lời gọi nghiệp vụ: hiện lỗi rõ ràng, không báo thành công khi chưa hoàn tất (YC-PCN-09)
  function act(fn, okMsg) {
    try { const r = fn(); if (okMsg) toast(okMsg); render(); return r; }
    catch (e) { toast(e.message || String(e), 'err'); if (!e.biz) console.error(e); return undefined; }
  }
  function modal(html, onMount) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) bg.remove(); });
    document.body.appendChild(bg); if (onMount) onMount(bg, () => bg.remove());
    const f = bg.querySelector('input,textarea,select,button'); if (f) f.focus();
  }
  function promptModal(title, label, cb, opts = {}) {
    modal(`<h3>${esc(title)}</h3><div class="field"><label>${esc(label)} ${opts.optional ? '' : '<span class="req">*</span>'}</label><textarea class="input" rows="3" id="pm"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn ${opts.danger ? 'danger' : 'primary'}" id="pmOk">${esc(opts.ok || 'Xác nhận')}</button></div>`,
      (bg, close) => $('#pmOk', bg).onclick = () => { try { cb($('#pm', bg).value); close(); } catch (e) { toast(e.message, 'err'); } });
  }
  function confirmModal(title, text, cb, danger) {
    modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Không</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cmOk">Đồng ý</button></div>`,
      (bg, close) => $('#cmOk', bg).onclick = () => { close(); cb(); });
  }
  function qr(el, text, size) {
    if (!el) return;
    if (window.QRCode) { el.innerHTML = ''; new window.QRCode(el, { text, width: size || 130, height: size || 130, correctLevel: window.QRCode.CorrectLevel.M }); }
    else el.innerHTML = `<div class="code">${esc(text)}</div>`;
  }

  // ------------------------------------------------------------ phiên đăng nhập
  const Session = {
    get() { try { return JSON.parse(localStorage.getItem('tg_session') || 'null'); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem('tg_session', JSON.stringify(v)) : localStorage.removeItem('tg_session'); } catch (e) {} },
  };
  let memSession = Session.get();
  function me() { if (!memSession) return null; const u = D.byId('users', memSession.userId); if (!u || u.status === 'KHOA') return null; return u; }
  function rolesOf(u) { if (!u) return []; const r = [...u.roles]; if (D.checkinEventsOf(u).length && !r.includes('CHECKIN')) r.push('CHECKIN'); return r; }
  function setSession(u) { memSession = u ? { userId: u.id } : null; Session.set(memSession); }

  // ------------------------------------------------------------ router
  const routes = [];
  const route = (pattern, view, guard) => routes.push({ re: new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), view, guard });
  function parse() {
    const raw = location.hash.slice(1) || '/';
    const [path, qs] = raw.split('?');
    return { path, q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function go(h) { location.hash = h; }
  function render() {
    D.sweepExpired();
    const { path, q } = parse();
    const u = me();
    renderHeader(u, path);
    for (const r of routes) {
      const m = path.match(r.re);
      if (!m) continue;
      if (r.guard) {
        if (!u) { app.innerHTML = needLogin(); return; }
        if (r.guard !== 'AUTH' && !rolesOf(u).includes(r.guard)) { app.innerHTML = `<div class="container"><div class="empty"><div class="ic">⛔</div><h2>Không có quyền truy cập</h2><p>Chức năng dành cho vai trò <b>${ROLE_NAME[r.guard]}</b>.</p></div></div>`; return; }
      }
      try { r.view(app, { params: m.slice(1).map(decodeURIComponent), q, u }); }
      catch (e) { console.error(e); app.innerHTML = `<div class="container"><div class="empty"><div class="ic">⚠️</div><h2>Không tìm thấy dữ liệu</h2><p class="muted">${esc(e.message)}</p><a class="btn primary" href="#/">Về trang chủ</a></div></div>`; }
      return;
    }
    app.innerHTML = `<div class="container"><div class="empty"><div class="ic">🔎</div><h2>Không tìm thấy trang</h2><a class="btn primary" href="#/">Về trang chủ</a></div></div>`;
  }
  function needLogin() {
    return `<div class="container"><div class="empty"><div class="ic">🔐</div><h2>Vui lòng đăng nhập</h2><p class="muted">Chức năng này yêu cầu xác thực.</p><a class="btn primary" href="#/login?next=${encodeURIComponent(location.hash)}">Đăng nhập</a></div></div>`;
  }

  // ------------------------------------------------------------ header
  function renderHeader(u, path) {
    const unread = u ? D.data.notifications.filter(n => n.userId === u.id && !n.read).length : 0;
    $('#navActions').innerHTML = `
      <a href="#/org/event/new" class="btn-outline-white hide-sm">+ Tạo sự kiện</a>
      <a href="#/my/orders" class="hide-sm">🎫 Vé của tôi</a>
      ${u ? `<span class="bell" style="position:relative"><button class="linkish" id="bellBtn" aria-label="Thông báo">🔔${unread ? `<span class="dot">${unread}</span>` : ''}</button></span>
             <a href="#/profile" title="${esc(u.email)}">👤 ${esc(u.name.length > 16 ? u.name.slice(0, 15) + '…' : u.name)}</a>
             <button class="linkish" id="logoutBtn">Đăng xuất</button>`
          : `<a href="#/login">Đăng nhập</a><a href="#/register" class="hide-sm">| Đăng ký</a>`}`;
    $('#catbar').innerHTML = `<a href="#/" class="${path === '/' ? 'active' : ''}">Trang chủ</a>` + CATS.map(c => `<a href="#/search?cat=${encodeURIComponent(c)}">${CAT_ICON[c]} ${c}</a>`).join('') + `<a href="#/guide">📘 Hướng dẫn demo</a>`;
    // Thanh chức năng theo vai trò
    const rb = $('#rolebar');
    if (!u) { rb.classList.add('hide'); }
    else {
      const roles = rolesOf(u); const L = [];
      if (roles.includes('CUSTOMER')) L.push(['#/my/orders', 'Đơn hàng & vé'], ['#/my/support', 'Hỗ trợ của tôi']);
      if (roles.includes('ORGANIZER')) L.push(['#/org', 'Sự kiện của tôi (BTC)']);
      if (roles.includes('CHECKIN')) L.push(['#/checkin', 'Check-in']);
      if (roles.includes('ADMIN')) L.push(['#/admin/review', 'Kiểm duyệt'], ['#/admin/users', 'Tài khoản & quyền'], ['#/admin/ticket-errors', 'Lỗi cung cấp vé'], ['#/admin/audit', 'Nhật ký']);
      if (roles.includes('CSKH')) L.push(['#/cs/support', 'Yêu cầu hỗ trợ'], ['#/cs/refunds', 'Hoàn vé / hoàn tiền']);
      rb.classList.remove('hide');
      $('#rolebarInner').innerHTML = `<span>Vai trò: <b>${roles.map(r => ROLE_NAME[r]).join(', ')}</b></span>` + L.map(([h, t]) => `<a href="${h}" class="${location.hash.startsWith(h) ? 'active' : ''}">${t}</a>`).join('');
    }
    const lb = $('#logoutBtn'); if (lb) lb.onclick = () => { setSession(null); toast('Đã đăng xuất.'); go('#/'); render(); };
    const bb = $('#bellBtn'); if (bb) bb.onclick = (e) => { e.stopPropagation(); toggleNotif(u, bb.parentElement); };
  }
  function toggleNotif(u, host) {
    const ex = $('.notif-panel'); if (ex) { ex.remove(); return; }
    const list = D.data.notifications.filter(n => n.userId === u.id).slice(0, 30);
    const p = document.createElement('div'); p.className = 'notif-panel';
    p.innerHTML = `<div class="n"><b>Thông báo</b></div>` + (list.length ? list.map(n => `<a class="n ${n.read ? '' : 'unread'}" href="${esc(n.link || '#/')}">${esc(n.text)}<div class="small muted">${ftime(n.createdAt)}</div></a>`).join('') : '<div class="n muted">Chưa có thông báo.</div>');
    host.appendChild(p);
    list.forEach(n => n.read = true); D.save();
    setTimeout(() => document.addEventListener('click', function h(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('click', h); renderHeader(me(), parse().path); } }), 0);
  }

  // ============================================================ PUBLIC
  const publicEvents = () => D.data.events.filter(e => e.status === 'PUBLISHED' && e.endAt > D.now());
  function evCard(e) {
    const types = D.typesOf(e.id);
    const soldOut = types.length && types.every(t => D.available(t) <= 0);
    const notOpen = types.length && types.every(t => D.saleState(t) === 'NOT_STARTED');
    return `<a class="ev-card" href="#/event/${e.id}">
      <div class="cover ${e.cover}">${CAT_ICON[e.category] || '🎪'}${soldOut ? '<span class="ribbon">Hết vé</span>' : notOpen ? '<span class="ribbon">Sắp mở bán</span>' : ''}</div>
      <h3>${esc(e.title)}</h3>
      <div class="price">Từ ${money(D.eventMinPrice(e.id))}</div>
      <div class="date">📅 ${fdate(e.startAt)}</div></a>`;
  }

  route('/', (el) => {
    const evs = publicEvents().sort((a, b) => a.startAt - b.startAt);
    const featured = evs.slice(0, 4);
    el.innerHTML = `<div class="container">
      <section class="hero"><div class="hero-track" id="heroTrack"></div><div class="hero-dots" id="heroDots"></div></section>
      <section class="section"><div class="section-head"><h2>🔥 Sự kiện sắp diễn ra</h2><a href="#/search">Xem thêm ›</a></div>
        <div class="grid">${evs.slice(0, 8).map(evCard).join('') || '<div class="empty">Chưa có sự kiện.</div>'}</div></section>
      ${CATS.map(c => { const l = evs.filter(e => e.category === c); return l.length ? `<section class="section"><div class="section-head"><h2>${CAT_ICON[c]} ${c}</h2><a href="#/search?cat=${encodeURIComponent(c)}">Xem thêm ›</a></div><div class="grid">${l.slice(0, 4).map(evCard).join('')}</div></section>` : ''; }).join('')}
    </div>`;
    let idx = 0;
    const draw = () => {
      if (!featured.length) return;
      const a = featured[idx % featured.length], b = featured[(idx + 1) % featured.length];
      $('#heroTrack').innerHTML = [a, b].map(e => `<div class="hero-card" onclick="location.hash='#/event/${e.id}'"><div class="cover ${e.cover}" style="font-size:110px">${CAT_ICON[e.category]}</div><div class="overlay"><span class="badge green" style="align-self:flex-start">${esc(e.category)}</span><h2>${esc(e.title)}</h2><div>📅 ${fdate(e.startAt)} · 📍 ${esc(e.venue)}</div><div class="row mt"><span class="btn primary sm">Mua vé ngay</span></div></div></div>`).join('');
      $('#heroDots').innerHTML = featured.map((_, i) => `<button class="${i === idx % featured.length ? 'on' : ''}" data-i="${i}" aria-label="Banner ${i + 1}"></button>`).join('');
      $$('#heroDots button').forEach(btn => btn.onclick = () => { idx = +btn.dataset.i; draw(); });
    };
    draw();
    clearInterval(window.__hero); window.__hero = setInterval(() => { if (!$('#heroTrack')) return clearInterval(window.__hero); idx++; draw(); }, 5000);
  });

  route('/search', (el, { q }) => {
    const kw = (q.q || '').toLowerCase().trim(); const cat = q.cat || '';
    $('#searchInput').value = q.q || '';
    const list = publicEvents().filter(e => (!cat || e.category === cat) && (!kw || (e.title + ' ' + e.venue + ' ' + e.address + ' ' + e.category).toLowerCase().includes(kw))).sort((a, b) => a.startAt - b.startAt);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>${kw ? `Kết quả cho “${esc(q.q)}”` : cat ? esc(cat) : 'Tất cả sự kiện'}</h1><span class="muted">${list.length} sự kiện</span></div>
      <div class="chips mb"><a class="chip ${!cat ? 'on' : ''}" href="#/search${kw ? '?q=' + encodeURIComponent(q.q) : ''}">Tất cả</a>${CATS.map(c => `<a class="chip ${cat === c ? 'on' : ''}" href="#/search?cat=${encodeURIComponent(c)}${kw ? '&q=' + encodeURIComponent(q.q) : ''}">${CAT_ICON[c]} ${c}</a>`).join('')}</div>
      <div class="grid">${list.map(evCard).join('')}</div>${list.length ? '' : '<div class="empty"><div class="ic">🔍</div><p>Không tìm thấy sự kiện phù hợp. Hãy thử từ khóa khác.</p></div>'}</div>`;
  });

  route('/event/:id', (el, { params, u }) => {
    const e = D.byId('events', params[0]);
    if (!e) throw new Error('Sự kiện không tồn tại.');
    const isMgr = u && D.canManageEvent(u, e);
    if (e.status !== 'PUBLISHED' && e.status !== 'CANCELLED' && !isMgr && !(u && u.roles.includes('ADMIN'))) throw new Error('Sự kiện chưa được công bố.');
    const types = D.typesOf(e.id);
    const stateTxt = (t) => ({ NOT_STARTED: `<span class="badge yellow">Mở bán ${ftime(t.saleStart)}</span>`, ENDED: '<span class="badge gray">Đã ngừng bán</span>', SOLD_OUT: '<span class="badge red">Hết vé</span>', ON_SALE: `<span class="badge green">Còn ${D.available(t)} vé</span>` }[D.saleState(t)]);
    const canBuy = e.status === 'PUBLISHED' && types.some(t => D.saleState(t) === 'ON_SALE');
    el.innerHTML = `<div class="ev-hero"><div class="container">
      ${e.status !== 'PUBLISHED' ? `<div class="panel mb">Trạng thái: ${badge('event', e.status)} ${e.status === 'CANCELLED' ? '— ' + esc(e.cancelReason || '') : '(chỉ BTC/QTV xem được)'}</div>` : ''}
      <div class="ev-ticket">
        <div class="info">
          <h1>${esc(e.title)}</h1>
          <div class="meta"><span>📅</span><span>${ftime(e.startAt)} – ${new Date(e.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, ${fdate(e.startAt)}</span></div>
          <div class="meta"><span>📍</span><span><b>${esc(e.venue)}</b><br><span class="muted">${esc(e.address)}</span></span></div>
          <div class="price-line"><div class="row between"><span>Giá từ <b>${money(D.eventMinPrice(e.id))}</b></span></div>
          <a class="btn primary block mt ${canBuy ? '' : 'disabled'}" ${canBuy ? `href="#/book/${e.id}"` : 'aria-disabled="true" style="pointer-events:none;opacity:.5"'}>${canBuy ? 'Mua vé ngay' : e.status === 'CANCELLED' ? 'Sự kiện đã hủy' : 'Chưa thể đặt vé'}</a></div>
        </div>
        <div class="cover ${e.cover}">${CAT_ICON[e.category]}</div>
      </div></div></div>
      <div class="container mt2 layout-side">
        <div>
          <div class="content-box"><h3>Giới thiệu</h3><p style="white-space:pre-line">${esc(e.description)}</p><h3>Chính sách hoàn vé</h3><p>${esc(e.refundPolicy || 'Theo chính sách của đơn vị tổ chức.')}</p></div>
        </div>
        <div>
          <div class="section-head"><h2>Thông tin vé</h2></div>
          <div class="tt-list">${types.map(t => `<div class="tt-item"><div><div class="name">${esc(t.name)}</div><div class="small muted">Mua ${t.minPerOrder}–${t.maxPerOrder} vé/đơn · Bán đến ${ftime(t.saleEnd)}</div></div><div class="right"><div style="color:var(--brand);font-weight:700">${money(t.price)}</div>${stateTxt(t)}</div></div>`).join('') || '<div class="tt-item muted">Chưa có loại vé.</div>'}</div>
          <div class="panel mt small muted">Tổ chức bởi <b style="color:var(--text)">${esc((D.byId('users', e.ownerId) || {}).name)}</b></div>
        </div>
      </div>`;
  });

  // ------------------------------------------------------------ auth (UC-09, 10)
  route('/login', (el, { q }) => {
    const demo = [['khach@demo.vn', 'Khách hàng'], ['btc@demo.vn', 'Đơn vị tổ chức'], ['admin@demo.vn', 'Quản trị viên'], ['cskh@demo.vn', 'Nhân viên CSKH'], ['checkin@demo.vn', 'Nhân sự check-in'], ['btc2@demo.vn', 'BTC thứ hai']];
    el.innerHTML = `<div class="container"><div class="auth panel">
      <h1>Đăng nhập</h1>
      <form id="f" novalidate>
        <div class="field"><label>Email <span class="req">*</span></label><input class="input" name="email" type="email" autocomplete="username" required></div>
        <div class="field"><label>Mật khẩu <span class="req">*</span></label><input class="input" name="password" type="password" autocomplete="current-password" required></div>
        <button class="btn primary block">Đăng nhập</button>
      </form>
      <p class="small muted mt">Chưa có tài khoản? <a href="#/register" style="color:var(--brand)">Đăng ký</a></p>
      <h4 class="mt2">Tài khoản demo <span class="muted small">(mật khẩu: 123456)</span></h4>
      <div class="demo-accounts">${demo.map(([m, r]) => `<button type="button" data-m="${m}"><b>${r}</b><span>${m}</span></button>`).join('')}</div>
    </div></div>`;
    const doLogin = (email, pw) => {
      try { const u = D.login(email, pw); setSession(u); toast('Xin chào ' + u.name + '!'); go(q.next ? decodeURIComponent(q.next) : defaultHome(u)); }
      catch (e) { toast(e.message, 'err'); }
    };
    $('#f').onsubmit = (ev) => { ev.preventDefault(); const f = new FormData(ev.target); doLogin(f.get('email'), f.get('password')); };
    $$('.demo-accounts button').forEach(b => b.onclick = () => doLogin(b.dataset.m, '123456'));
  });
  function defaultHome(u) {
    const r = rolesOf(u);
    if (r.includes('ADMIN')) return '#/admin/review';
    if (r.includes('CSKH')) return '#/cs/support';
    if (r.includes('ORGANIZER')) return '#/org';
    if (r.includes('CHECKIN') && u.email.startsWith('checkin')) return '#/checkin';
    return '#/';
  }
  route('/register', (el) => {
    el.innerHTML = `<div class="container"><div class="auth panel"><h1>Đăng ký tài khoản</h1>
      <form id="f" novalidate>
        <div class="field"><label>Họ và tên <span class="req">*</span></label><input class="input" name="name"></div>
        <div class="field"><label>Email <span class="req">*</span></label><input class="input" name="email" type="email"></div>
        <div class="field"><label>Số điện thoại <span class="req">*</span></label><input class="input" name="phone" placeholder="0xxxxxxxxx"><span class="hint">10 chữ số, bắt đầu bằng 0</span></div>
        <div class="grid2"><div class="field"><label>Mật khẩu <span class="req">*</span></label><input class="input" name="password" type="password"><span class="hint">Tối thiểu 6 ký tự</span></div>
        <div class="field"><label>Xác nhận mật khẩu <span class="req">*</span></label><input class="input" name="confirm" type="password"></div></div>
        <button class="btn primary block">Tạo tài khoản</button></form>
      <p class="small muted mt">Đã có tài khoản? <a href="#/login" style="color:var(--brand)">Đăng nhập</a></p></div></div>`;
    $('#f').onsubmit = (ev) => { ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target)); try { const u = D.register(d); setSession(u); toast('Đăng ký thành công!'); go('#/'); } catch (e) { toast(e.message, 'err'); } };
  });
  route('/profile', (el, { u }) => {
    el.innerHTML = `<div class="container"><div class="auth panel"><h1>Thông tin cá nhân</h1>
      <form id="f"><div class="field"><label>Email</label><input class="input" value="${esc(u.email)}" disabled></div>
      <div class="field"><label>Họ tên <span class="req">*</span></label><input class="input" name="name" value="${esc(u.name)}"></div>
      <div class="field"><label>Số điện thoại <span class="req">*</span></label><input class="input" name="phone" value="${esc(u.phone)}"></div>
      <div class="field"><label>Mật khẩu mới</label><input class="input" name="password" type="password" placeholder="Để trống nếu không đổi"></div>
      <div class="field"><label>Vai trò</label><div>${rolesOf(u).map(r => `<span class="badge green">${ROLE_NAME[r]}</span>`).join(' ')}</div></div>
      <button class="btn primary block">Lưu thay đổi</button></form></div></div>`;
    $('#f').onsubmit = (ev) => { ev.preventDefault(); act(() => D.updateProfile(u.id, Object.fromEntries(new FormData(ev.target))), 'Đã cập nhật thông tin.'); };
  }, 'AUTH');

  // ============================================================ KHÁCH HÀNG
  // UC-03 Đặt vé
  route('/book/:id', (el, { params, u }) => {
    const e = D.byId('events', params[0]);
    if (!e || e.status !== 'PUBLISHED') throw new Error('Sự kiện không mở bán.');
    const types = D.typesOf(e.id);
    const sel = {}; types.forEach(t => sel[t.id] = 0);
    el.innerHTML = `<div class="container">
      <div class="page-title"><h1>Đặt vé: ${esc(e.title)}</h1><a class="btn ghost sm" href="#/event/${e.id}">‹ Quay lại</a></div>
      <div class="steps"><div class="s on"><i>1</i>Chọn vé</div><div class="sep"></div><div class="s on"><i>2</i>Thông tin người tham dự</div><div class="sep"></div><div class="s"><i>3</i>Thanh toán</div><div class="sep"></div><div class="s"><i>4</i>Nhận vé</div></div>
      <div class="layout-side">
        <div>
          <div class="panel"><h3>1. Chọn loại vé</h3>
            ${types.map(t => { const st = D.saleState(t); const on = st === 'ON_SALE'; return `<div class="tt-item" style="padding-left:0;padding-right:0">
              <div><div class="name">${esc(t.name)}</div><div class="small muted">${money(t.price)} · Mua ${t.minPerOrder}–${t.maxPerOrder} vé · ${on ? 'Còn ' + D.available(t) + ' vé' : ({ NOT_STARTED: 'Chưa mở bán', ENDED: 'Đã ngừng bán', SOLD_OUT: 'Hết vé' })[st]}</div></div>
              <div class="qty"><button type="button" data-d="-1" data-t="${t.id}" ${on ? '' : 'disabled'}>−</button><input data-t="${t.id}" value="0" inputmode="numeric" ${on ? '' : 'disabled'} aria-label="Số lượng ${esc(t.name)}"><button type="button" data-d="1" data-t="${t.id}" ${on ? '' : 'disabled'}>+</button></div></div>`; }).join('')}
          </div>
          <div class="panel"><h3>2. Thông tin người tham dự</h3>
            <div class="grid2"><div class="field"><label>Họ tên <span class="req">*</span></label><input class="input" id="aName" value="${esc(u.name)}"></div>
            <div class="field"><label>Số điện thoại <span class="req">*</span></label><input class="input" id="aPhone" value="${esc(u.phone)}"></div></div>
            <div class="field"><label>Email nhận vé <span class="req">*</span></label><input class="input" id="aEmail" value="${esc(u.email)}"></div>
          </div>
        </div>
        <div class="panel" style="position:sticky;top:90px"><h3>Tóm tắt đơn hàng</h3><div id="sum"></div>
          <button class="btn primary block mt" id="confirm">Xác nhận đặt vé</button>
          <p class="small muted mt">Sau khi xác nhận, vé được tạm giữ trong <b>${D.HOLD_MINUTES} phút</b> để bạn thanh toán.</p></div>
      </div></div>`;
    const drawSum = () => {
      let total = 0; const lines = types.filter(t => sel[t.id] > 0).map(t => { total += sel[t.id] * t.price; return `<div class="summary-line"><span>${esc(t.name)} × ${sel[t.id]}</span><span>${money(sel[t.id] * t.price)}</span></div>`; });
      $('#sum').innerHTML = (lines.join('') || '<p class="muted">Chưa chọn vé.</p>') + `<div class="summary-line summary-total"><span>Tổng cộng</span><span>${money(total)}</span></div>`;
    };
    $$('.qty button').forEach(b => b.onclick = () => { const id = b.dataset.t; sel[id] = Math.max(0, sel[id] + Number(b.dataset.d)); $(`.qty input[data-t="${id}"]`).value = sel[id]; drawSum(); });
    $$('.qty input').forEach(i => i.oninput = () => { const v = parseInt(i.value, 10); sel[i.dataset.t] = isNaN(v) || v < 0 ? 0 : v; drawSum(); });
    drawSum();
    $('#confirm').onclick = () => {
      try {
        const o = D.placeOrder(u, e.id, sel, { name: $('#aName').value, phone: $('#aPhone').value, email: $('#aEmail').value });
        toast('Đã tạo đơn ' + o.id + '. Vui lòng thanh toán.'); go('#/pay/' + o.id);
      } catch (err) { toast(err.message, 'err'); }
    };
  }, 'AUTH');

  // UC-04 Thanh toán (mô phỏng cổng thanh toán)
  route('/pay/:id', (el, { params, u }) => {
    const o = D.byId('orders', params[0]);
    if (!o || o.userId !== u.id) throw new Error('Không tìm thấy đơn hàng.');
    const e = D.byId('events', o.eventId);
    if (o.status !== 'PENDING_PAYMENT') { go('#/my/order/' + o.id); return; }
    const fails = D.data.payments.filter(p => p.orderId === o.id && p.result === 'FAILED').length;
    el.innerHTML = `<div class="container">
      <div class="page-title"><h1>Thanh toán đơn ${esc(o.id)}</h1></div>
      <div class="steps"><div class="s on"><i>1</i>Chọn vé</div><div class="sep"></div><div class="s on"><i>2</i>Thông tin</div><div class="sep"></div><div class="s on"><i>3</i>Thanh toán</div><div class="sep"></div><div class="s"><i>4</i>Nhận vé</div></div>
      <div class="layout-side">
        <div class="panel">
          <h3>Phương thức thanh toán</h3>
          ${['Ví điện tử (mô phỏng)', 'Thẻ ATM nội địa (mô phỏng)', 'Thẻ quốc tế (mô phỏng)'].map((m, i) => `<label class="tt-item" style="cursor:pointer;padding-left:0"><span><input type="radio" name="pm" value="${m}" ${i ? '' : 'checked'}> ${m}</span></label>`).join('')}
          ${fails ? `<div class="badge red mt">Đã có ${fails} lần thanh toán thất bại – bạn có thể thử lại khi đơn còn hiệu lực</div>` : ''}
          <div class="panel mt" style="background:var(--bg-2)"><b>🧪 Cổng thanh toán mô phỏng</b><p class="small muted">Đề tài không tích hợp cổng thanh toán thật. Chọn kết quả giao dịch để minh họa các luồng của UC-04.</p>
            <div class="row"><button class="btn primary" data-o="SUCCESS">✔ Thanh toán thành công</button><button class="btn danger" data-o="FAILED">✖ Thanh toán thất bại</button><button class="btn warn" data-o="SUCCESS_ISSUE_ERROR">⚠ Thành công nhưng lỗi phát hành vé</button></div></div>
          <button class="btn ghost mt" id="cancel">Hủy đơn</button>
        </div>
        <div class="panel"><h3>${esc(e.title)}</h3><div class="muted small">${ftime(e.startAt)} · ${esc(e.venue)}</div>
          <div class="mt">${D.itemsOf(o.id).map(i => `<div class="summary-line"><span>${esc(D.byId('ticketTypes', i.ticketTypeId).name)} × ${i.quantity}</span><span>${money(i.unitPrice * i.quantity)}</span></div>`).join('')}
          <div class="summary-line summary-total"><span>Tổng cộng</span><span>${money(o.total)}</span></div></div>
          <div class="mt center"><div class="muted small">Thời gian giữ vé còn lại</div><div class="countdown" id="cd"></div></div></div>
      </div></div>`;
    const tick = () => { const cd = $('#cd'); if (!cd) return clearInterval(window.__cd); const ms = o.expiresAt - D.now(); if (ms <= 0) { clearInterval(window.__cd); render(); return; } cd.textContent = String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0'); };
    clearInterval(window.__cd); tick(); window.__cd = setInterval(tick, 1000);
    $$('[data-o]').forEach(b => b.onclick = () => {
      const method = ($('input[name=pm]:checked') || {}).value;
      const r = act(() => D.pay(u, o.id, b.dataset.o, method));
      if (!r) return;
      if (r.failed) toast('Thanh toán thất bại. Bạn có thể thử lại.', 'err');
      else { toast(r.order.issueStatus === 'ERROR' ? 'Đã ghi nhận thanh toán nhưng chưa phát hành đủ vé. Hệ thống sẽ xử lý.' : 'Thanh toán thành công! Vé đã được phát hành.', r.order.issueStatus === 'ERROR' ? 'warn' : ''); go('#/my/order/' + o.id); }
    });
    $('#cancel').onclick = () => confirmModal('Hủy đơn hàng?', 'Lượng vé tạm giữ sẽ được giải phóng.', () => { act(() => D.cancelUnpaidOrder(u, o.id), 'Đã hủy đơn.'); go('#/my/orders'); }, true);
  }, 'AUTH');

  // UC-18/20 Tra cứu đơn hàng & vé của khách hàng
  route('/my/orders', (el, { u }) => {
    const orders = D.data.orders.filter(o => o.userId === u.id).sort((a, b) => b.createdAt - a.createdAt);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Vé của tôi</h1></div>
      <div class="panel table-wrap">${orders.length ? `<table class="tbl"><thead><tr><th>Mã đơn</th><th>Sự kiện</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th>Vé</th><th></th></tr></thead><tbody>
      ${orders.map(o => { const e = D.byId('events', o.eventId); return `<tr><td><b>${o.id}</b></td><td>${esc(e.title)}<div class="small muted">${fdate(e.startAt)}</div></td><td>${ftime(o.createdAt)}</td><td>${money(o.total)}</td><td>${badge('order', o.status)} ${o.refundStatus === 'REFUNDED' ? '<span class="badge blue">Đã hoàn tiền</span>' : ''}</td><td>${o.status === 'PAID' ? badge('issue', o.issueStatus) : ''}</td><td><a class="btn sm ${o.status === 'PENDING_PAYMENT' ? 'primary' : ''}" href="#/${o.status === 'PENDING_PAYMENT' ? 'pay' : 'my/order'}/${o.id}">${o.status === 'PENDING_PAYMENT' ? 'Thanh toán' : 'Chi tiết'}</a></td></tr>`; }).join('')}
      </tbody></table>` : '<div class="empty"><div class="ic">🎫</div><p>Bạn chưa có đơn hàng nào.</p><a class="btn primary" href="#/">Khám phá sự kiện</a></div>'}</div></div>`;
  }, 'AUTH');

  route('/my/order/:id', (el, { params, u }) => {
    const o = D.byId('orders', params[0]);
    if (!o || o.userId !== u.id) throw new Error('Không tìm thấy đơn hàng.');
    const e = D.byId('events', o.eventId);
    const tickets = D.ticketsOf(o.id);
    const reqs = D.data.refundRequests.filter(r => r.orderId === o.id);
    const elig = D.refundEligibility(o);
    const pays = D.data.payments.filter(p => p.orderId === o.id);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Đơn hàng ${o.id}</h1><a class="btn ghost sm" href="#/my/orders">‹ Danh sách đơn</a></div>
      <div class="layout-side"><div>
        ${o.issueStatus === 'ERROR' ? '<div class="panel" style="border:1px solid var(--warn)">⚠ Đơn đã thanh toán nhưng <b>chưa phát hành đủ vé</b>. Hệ thống đã ghi nhận lỗi; bạn có thể gửi yêu cầu hỗ trợ hoặc chờ xử lý.</div>' : ''}
        <div class="panel"><h3>Vé điện tử (${tickets.length})</h3>
          ${tickets.length ? `<div class="ticket-grid">${tickets.map(t => `<div class="eticket ${t.status === 'VOID' ? 'void' : ''}"><div class="l"><b>${esc(e.title)}</b><div class="small">${ftime(e.startAt)}</div><div class="small">${esc(e.venue)}</div><div class="mt"><span class="small">Loại vé</span><div><b>${esc(D.byId('ticketTypes', t.ticketTypeId).name)}</b></div></div><div class="mt">${badge('ticket', t.status)}</div></div><div class="r"><div class="qr" data-qr="${t.code}"></div><div class="code">${t.code}</div></div></div>`).join('')}</div>` : '<p class="muted">Chưa có vé được phát hành cho đơn này.</p>'}
        </div>
        <div class="panel"><h3>Hoàn vé</h3>
          ${reqs.map(r => `<div class="panel" style="background:var(--bg-2)"><div class="row between"><b>${r.id}</b>${badge('refund', r.status)}</div><div class="small muted">Lý do: ${esc(r.reason)}</div>${r.decisionNote ? `<div class="small">Phản hồi: ${esc(r.decisionNote)}</div>` : ''}<div class="timeline mt">${r.history.map(h => `<div class="it">${esc(h.text)}<div class="small muted">${ftime(h.at)}</div></div>`).join('')}</div></div>`).join('')}
          ${elig ? `<p class="muted small">${esc(elig)}</p>` : `<p class="small muted">Chính sách: ${esc(e.refundPolicy || '')}</p><button class="btn warn" id="rf">Yêu cầu hoàn vé toàn bộ đơn</button>`}
        </div>
      </div><div>
        <div class="panel"><h3>Thông tin đơn</h3>
          <div class="summary-line"><span class="muted">Trạng thái</span><span>${badge('order', o.status)}</span></div>
          <div class="summary-line"><span class="muted">Sự kiện</span><a href="#/event/${e.id}" style="color:var(--brand)">${esc(e.title)}</a></div>
          <div class="summary-line"><span class="muted">Người tham dự</span><span>${esc(o.attendee.name)}</span></div>
          <div class="summary-line"><span class="muted">Email nhận vé</span><span>${esc(o.attendee.email)}</span></div>
          ${D.itemsOf(o.id).map(i => `<div class="summary-line"><span>${esc(D.byId('ticketTypes', i.ticketTypeId).name)} × ${i.quantity}</span><span>${money(i.unitPrice * i.quantity)}</span></div>`).join('')}
          <div class="summary-line summary-total"><span>Tổng</span><span>${money(o.total)}</span></div>
          <h4 class="mt">Giao dịch</h4>${pays.map(p => `<div class="summary-line small"><span>${p.ref} · ${ftime(p.createdAt)}</span><span>${p.result === 'SUCCESS' ? '<span class="badge green">Thành công</span>' : '<span class="badge red">Thất bại</span>'}</span></div>`).join('') || '<p class="small muted">Chưa có giao dịch.</p>'}
          ${o.closeReason ? `<p class="small muted">Ghi chú: ${esc(o.closeReason)}</p>` : ''}
          ${o.status === 'PAID' ? `<button class="btn block mt" id="sp">Gửi yêu cầu hỗ trợ</button>` : ''}
        </div></div></div></div>`;
    $$('[data-qr]').forEach(x => qr(x, x.dataset.qr, 120));
    const rf = $('#rf'); if (rf) rf.onclick = () => promptModal('Yêu cầu hoàn vé ' + o.id, 'Lý do hoàn vé (tối thiểu 10 ký tự)', (v) => { D.requestRefund(u, o.id, v); toast('Đã gửi yêu cầu hoàn vé.'); render(); });
    const sp = $('#sp'); if (sp) sp.onclick = () => supportForm(u, o.id);
  }, 'AUTH');

  function supportForm(u, orderId) {
    const orders = D.data.orders.filter(o => o.userId === u.id && o.status === 'PAID');
    modal(`<h3>Gửi yêu cầu hỗ trợ</h3>
      <div class="field"><label>Đơn hàng <span class="req">*</span></label><select class="input" id="sO">${orders.map(o => `<option value="${o.id}" ${o.id === orderId ? 'selected' : ''}>${o.id} – ${esc(D.byId('events', o.eventId).title)}</option>`).join('')}</select></div>
      <div class="field"><label>Phân loại</label><select class="input" id="sC"><option value="NHAN_VE">Nhận vé</option><option value="THANH_TOAN">Thanh toán</option><option value="SU_DUNG_VE">Sử dụng vé</option><option value="KHAC">Khác</option></select></div>
      <div class="field"><label>Tiêu đề <span class="req">*</span></label><input class="input" id="sS"></div>
      <div class="field"><label>Nội dung <span class="req">*</span></label><textarea class="input" id="sT" rows="4"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn primary" id="sOk">Gửi</button></div>`,
      (bg, close) => $('#sOk', bg).onclick = () => { try { const s = D.createSupport(u, { orderId: $('#sO', bg).value, category: $('#sC', bg).value, subject: $('#sS', bg).value, content: $('#sT', bg).value }); close(); toast('Đã gửi yêu cầu ' + s.id); go('#/my/support/' + s.id); } catch (e) { toast(e.message, 'err'); } });
  }

  route('/my/support', (el, { u }) => {
    const list = D.data.supports.filter(s => s.userId === u.id);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Yêu cầu hỗ trợ của tôi</h1><button class="btn primary" id="new">+ Gửi yêu cầu</button></div>
      <div class="panel table-wrap">${list.length ? `<table class="tbl"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Đơn hàng</th><th>Ngày gửi</th><th>Trạng thái</th><th></th></tr></thead><tbody>${list.map(s => `<tr><td>${s.id}</td><td>${esc(s.subject)}</td><td>${s.orderId}</td><td>${ftime(s.createdAt)}</td><td>${badge('support', s.status)}</td><td><a class="btn sm" href="#/my/support/${s.id}">Xem</a></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Chưa có yêu cầu hỗ trợ.</div>'}</div></div>`;
    $('#new').onclick = () => supportForm(u);
  }, 'AUTH');

  function supportThread(el, s, u, isCS) {
    const owner = D.byId('users', s.userId); const o = D.byId('orders', s.orderId);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>${s.id}: ${esc(s.subject)}</h1><a class="btn ghost sm" href="${isCS ? '#/cs/support' : '#/my/support'}">‹ Quay lại</a></div>
      <div class="layout-side"><div class="panel">
        <div class="msg"><b>${esc(owner.name)}</b> <span class="small muted">${ftime(s.createdAt)}</span><div>${esc(s.content)}</div></div>
        ${s.messages.map(m => `<div class="msg ${m.role === 'CSKH' ? 'cs' : ''}"><b>${m.role === 'CSKH' ? '🎧 CSKH' : esc(owner.name)}</b> <span class="small muted">${ftime(m.at)}</span><div style="white-space:pre-line">${esc(m.text)}</div></div>`).join('')}
        ${s.status !== 'CLOSED' ? `<div class="field mt"><label>Phản hồi</label><textarea class="input" id="rep" rows="3"></textarea></div>
          <div class="row">${isCS ? `<select class="input" id="ns" style="max-width:240px"><option value="IN_PROGRESS">Đang xử lý</option><option value="NEED_INFO">Yêu cầu bổ sung thông tin</option><option value="FORWARDED">Chuyển bên có trách nhiệm</option><option value="ANSWERED">Đã phản hồi</option><option value="CLOSED">Đóng yêu cầu</option></select>` : ''}<button class="btn primary" id="send">Gửi phản hồi</button></div>` : '<p class="muted">Yêu cầu đã đóng.</p>'}
      </div><div class="panel"><h3>Thông tin</h3>
        <div class="summary-line"><span class="muted">Trạng thái</span>${badge('support', s.status)}</div>
        <div class="summary-line"><span class="muted">Khách hàng</span><span>${esc(owner.name)}</span></div>
        <div class="summary-line"><span class="muted">Đơn hàng</span><span>${o.id}</span></div>
        <div class="summary-line"><span class="muted">Đơn</span>${badge('order', o.status)}</div>
        <div class="summary-line"><span class="muted">Phát hành vé</span>${badge('issue', o.issueStatus)}</div>
        <div class="summary-line"><span class="muted">Số vé</span><span>${D.ticketsOf(o.id).length}</span></div>
        ${isCS && o.issueStatus === 'ERROR' ? `<p class="small" style="color:var(--warn)">Đơn đã thanh toán nhưng chưa có vé → hướng dẫn khách gửi yêu cầu hoàn vé hoặc chờ QTV xác minh tại “Lỗi cung cấp vé”.</p>` : ''}
      </div></div></div>`;
    const b = $('#send'); if (b) b.onclick = () => act(() => D.supportReply(u, s.id, $('#rep').value, isCS ? $('#ns').value : null), 'Đã gửi phản hồi.');
  }
  route('/my/support/:id', (el, { params, u }) => { const s = D.byId('supports', params[0]); if (!s || s.userId !== u.id) throw new Error('Không tìm thấy yêu cầu.'); supportThread(el, s, u, false); }, 'AUTH');

  // ============================================================ ĐƠN VỊ TỔ CHỨC
  route('/org', (el, { u }) => {
    const evs = D.data.events.filter(e => D.canManageEvent(u, e)).sort((a, b) => b.createdAt - a.createdAt);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Sự kiện của tôi</h1><a class="btn primary" href="#/org/event/new">+ Tạo sự kiện</a></div>
      <div class="panel table-wrap">${evs.length ? `<table class="tbl"><thead><tr><th>Sự kiện</th><th>Thời gian</th><th>Trạng thái</th><th>Đã bán</th><th>Check-in</th><th></th></tr></thead><tbody>
      ${evs.map(e => { const s = D.eventStats(e.id); const total = s.types.reduce((a, t) => a + t.quantity, 0); return `<tr><td><b>${esc(e.title)}</b><div class="small muted">${esc(e.venue)}</div>${e.status === 'REJECTED' ? `<div class="small" style="color:#f87171">Lý do từ chối: ${esc(e.reviewNote)}</div>` : ''}</td><td>${ftime(e.startAt)}</td><td>${badge('event', e.status)}</td><td>${s.sold}/${total}<div class="bar" style="width:100px"><div style="width:${total ? s.sold / total * 100 : 0}%"></div></div></td><td>${s.checkedIn}/${s.issued}</td><td class="row">${['DRAFT', 'REJECTED'].includes(e.status) ? `<a class="btn sm" href="#/org/event/${e.id}/edit">Sửa</a>` : ''}<a class="btn sm primary" href="#/org/event/${e.id}">Quản lý</a></td></tr>`; }).join('')}</tbody></table>`
        : `<div class="empty"><div class="ic">📅</div><p>Bạn chưa có sự kiện nào.</p>${u.roles.includes('ORGANIZER') ? '' : '<p class="small">Tài khoản cần được quản trị viên cấp quyền <b>Đơn vị tổ chức</b> để tạo sự kiện.</p>'}</div>`}</div></div>`;
  }, 'AUTH');

  // UC-01, UC-15, UC-16 — tạo/sửa sự kiện + loại vé
  function eventEditor(el, u, ev) {
    const isNew = !ev;
    const types = ev ? D.typesOf(ev.id) : [];
    const errs = ev ? D.validateEventForSubmit(ev) : [];
    el.innerHTML = `<div class="container"><div class="page-title"><h1>${isNew ? 'Tạo sự kiện mới' : 'Chỉnh sửa: ' + esc(ev.title)}</h1>${ev ? badge('event', ev.status) : ''}</div>
      ${ev && ev.status === 'REJECTED' ? `<div class="panel mb" style="border:1px solid var(--danger)">❌ Bị từ chối: ${esc(ev.reviewNote)} — hãy chỉnh sửa rồi gửi lại.</div>` : ''}
      <div class="steps"><div class="s on"><i>1</i>Thông tin sự kiện</div><div class="sep"></div><div class="s ${ev ? 'on' : ''}"><i>2</i>Loại vé</div><div class="sep"></div><div class="s ${ev && !errs.length ? 'on' : ''}"><i>3</i>Gửi kiểm duyệt</div></div>
      <div class="panel"><h3>1. Thông tin sự kiện</h3>
      <form id="ef" novalidate>
        <div class="field"><label>Tên sự kiện <span class="req">*</span></label><input class="input" name="title" value="${esc(ev ? ev.title : '')}" maxlength="120"></div>
        <div class="grid3"><div class="field"><label>Thể loại <span class="req">*</span></label><select class="input" name="category">${CATS.map(c => `<option ${ev && ev.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Bắt đầu <span class="req">*</span></label><input class="input" type="datetime-local" name="startAt" value="${toLocalInput(ev && ev.startAt)}"></div>
          <div class="field"><label>Kết thúc <span class="req">*</span></label><input class="input" type="datetime-local" name="endAt" value="${toLocalInput(ev && ev.endAt)}"></div></div>
        <div class="grid2"><div class="field"><label>Tên địa điểm <span class="req">*</span></label><input class="input" name="venue" value="${esc(ev ? ev.venue : '')}"></div>
          <div class="field"><label>Địa chỉ <span class="req">*</span></label><input class="input" name="address" value="${esc(ev ? ev.address : '')}"></div></div>
        <div class="field"><label>Mô tả <span class="req">*</span></label><textarea class="input" name="description" rows="4">${esc(ev ? ev.description : '')}</textarea><span class="hint">Tối thiểu 20 ký tự</span></div>
        <div class="field"><label>Chính sách hoàn vé</label><input class="input" name="refundPolicy" value="${esc(ev ? ev.refundPolicy || '' : 'Hoàn vé toàn bộ đơn trước ngày diễn ra 3 ngày, chưa check-in.')}"></div>
        <button class="btn">💾 Lưu bản nháp</button>
      </form></div>
      ${ev ? `<div class="panel"><div class="row between"><h3>2. Loại vé</h3><button class="btn sm primary" id="addTT">+ Thêm loại vé</button></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Tên</th><th>Giá</th><th>Số lượng</th><th>Giới hạn/đơn</th><th>Thời gian bán</th><th></th></tr></thead><tbody>
        ${types.map(t => `<tr><td>${esc(t.name)}</td><td>${money(t.price)}</td><td>${t.quantity}</td><td>${t.minPerOrder}–${t.maxPerOrder}</td><td class="small">${ftime(t.saleStart)}<br>→ ${ftime(t.saleEnd)}</td><td class="row"><button class="btn sm" data-edit="${t.id}">Sửa</button><button class="btn sm ghost" data-del="${t.id}">Xóa</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có loại vé.</td></tr>'}
        </tbody></table></div></div>
        <div class="panel"><h3>3. Gửi yêu cầu công bố</h3>
          ${errs.length ? `<p class="small" style="color:var(--warn)">Cần hoàn thiện trước khi gửi:</p><ul class="small muted">${errs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="small muted">Thông tin đã đầy đủ. Sau khi gửi, sự kiện chuyển sang trạng thái <b>Chờ duyệt</b> và không thể chỉnh sửa cho đến khi có kết quả.</p>'}
          <button class="btn primary" id="submit" ${errs.length ? 'disabled' : ''}>📤 Gửi kiểm duyệt</button></div>` : '<p class="muted">Lưu bản nháp để tiếp tục thiết lập loại vé.</p>'}
    </div>`;
    $('#ef').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      d.startAt = fromLocalInput(d.startAt); d.endAt = fromLocalInput(d.endAt); if (ev) d.id = ev.id;
      try { const saved = D.saveEvent(u, d); toast('Đã lưu bản nháp.'); if (isNew) go('#/org/event/' + saved.id + '/edit'); else render(); } catch (err) { toast(err.message, 'err'); }
    };
    if (!ev) return;
    const ttForm = (t) => modal(`<h3>${t ? 'Sửa' : 'Thêm'} loại vé</h3>
      <div class="field"><label>Tên loại vé <span class="req">*</span></label><input class="input" id="tN" value="${esc(t ? t.name : '')}"></div>
      <div class="grid2"><div class="field"><label>Giá bán (đ) <span class="req">*</span></label><input class="input" id="tP" type="number" min="1" value="${t ? t.price : ''}"></div>
      <div class="field"><label>Số lượng phát hành <span class="req">*</span></label><input class="input" id="tQ" type="number" min="1" value="${t ? t.quantity : ''}">${t ? `<span class="hint">Đang giữ ${t.held}, đã bán ${t.sold}</span>` : ''}</div>
      <div class="field"><label>Tối thiểu/đơn</label><input class="input" id="tMin" type="number" min="1" value="${t ? t.minPerOrder : 1}"></div>
      <div class="field"><label>Tối đa/đơn</label><input class="input" id="tMax" type="number" min="1" value="${t ? t.maxPerOrder : 10}"></div>
      <div class="field"><label>Bắt đầu bán</label><input class="input" id="tS" type="datetime-local" value="${toLocalInput(t ? t.saleStart : D.now())}"></div>
      <div class="field"><label>Kết thúc bán</label><input class="input" id="tE" type="datetime-local" value="${toLocalInput(t ? t.saleEnd : (ev.startAt ? ev.startAt - 3600000 : null))}"></div></div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn primary" id="tOk">Lưu</button></div>`,
      (bg, close) => $('#tOk', bg).onclick = () => { try { D.saveTicketType(u, ev.id, { id: t && t.id, name: $('#tN', bg).value, price: $('#tP', bg).value, quantity: $('#tQ', bg).value, minPerOrder: $('#tMin', bg).value, maxPerOrder: $('#tMax', bg).value, saleStart: fromLocalInput($('#tS', bg).value), saleEnd: fromLocalInput($('#tE', bg).value) }); close(); toast('Đã lưu loại vé.'); render(); } catch (e) { toast(e.message, 'err'); } });
    $('#addTT').onclick = () => ttForm(null);
    $$('[data-edit]').forEach(b => b.onclick = () => ttForm(D.byId('ticketTypes', b.dataset.edit)));
    $$('[data-del]').forEach(b => b.onclick = () => confirmModal('Xóa loại vé?', 'Thao tác không thể hoàn tác.', () => act(() => D.deleteTicketType(u, b.dataset.del), 'Đã xóa.'), true));
    $('#submit').onclick = () => { if (act(() => D.submitEvent(u, ev.id), 'Đã gửi yêu cầu công bố. Vui lòng chờ kiểm duyệt.') !== undefined || D.byId('events', ev.id).status === 'PENDING') go('#/org/event/' + ev.id); };
  }
  route('/org/event/new', (el, { u }) => {
    if (!u.roles.includes('ORGANIZER')) { el.innerHTML = `<div class="container"><div class="empty"><div class="ic">🏢</div><h2>Bạn chưa là Đơn vị tổ chức</h2><p class="muted">Quản trị viên cấp quyền Đơn vị tổ chức cho tài khoản (UC-13). Dùng tài khoản <b>btc@demo.vn</b> để thử.</p></div></div>`; return; }
    eventEditor(el, u, null);
  }, 'AUTH');
  route('/org/event/:id/edit', (el, { params, u }) => {
    const ev = D.byId('events', params[0]);
    if (!ev || !D.canManageEvent(u, ev)) throw new Error('Không có quyền với sự kiện này.');
    if (!['DRAFT', 'REJECTED'].includes(ev.status)) { go('#/org/event/' + ev.id); return; }
    eventEditor(el, u, ev);
  }, 'AUTH');

  // UC-24, UC-21, UC-07, UC-17 — trang quản lý sự kiện
  route('/org/event/:id', (el, { params, q, u }) => {
    const ev = D.byId('events', params[0]);
    if (!ev || !D.canManageEvent(u, ev)) throw new Error('Không có quyền với sự kiện này.');
    const tab = q.tab || 'overview';
    const s = D.eventStats(ev.id);
    const orders = D.data.orders.filter(o => o.eventId === ev.id).sort((a, b) => b.createdAt - a.createdAt);
    const reqs = D.data.refundRequests.filter(r => r.eventId === ev.id);
    const pendingRf = reqs.filter(r => r.status === 'WAIT_ORG').length;
    const T = (k, t) => `<a href="#/org/event/${ev.id}?tab=${k}" class="${tab === k ? 'on' : ''}">${t}</a>`;
    let body = '';
    if (tab === 'overview') body = `
      <div class="stats"><div class="stat"><div class="v">${s.sold}</div><div class="l">Vé đã xác nhận bán</div></div><div class="stat"><div class="v">${s.held}</div><div class="l">Vé đang tạm giữ</div></div><div class="stat"><div class="v">${money(s.revenue)}</div><div class="l">Doanh thu (đơn đã TT)</div></div><div class="stat"><div class="v">${s.checkedIn}/${s.issued}</div><div class="l">Đã check-in / vé phát hành</div></div></div>
      <div class="panel mt"><h3>Theo loại vé</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Loại vé</th><th>Giá</th><th>Phân bổ</th><th>Đã bán</th><th>Đang giữ</th><th>Khả dụng</th><th>Check-in</th></tr></thead><tbody>${s.types.map(t => `<tr><td>${esc(t.name)}</td><td>${money(t.price)}</td><td>${t.quantity}</td><td>${t.sold}</td><td>${t.held}</td><td>${t.available}</td><td>${t.checkedIn}</td></tr>`).join('')}</tbody></table></div>
      <p class="small muted">Khả dụng = Phân bổ − Đang giữ − Đã bán. Đã hoàn tiền: <b>${money(s.refunded)}</b> (theo dõi riêng).</p></div>
      ${ev.status === 'PUBLISHED' ? `<div class="panel"><h3 style="color:#f87171">Hủy sự kiện</h3><p class="small muted">Dừng bán, hủy đơn chưa thanh toán, vô hiệu hóa vé; đơn đã thanh toán được theo dõi để hoàn tiền theo chính sách.</p><button class="btn danger" id="cancelEv">Hủy sự kiện</button></div>` : ''}`;
    if (tab === 'orders') body = `<div class="panel table-wrap"><table class="tbl"><thead><tr><th>Mã đơn</th><th>Người tham dự</th><th>Chi tiết</th><th>Tổng</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>${orders.map(o => `<tr><td>${o.id}</td><td>${esc(o.attendee.name)}<div class="small muted">${esc(o.attendee.email)} · ${esc(o.attendee.phone)}</div></td><td class="small">${D.itemsOf(o.id).map(i => esc(D.byId('ticketTypes', i.ticketTypeId).name) + ' × ' + i.quantity).join('<br>')}</td><td>${money(o.total)}</td><td>${badge('order', o.status)} ${o.refundStatus === 'REFUNDED' ? '<span class="badge blue">Đã hoàn</span>' : ''}</td><td class="small">${ftime(o.createdAt)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có đơn.</td></tr>'}</tbody></table></div>`;
    if (tab === 'attendees') { const tk = D.data.tickets.filter(t => t.eventId === ev.id); body = `<div class="panel table-wrap"><table class="tbl"><thead><tr><th>Mã vé</th><th>Loại vé</th><th>Người tham dự</th><th>Trạng thái</th><th>Check-in lúc</th></tr></thead><tbody>${tk.map(t => { const o = D.byId('orders', t.orderId); return `<tr><td><code>${t.code}</code></td><td>${esc(D.byId('ticketTypes', t.ticketTypeId).name)}</td><td>${esc(o.attendee.name)}</td><td>${badge('ticket', t.status)}</td><td>${ftime(t.usedAt)}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Chưa có vé.</td></tr>'}</tbody></table></div>`; }
    if (tab === 'members') { const ms = D.data.members.filter(m => m.eventId === ev.id); body = `<div class="panel"><h3>Thêm thành viên</h3><div class="row"><input class="input grow" id="mE" placeholder="email@vd.vn" style="max-width:320px"><select class="input" id="mR" style="max-width:200px"><option value="CHECKIN">Nhân sự check-in</option><option value="QUAN_LY">Quản lý sự kiện</option></select><button class="btn primary" id="mAdd">Thêm</button></div><p class="small muted">Gợi ý: thêm <b>checkin@demo.vn</b> để cấp quyền check-in.</p></div>
      <div class="panel table-wrap"><table class="tbl"><thead><tr><th>Email</th><th>Quyền</th><th>Ngày cấp</th><th></th></tr></thead><tbody>${ms.map(m => `<tr><td>${esc(m.userEmail)}</td><td>${m.role === 'CHECKIN' ? 'Nhân sự check-in' : 'Quản lý sự kiện'}</td><td>${ftime(m.addedAt)}</td><td><button class="btn sm ghost" data-rm="${m.id}">Thu hồi</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Chưa có thành viên.</td></tr>'}</tbody></table></div>`; }
    if (tab === 'refunds') body = `<div class="panel table-wrap"><table class="tbl"><thead><tr><th>Mã</th><th>Đơn</th><th>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>${reqs.map(r => `<tr><td>${r.id}</td><td>${r.orderId}</td><td>${money(r.amount)}</td><td class="small">${esc(r.reason)}</td><td>${badge('refund', r.status)}</td><td>${r.status === 'WAIT_ORG' ? `<div class="row"><button class="btn sm primary" data-ok="${r.id}">Chấp thuận</button><button class="btn sm danger" data-no="${r.id}">Từ chối</button></div>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Không có yêu cầu hoàn vé.</td></tr>'}</tbody></table></div>`;
    el.innerHTML = `<div class="container"><div class="page-title"><div><h1>${esc(ev.title)}</h1><div class="muted small">${ftime(ev.startAt)} · ${esc(ev.venue)}</div></div><div class="row">${badge('event', ev.status)}${['DRAFT', 'REJECTED'].includes(ev.status) ? `<a class="btn sm" href="#/org/event/${ev.id}/edit">Chỉnh sửa</a>` : ''}<a class="btn sm ghost" href="#/event/${ev.id}">Xem trang sự kiện</a></div></div>
      ${ev.status === 'REJECTED' ? `<div class="panel mb" style="border:1px solid var(--danger)">❌ Lý do từ chối: ${esc(ev.reviewNote)}</div>` : ''}
      <div class="tabs">${T('overview', 'Tổng quan')}${T('orders', 'Đơn hàng')}${T('attendees', 'Người tham dự')}${T('members', 'Thành viên')}${T('refunds', 'Hoàn vé' + (pendingRf ? ` (${pendingRf})` : ''))}</div>${body}</div>`;
    const c = $('#cancelEv'); if (c) c.onclick = () => promptModal('Hủy sự kiện', 'Lý do hủy', (v) => { D.cancelEvent(u, ev.id, v); toast('Đã hủy sự kiện.'); render(); }, { danger: true, ok: 'Hủy sự kiện' });
    const ma = $('#mAdd'); if (ma) ma.onclick = () => act(() => D.addMember(u, ev.id, $('#mE').value, $('#mR').value), 'Đã thêm thành viên.');
    $$('[data-rm]').forEach(b => b.onclick = () => act(() => D.removeMember(u, b.dataset.rm), 'Đã thu hồi quyền.'));
    $$('[data-ok]').forEach(b => b.onclick = () => act(() => D.decideRefund(u, b.dataset.ok, true, ''), 'Đã chấp thuận. Yêu cầu chuyển CSKH xử lý hoàn tiền.'));
    $$('[data-no]').forEach(b => b.onclick = () => promptModal('Từ chối hoàn vé', 'Lý do từ chối', (v) => { D.decideRefund(u, b.dataset.no, false, v); toast('Đã từ chối.'); render(); }, { danger: true }));
  }, 'AUTH');

  // ============================================================ CHECK-IN (UC-05)
  route('/checkin', (el, { u }) => {
    const evs = D.checkinEventsOf(u);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Chọn sự kiện check-in</h1></div>
      ${evs.length ? `<div class="grid">${evs.map(e => `<a class="ev-card" href="#/checkin/${e.id}"><div class="cover ${e.cover}">${CAT_ICON[e.category]}</div><h3>${esc(e.title)}</h3><div class="date">📅 ${ftime(e.startAt)}</div></a>`).join('')}</div>` : '<div class="empty"><div class="ic">📋</div><p>Bạn chưa được phân công sự kiện nào.</p></div>'}</div>`;
  }, 'CHECKIN');
  route('/checkin/:id', (el, { params, u }) => {
    const ev = D.byId('events', params[0]);
    if (!ev) throw new Error('Không tìm thấy sự kiện.');
    const s = D.eventStats(ev.id);
    const logs = D.data.checkins.filter(c => c.eventId === ev.id).slice(0, 15);
    const myCodes = D.data.tickets.filter(t => t.eventId === ev.id).slice(0, 6);
    el.innerHTML = `<div class="container"><div class="page-title"><div><h1>Check-in: ${esc(ev.title)}</h1><div class="muted small">Đã check-in <b>${s.checkedIn}</b> / ${s.issued} vé</div></div><a class="btn ghost sm" href="#/checkin">‹ Đổi sự kiện</a></div>
      <div class="layout-side"><div>
        <div class="panel"><div class="row between"><h3>Quét mã QR</h3><button class="btn sm" id="cam">📷 Bật camera</button></div><div class="scan-box" id="reader"><span class="muted">Camera chưa bật</span></div></div>
        <div class="panel"><h3>Nhập mã thủ công</h3><form class="row" id="mf"><input class="input grow" id="code" placeholder="VD: TGAB12CD34" autocomplete="off" style="text-transform:uppercase"><button class="btn primary">Kiểm tra</button></form>
          <p class="small muted mt">Mã vé mẫu của sự kiện (để demo): ${myCodes.map(t => `<a href="#" data-code="${t.code}" style="color:var(--brand)"><code>${t.code}</code></a>`).join(', ') || 'chưa có'}</p></div>
      </div><div>
        <div id="result" class="scan-result" style="background:var(--surface)"><div class="big">📲</div><div>Sẵn sàng kiểm tra vé</div></div>
        <div class="panel mt"><h3>Lịch sử gần đây</h3>${logs.map(c => `<div class="summary-line small"><span><code>${esc(c.code || '—')}</code> · ${c.method === 'QR' ? 'QR' : 'Thủ công'}<br><span class="muted">${esc(c.reason)}</span></span><span>${c.result === 'OK' ? '<span class="badge green">Hợp lệ</span>' : '<span class="badge red">Từ chối</span>'}<br><span class="muted">${new Date(c.at).toLocaleTimeString('vi-VN')}</span></span></div>`).join('') || '<p class="muted small">Chưa có lượt kiểm tra.</p>'}</div>
      </div></div></div>`;
    const show = (c) => {
      const r = $('#result'); r.style.background = '';
      r.className = 'scan-result ' + (c.result === 'OK' ? 'ok' : 'bad');
      const t = c.ticketId && D.byId('tickets', c.ticketId); const o = t && D.byId('orders', t.orderId);
      r.innerHTML = `<div class="big">${c.result === 'OK' ? '✅' : '⛔'}</div><div>${c.result === 'OK' ? 'CHECK-IN THÀNH CÔNG' : 'TỪ CHỐI'}</div><div class="small" style="font-weight:400">${esc(c.reason)}</div>${t ? `<div class="small" style="font-weight:400;color:var(--text)">${esc(D.byId('ticketTypes', t.ticketTypeId).name)} · ${esc(o.attendee.name)}</div>` : ''}`;
    };
    const check = (code, method) => { const c = D.checkin(u, ev.id, code, method); render(); show(c); };
    $('#mf').onsubmit = (e) => { e.preventDefault(); check($('#code').value, 'MANUAL'); };
    $$('[data-code]').forEach(a => a.onclick = (e) => { e.preventDefault(); $('#code').value = a.dataset.code; });
    $('#cam').onclick = async () => {
      if (!window.Html5Qrcode) { toast('Không tải được thư viện quét QR. Hãy nhập mã thủ công.', 'warn'); return; }
      try {
        $('#reader').innerHTML = '';
        const sc = new window.Html5Qrcode('reader'); window.__scanner = sc; let busy = false;
        await sc.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, async (txt) => { if (busy) return; busy = true; await sc.stop().catch(() => {}); check(txt, 'QR'); });
      } catch (e) { toast('Không mở được camera: ' + (e.message || e) + '. Hãy nhập mã thủ công.', 'warn'); $('#reader').innerHTML = '<span class="muted">Camera không khả dụng</span>'; }
    };
  }, 'CHECKIN');

  // ============================================================ QUẢN TRỊ VIÊN
  route('/admin/review', (el) => {
    const list = D.data.events.filter(e => e.status === 'PENDING');
    const done = D.data.events.filter(e => e.reviewedAt).sort((a, b) => b.reviewedAt - a.reviewedAt).slice(0, 10);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Kiểm duyệt sự kiện</h1><span class="badge yellow">${list.length} chờ duyệt</span></div>
      <div class="panel table-wrap">${list.length ? `<table class="tbl"><thead><tr><th>Sự kiện</th><th>Đơn vị tổ chức</th><th>Thời gian</th><th>Gửi lúc</th><th></th></tr></thead><tbody>${list.map(e => `<tr><td><b>${esc(e.title)}</b><div class="small muted">${esc(e.category)} · ${esc(e.venue)}</div></td><td>${esc(D.byId('users', e.ownerId).name)}</td><td>${ftime(e.startAt)}</td><td>${ftime(e.submittedAt || e.createdAt)}</td><td><a class="btn sm primary" href="#/admin/review/${e.id}">Xem xét</a></td></tr>`).join('')}</tbody></table>` : '<div class="empty"><div class="ic">✅</div><p>Không có sự kiện chờ duyệt.</p></div>'}</div>
      <div class="panel"><h3>Đã xử lý gần đây</h3>${done.map(e => `<div class="summary-line"><span>${esc(e.title)}</span><span>${badge('event', e.status)}</span></div>`).join('') || '<p class="muted small">Chưa có.</p>'}</div></div>`;
  }, 'ADMIN');
  route('/admin/review/:id', (el, { params, u }) => {
    const e = D.byId('events', params[0]); if (!e) throw new Error('Không tìm thấy sự kiện.');
    const types = D.typesOf(e.id); const errs = D.validateEventForSubmit(e);
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Kiểm duyệt: ${esc(e.title)}</h1>${badge('event', e.status)}</div>
      <div class="layout-side"><div class="panel">
        <div class="cover ${e.cover}" style="aspect-ratio:16/6;border-radius:10px">${CAT_ICON[e.category]}</div>
        <table class="tbl mt"><tbody>
          <tr><th>Đơn vị tổ chức</th><td>${esc(D.byId('users', e.ownerId).name)}</td></tr><tr><th>Thể loại</th><td>${esc(e.category)}</td></tr>
          <tr><th>Thời gian</th><td>${ftime(e.startAt)} → ${ftime(e.endAt)}</td></tr><tr><th>Địa điểm</th><td>${esc(e.venue)} – ${esc(e.address)}</td></tr>
          <tr><th>Mô tả</th><td style="white-space:pre-line">${esc(e.description)}</td></tr><tr><th>Chính sách hoàn</th><td>${esc(e.refundPolicy)}</td></tr></tbody></table>
        <h3 class="mt">Loại vé</h3><table class="tbl"><thead><tr><th>Tên</th><th>Giá</th><th>SL</th><th>Giới hạn</th><th>Bán</th></tr></thead><tbody>${types.map(t => `<tr><td>${esc(t.name)}</td><td>${money(t.price)}</td><td>${t.quantity}</td><td>${t.minPerOrder}–${t.maxPerOrder}</td><td class="small">${ftime(t.saleStart)} → ${ftime(t.saleEnd)}</td></tr>`).join('')}</tbody></table>
      </div><div class="panel"><h3>Quyết định</h3>
        <p class="small">Kiểm tra tự động: ${errs.length ? `<span style="color:var(--warn)">${errs.length} vấn đề</span><ul class="small muted">${errs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<span class="badge green">Đầy đủ</span>'}</p>
        ${e.status === 'PENDING' ? `<div class="field"><label>Ghi chú / lý do từ chối</label><textarea class="input" id="note" rows="3"></textarea><span class="hint">Bắt buộc khi từ chối</span></div><div class="row"><button class="btn primary" id="ok">✔ Chấp thuận & công bố</button><button class="btn danger" id="no">✖ Từ chối</button></div>` : `<p class="muted">Sự kiện không ở trạng thái chờ duyệt.</p>`}
      </div></div></div>`;
    const ok = $('#ok'); if (ok) { ok.onclick = () => { if (act(() => D.reviewEvent(u, e.id, true, $('#note').value), 'Đã duyệt và công bố sự kiện.') !== undefined || e.status === 'PUBLISHED') go('#/admin/review'); }; $('#no').onclick = () => { act(() => D.reviewEvent(u, e.id, false, $('#note').value), 'Đã từ chối và thông báo cho đơn vị tổ chức.'); if (e.status === 'REJECTED') go('#/admin/review'); }; }
  }, 'ADMIN');

  route('/admin/users', (el, { u }) => {
    const ROLES = ['CUSTOMER', 'ORGANIZER', 'ADMIN', 'CSKH'];
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Tài khoản & phân quyền</h1></div>
      <div class="panel table-wrap"><table class="tbl"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${D.data.users.map(x => `<tr><td><b>${esc(x.name)}</b><div class="small muted">${esc(x.email)}</div></td><td>${ROLES.map(r => `<label class="small" style="margin-right:10px;white-space:nowrap"><input type="checkbox" data-u="${x.id}" value="${r}" ${x.roles.includes(r) ? 'checked' : ''}> ${ROLE_NAME[r]}</label>`).join('')}</td><td>${badge('user', x.status)}</td><td class="row"><button class="btn sm" data-save="${x.id}">Lưu quyền</button><button class="btn sm ${x.status === 'KHOA' ? 'primary' : 'danger'}" data-lock="${x.id}">${x.status === 'KHOA' ? 'Mở khóa' : 'Khóa'}</button></td></tr>`).join('')}
      </tbody></table></div><p class="small muted">Quyền <b>Nhân sự check-in</b> được đơn vị tổ chức cấp theo từng sự kiện (tab Thành viên).</p></div>`;
    $$('[data-save]').forEach(b => b.onclick = () => { const id = b.dataset.save; const roles = $$(`input[data-u="${id}"]:checked`).map(i => i.value); act(() => D.adminSetUser(u.id, id, { roles }), 'Đã cập nhật quyền.'); });
    $$('[data-lock]').forEach(b => b.onclick = () => { const x = D.byId('users', b.dataset.lock); act(() => D.adminSetUser(u.id, x.id, { status: x.status === 'KHOA' ? 'HOAT_DONG' : 'KHOA' }), 'Đã cập nhật trạng thái.'); });
  }, 'ADMIN');

  // UC-23 Xác minh lỗi cung cấp vé
  route('/admin/ticket-errors', (el, { u }) => {
    const errOrders = D.data.orders.filter(o => o.status === 'PAID' && o.issueStatus === 'ERROR');
    const reqs = D.data.refundRequests.filter(r => r.status === 'WAIT_ADMIN');
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Xác minh lỗi cung cấp vé</h1></div>
      <div class="panel"><h3>Đơn đã thanh toán nhưng chưa phát hành đủ vé</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Đơn</th><th>Sự kiện</th><th>Khách</th><th>Đã thanh toán</th><th></th></tr></thead><tbody>
      ${errOrders.map(o => `<tr><td>${o.id}</td><td>${esc(D.byId('events', o.eventId).title)}</td><td>${esc(o.attendee.name)}</td><td>${money(o.total)}</td><td><button class="btn sm primary" data-retry="${o.id}">Phát hành lại vé</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Không có.</td></tr>'}</tbody></table></div>
      <p class="small muted">Lỗi phát hành tạm thời không tự động dẫn đến hoàn tiền. Nếu không thể cung cấp vé, xác nhận căn cứ hoàn tiền ở bảng dưới (khi khách gửi yêu cầu).</p></div>
      <div class="panel"><h3>Yêu cầu hoàn tiền do lỗi cung cấp vé</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Mã</th><th>Đơn</th><th>Số tiền</th><th>Lý do</th><th></th></tr></thead><tbody>
      ${reqs.map(r => `<tr><td>${r.id}</td><td>${r.orderId}</td><td>${money(r.amount)}</td><td class="small">${esc(r.reason)}</td><td class="row"><button class="btn sm primary" data-ok="${r.id}">Xác nhận căn cứ hoàn</button><button class="btn sm danger" data-no="${r.id}">Không đủ căn cứ</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Không có.</td></tr>'}</tbody></table></div></div></div>`;
    $$('[data-retry]').forEach(b => b.onclick = () => act(() => D.adminRetryIssue(u, b.dataset.retry), 'Đã phát hành lại vé.'));
    $$('[data-ok]').forEach(b => b.onclick = () => act(() => D.decideRefund(u, b.dataset.ok, true, 'QTV xác minh không thể cung cấp vé'), 'Đã xác nhận căn cứ hoàn tiền.'));
    $$('[data-no]').forEach(b => b.onclick = () => promptModal('Không đủ căn cứ hoàn', 'Lý do', (v) => { D.decideRefund(u, b.dataset.no, false, v); toast('Đã cập nhật.'); render(); }, { danger: true }));
  }, 'ADMIN');

  route('/admin/audit', (el) => {
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Nhật ký thao tác</h1><span class="muted small">YC-PCN-08 – Khả năng truy vết</span></div>
      <div class="panel table-wrap"><table class="tbl"><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>
      ${D.data.audit.slice(0, 200).map(a => `<tr><td class="small">${ftime(a.at)}</td><td>${esc((D.byId('users', a.actorId) || {}).email || a.actorId)}</td><td><code>${a.action}</code></td><td>${esc(a.target)}</td><td class="small muted">${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có.</td></tr>'}</tbody></table></div></div>`;
  }, 'ADMIN');

  // ============================================================ CSKH
  route('/cs/support', (el) => {
    const list = D.data.supports;
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Yêu cầu hỗ trợ</h1></div>
      <div class="panel table-wrap"><table class="tbl"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Tiêu đề</th><th>Đơn</th><th>Ngày</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${list.map(s => `<tr><td>${s.id}</td><td>${esc(D.byId('users', s.userId).name)}</td><td>${esc(s.subject)}</td><td>${s.orderId}</td><td class="small">${ftime(s.createdAt)}</td><td>${badge('support', s.status)}</td><td><a class="btn sm primary" href="#/cs/support/${s.id}">Xử lý</a></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Không có yêu cầu.</td></tr>'}</tbody></table></div></div>`;
  }, 'CSKH');
  route('/cs/support/:id', (el, { params, u }) => { const s = D.byId('supports', params[0]); if (!s) throw new Error('Không tìm thấy yêu cầu.'); supportThread(el, s, u, true); }, 'CSKH');
  route('/cs/refunds', (el, { u }) => {
    const reqs = D.data.refundRequests;
    el.innerHTML = `<div class="container"><div class="page-title"><h1>Hoàn vé / hoàn tiền</h1></div>
      <div class="panel table-wrap"><table class="tbl"><thead><tr><th>Mã</th><th>Đơn / Sự kiện</th><th>Nguồn</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      ${reqs.map(r => `<tr><td>${r.id}</td><td>${r.orderId}<div class="small muted">${esc(D.byId('events', r.eventId).title)}</div></td><td class="small">${r.source === 'ISSUE_ERROR' ? 'Lỗi cung cấp vé' : 'Chính sách sự kiện'}</td><td>${money(r.amount)}</td><td>${badge('refund', r.status)}</td><td class="row">
        ${r.status === 'WAIT_CS' ? `<button class="btn sm primary" data-fw="${r.id}">Kiểm tra & chuyển ${r.source === 'ISSUE_ERROR' ? 'QTV' : 'BTC'}</button>` : ''}
        ${['APPROVED', 'PROCESSING'].includes(r.status) ? `<button class="btn sm primary" data-pay="${r.id}" data-o="SUCCESS">Hoàn tiền: thành công</button><button class="btn sm danger" data-pay="${r.id}" data-o="FAILED">Mô phỏng thất bại</button>` : ''}
        <button class="btn sm ghost" data-h="${r.id}">Lịch sử</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Không có yêu cầu.</td></tr>'}</tbody></table></div>
      <div class="panel"><h3>Giao dịch hoàn tiền</h3>${D.data.refunds.map(x => `<div class="summary-line small"><span>${x.id} · ${x.orderId} · ${ftime(x.at)}</span><span>${money(x.amount)} ${x.status === 'SUCCESS' ? '<span class="badge green">Thành công</span>' : '<span class="badge red">Thất bại</span>'}</span></div>`).join('') || '<p class="muted small">Chưa có.</p>'}</div></div>`;
    $$('[data-fw]').forEach(b => b.onclick = () => act(() => D.csForwardRefund(u, b.dataset.fw, ''), 'Đã chuyển xử lý.'));
    $$('[data-pay]').forEach(b => b.onclick = () => { const rf = act(() => D.processRefund(u, b.dataset.pay, b.dataset.o)); if (rf) toast(rf.status === 'SUCCESS' ? 'Hoàn tiền thành công. Vé đã vô hiệu hóa.' : 'Giao dịch hoàn tiền thất bại – tiếp tục theo dõi.', rf.status === 'SUCCESS' ? '' : 'warn'); });
    $$('[data-h]').forEach(b => b.onclick = () => { const r = D.byId('refundRequests', b.dataset.h); modal(`<h3>Lịch sử ${r.id}</h3><div class="timeline">${r.history.map(h => `<div class="it">${esc(h.text)}<div class="small muted">${ftime(h.at)} · ${esc((D.byId('users', h.by) || {}).email || '')}</div></div>`).join('')}</div><div class="right"><button class="btn" data-close>Đóng</button></div>`); });
  }, 'CSKH');

  // ============================================================ HƯỚNG DẪN DEMO
  route('/guide', (el) => {
    el.innerHTML = `<div class="container"><div class="page-title"><h1>📘 Hướng dẫn chạy demo</h1></div>
      <div class="content-box">
      <p>Bản demo mô phỏng hệ thống đề xuất trong đồ án. Dữ liệu lưu trên trình duyệt (localStorage). Thanh toán, email và hoàn tiền được mô phỏng. Mật khẩu mọi tài khoản demo: <b>123456</b>.</p>
      <table class="tbl" style="color:#18181b"><thead><tr><th style="color:#52525b">Tài khoản</th><th style="color:#52525b">Vai trò</th><th style="color:#52525b">Use Case chính</th></tr></thead><tbody>
      <tr><td>khach@demo.vn</td><td>Khách hàng</td><td>UC-03, 04, 18, 19, 20, 06, 22</td></tr>
      <tr><td>btc@demo.vn</td><td>Đơn vị tổ chức</td><td>UC-01, 15, 16, 17, 21, 07, 24</td></tr>
      <tr><td>admin@demo.vn</td><td>Quản trị viên</td><td>UC-02, 13, 23</td></tr>
      <tr><td>cskh@demo.vn</td><td>Nhân viên CSKH</td><td>UC-06, 08</td></tr>
      <tr><td>checkin@demo.vn</td><td>Nhân sự check-in</td><td>UC-05</td></tr></tbody></table>
      <h3 class="mt">Kịch bản nhanh</h3><ol>
        <li><b>Công bố sự kiện:</b> btc@demo.vn → Tạo sự kiện → Lưu nháp → Thêm loại vé → Gửi kiểm duyệt → admin@demo.vn → Kiểm duyệt → Chấp thuận/Từ chối.</li>
        <li><b>Đặt vé & thanh toán:</b> khach@demo.vn → “Đêm nhạc Mùa Thu Hà Nội” → Mua vé → chọn số lượng → Xác nhận → thử “thất bại” rồi “thành công” → xem vé QR.</li>
        <li><b>Hết hạn đơn:</b> tạo đơn rồi dùng ⚙ Công cụ demo → “Tua thời gian +16 phút”.</li>
        <li><b>Check-in:</b> checkin@demo.vn → “Đêm nhạc Jazz Hôm Nay” → nhập/quét mã vé → quét lại lần 2 để thấy bị từ chối.</li>
        <li><b>Hoàn vé:</b> khách gửi yêu cầu → CSKH chuyển BTC → BTC chấp thuận → CSKH hoàn tiền → vé bị vô hiệu.</li>
        <li><b>Lỗi cung cấp vé:</b> đơn “Kịch nói” của khách → admin “Lỗi cung cấp vé” → Phát hành lại.</li></ol>
      <p>Kịch bản chi tiết có giải thích: xem <code>docs/KICH_BAN_DEMO.md</code> trong repo.</p></div></div>`;
  });

  // ------------------------------------------------------------ công cụ demo
  $('#demoFab').onclick = () => modal(`<h3>⚙ Công cụ demo</h3>
    <p class="small muted">Đồng hồ hệ thống: <b>${ftime(D.now())}</b>${D.clockOffset() ? ` (đã tua +${Math.round(D.clockOffset() / 60000)} phút)` : ''}</p>
    <div class="row"><button class="btn warn" id="t16">⏩ Tua thời gian +16 phút</button><button class="btn" id="t0">⏪ Đặt lại đồng hồ</button></div>
    <p class="small muted mt">Tua thời gian giúp minh họa đơn chờ thanh toán bị hết hạn và giải phóng vé tạm giữ.</p>
    <hr style="border-color:var(--line)"><button class="btn danger" id="rs">♻ Khôi phục dữ liệu mẫu</button>
    <div class="right mt"><button class="btn ghost" data-close>Đóng</button></div>`, (bg, close) => {
    $('#t16', bg).onclick = () => { D.advanceClock(16); close(); toast('Đã tua đồng hồ thêm 16 phút.'); render(); };
    $('#t0', bg).onclick = () => { try { localStorage.removeItem('tg_clock_offset'); } catch (e) {} close(); render(); };
    $('#rs', bg).onclick = () => { D.reset(); memSession = null; close(); toast('Đã khôi phục dữ liệu mẫu.'); go('#/'); render(); };
  });

  $('#searchForm').onsubmit = (e) => { e.preventDefault(); go('#/search?q=' + encodeURIComponent($('#searchInput').value.trim())); };
  window.addEventListener('hashchange', () => { if (window.__scanner) { window.__scanner.stop().catch(() => {}); window.__scanner = null; } render(); window.scrollTo(0, 0); });
  window.addEventListener('storage', () => render());
  render();
})();
