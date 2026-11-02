/* =========================================================================
 * db.js — Lớp dữ liệu & nghiệp vụ (mô phỏng backend) cho bản demo
 * Dữ liệu lưu trong localStorage. Mỗi hàm nghiệp vụ kiểm tra đúng các
 * quy ước tại mục 2.2.2 và đặc tả Use Case ở Chương 3 của đồ án.
 * ========================================================================= */
(function () {
  'use strict';

  const KEY = 'tg_db_v1';
  const CLOCK_KEY = 'tg_clock_offset';
  const HOLD_MINUTES = 15; // Thời hạn thanh toán / tạm giữ vé (cấu hình)

  // ---------------------------------------------------------------- tiện ích
  const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const ticketCode = () => 'TG' + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();

  // Đồng hồ hệ thống có thể "tua" để minh họa đơn hết hạn
  function clockOffset() { try { return Number(localStorage.getItem(CLOCK_KEY)) || 0; } catch (e) { return 0; } }
  function now() { return Date.now() + clockOffset(); }
  function advanceClock(minutes) {
    try { localStorage.setItem(CLOCK_KEY, String(clockOffset() + minutes * 60000)); } catch (e) {}
  }

  // Băm mật khẩu (không lưu dạng văn bản thuần — YC-PCN-04). Dùng FNV-1a + salt cho demo.
  function hash(pw, salt) {
    let h = 0x811c9dc5; const s = salt + ':' + pw;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    for (let r = 0; r < 500; r++) { h ^= (h >>> 13); h = Math.imul(h, 0x5bd1e995) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  class BizError extends Error { constructor(msg) { super(msg); this.biz = true; } }
  const fail = (m) => { throw new BizError(m); };

  // ------------------------------------------------------------ dữ liệu mẫu
  function seed() {
    const t = Date.now();
    const day = 86400000;
    const users = [
      { id: 'U-ADMIN', email: 'admin@demo.vn', name: 'Quản trị viên', phone: '0900000001', roles: ['ADMIN'], status: 'HOAT_DONG' },
      { id: 'U-CSKH', email: 'cskh@demo.vn', name: 'Nguyễn Thị CSKH', phone: '0900000002', roles: ['CSKH'], status: 'HOAT_DONG' },
      { id: 'U-BTC', email: 'btc@demo.vn', name: 'Công ty Sự kiện Ánh Dương', phone: '0900000003', roles: ['ORGANIZER', 'CUSTOMER'], status: 'HOAT_DONG' },
      { id: 'U-BTC2', email: 'btc2@demo.vn', name: 'CLB Thể thao Sông Hàn', phone: '0900000006', roles: ['ORGANIZER', 'CUSTOMER'], status: 'HOAT_DONG' },
      { id: 'U-CHECKIN', email: 'checkin@demo.vn', name: 'Trần Văn Check-in', phone: '0900000004', roles: ['CUSTOMER'], status: 'HOAT_DONG' },
      { id: 'U-KHACH', email: 'khach@demo.vn', name: 'Lê Minh Khách', phone: '0900000005', roles: ['CUSTOMER'], status: 'HOAT_DONG' },
    ];
    users.forEach(u => { u.salt = u.id; u.pw = hash('123456', u.salt); u.createdAt = t - 30 * day; });

    const mkEvent = (id, o) => Object.assign({
      id, ownerId: 'U-BTC', status: 'PUBLISHED', createdAt: t - 20 * day, reviewNote: '',
      refundPolicy: 'Hoàn vé toàn bộ đơn trước ngày diễn ra 3 ngày, chưa check-in.',
    }, o);
    const events = [
      mkEvent('EV-001', { title: 'Đêm nhạc Mùa Thu Hà Nội', category: 'Nhạc sống', venue: 'Nhà hát Lớn Hà Nội', address: '1 Tràng Tiền, Hoàn Kiếm, Hà Nội', startAt: t + 12 * day, endAt: t + 12 * day + 3 * 3600000, cover: 'g1', description: 'Đêm nhạc acoustic với những ca khúc kinh điển về mùa thu Hà Nội. Chương trình gồm 3 phần với sự tham gia của dàn nhạc giao hưởng.' }),
      mkEvent('EV-002', { title: 'Hội thảo Công nghệ Web 2026', category: 'Hội thảo', venue: 'Trung tâm Hội nghị Quốc gia', address: 'Đại lộ Thăng Long, Hà Nội', startAt: t + 20 * day, endAt: t + 20 * day + 8 * 3600000, cover: 'g2', description: 'Hội thảo chia sẻ xu hướng phát triển web, kiến trúc hệ thống và trải nghiệm người dùng.' }),
      mkEvent('EV-003', { title: 'Giải chạy Sông Hàn Marathon', ownerId: 'U-BTC2', category: 'Thể thao', venue: 'Cầu Rồng', address: 'Sơn Trà, Đà Nẵng', startAt: t + 35 * day, endAt: t + 35 * day + 6 * 3600000, cover: 'g3', description: 'Giải chạy cộng đồng với các cự ly 5km, 10km và 21km dọc bờ sông Hàn.' }),
      mkEvent('EV-004', { title: 'Kịch nói: Chuyến tàu cuối', category: 'Sân khấu', venue: 'Sân khấu Kịch Sài Gòn', address: 'Quận 1, TP. Hồ Chí Minh', startAt: t + 2 * day, endAt: t + 2 * day + 2 * 3600000, cover: 'g4', description: 'Vở kịch về những con người gặp nhau trên chuyến tàu đêm cuối cùng của năm.' }),
      mkEvent('EV-005', { title: 'Lễ hội Ẩm thực Đường phố', category: 'Khác', venue: 'Công viên 23/9', address: 'Quận 1, TP. Hồ Chí Minh', startAt: t + 45 * day, endAt: t + 47 * day, cover: 'g5', description: 'Hơn 100 gian hàng ẩm thực ba miền cùng các tiết mục biểu diễn đường phố.' }),
      mkEvent('EV-006', { title: 'Workshop Nhiếp ảnh Đường phố', category: 'Hội thảo', venue: 'The Hub Coworking', address: 'Cầu Giấy, Hà Nội', startAt: t + 15 * day, endAt: t + 15 * day + 4 * 3600000, cover: 'g6', status: 'PENDING', description: 'Buổi workshop thực hành chụp ảnh đường phố cho người mới bắt đầu.' }),
      mkEvent('EV-007', { title: 'Live show Indie Rock', category: 'Nhạc sống', venue: 'Hầm Rượu Club', address: 'Ba Đình, Hà Nội', startAt: t + 25 * day, endAt: t + 25 * day + 3 * 3600000, cover: 'g7', status: 'DRAFT', description: 'Đêm nhạc rock của các ban nhạc indie.' }),
      // Sự kiện đang diễn ra hôm nay để demo check-in
      mkEvent('EV-008', { title: 'Đêm nhạc Jazz Hôm Nay', category: 'Nhạc sống', venue: 'Jazz Club Nhà Hát', address: 'Hoàn Kiếm, Hà Nội', startAt: t + 2 * 3600000, endAt: t + 5 * 3600000, cover: 'g8', description: 'Đêm nhạc jazz diễn ra tối nay – dùng để minh họa check-in.' }),
    ];

    const mkType = (id, eventId, name, price, qty, min = 1, max = 10, saleStart = t - 10 * day, saleEnd = null) => ({
      id, eventId, name, price, quantity: qty, minPerOrder: min, maxPerOrder: max,
      saleStart, saleEnd: saleEnd || (events.find(e => e.id === eventId).startAt - 3600000), held: 0, sold: 0,
    });
    const ticketTypes = [
      mkType('TT-001A', 'EV-001', 'Vé Thường', 350000, 200),
      mkType('TT-001B', 'EV-001', 'Vé VIP', 800000, 50, 1, 4),
      mkType('TT-001C', 'EV-001', 'Vé VVIP (gần hết)', 1500000, 3, 1, 2),
      mkType('TT-002A', 'EV-002', 'Vé Tiêu chuẩn', 500000, 300),
      mkType('TT-002B', 'EV-002', 'Vé Sinh viên', 200000, 100, 1, 2),
      mkType('TT-003A', 'EV-003', 'Cự ly 5km', 250000, 500),
      mkType('TT-003B', 'EV-003', 'Cự ly 21km', 600000, 300, 1, 1),
      mkType('TT-004A', 'EV-004', 'Ghế thường', 300000, 120),
      mkType('TT-004B', 'EV-004', 'Ghế hạng nhất', 550000, 40),
      mkType('TT-005A', 'EV-005', 'Vé vào cổng', 100000, 2000, 1, 10, t + 5 * day), // chưa mở bán
      mkType('TT-006A', 'EV-006', 'Vé Workshop', 450000, 30),
      mkType('TT-007A', 'EV-007', 'Vé Đứng', 250000, 150),
      mkType('TT-008A', 'EV-008', 'Vé Jazz', 400000, 80),
    ];

    const db = {
      users, events, ticketTypes,
      members: [
        { id: 'M-1', eventId: 'EV-008', userEmail: 'checkin@demo.vn', role: 'CHECKIN', addedAt: t - day },
        { id: 'M-2', eventId: 'EV-001', userEmail: 'checkin@demo.vn', role: 'CHECKIN', addedAt: t - day },
      ],
      orders: [], orderItems: [], payments: [], tickets: [], checkins: [],
      supports: [], refundRequests: [], refunds: [], notifications: [], audit: [],
    };

    // Tạo sẵn một số đơn đã thanh toán (dữ liệu lịch sử)
    const pre = (userId, eventId, items, attendee, extra = {}) => {
      const o = { id: uid('DH'), userId, eventId, status: 'PAID', issueStatus: 'ISSUED', total: 0, createdAt: t - 3 * day, expiresAt: t - 3 * day + HOLD_MINUTES * 60000, paidAt: t - 3 * day + 60000, attendee };
      Object.assign(o, extra);
      db.orders.push(o);
      items.forEach(([typeId, q]) => {
        const tt = ticketTypes.find(x => x.id === typeId);
        db.orderItems.push({ id: uid('CT'), orderId: o.id, ticketTypeId: typeId, quantity: q, unitPrice: tt.price });
        o.total += q * tt.price; tt.sold += q;
        for (let i = 0; i < q; i++) db.tickets.push({ id: uid('VE'), code: ticketCode(), orderId: o.id, ticketTypeId: typeId, eventId, status: 'VALID', issuedAt: o.paidAt });
      });
      db.payments.push({ id: uid('TT'), orderId: o.id, amount: o.total, result: 'SUCCESS', method: 'Ví điện tử (mô phỏng)', ref: 'GD' + Math.floor(Math.random() * 1e8), createdAt: o.paidAt });
      return o;
    };
    pre('U-KHACH', 'EV-008', [['TT-008A', 2]], { name: 'Lê Minh Khách', email: 'khach@demo.vn', phone: '0900000005' });
    pre('U-KHACH', 'EV-001', [['TT-001A', 2], ['TT-001B', 1]], { name: 'Lê Minh Khách', email: 'khach@demo.vn', phone: '0900000005' });
    // Đơn đã thanh toán nhưng lỗi phát hành vé (để demo UC-23)
    const err = pre('U-KHACH', 'EV-004', [], { name: 'Lê Minh Khách', email: 'khach@demo.vn', phone: '0900000005' }, { issueStatus: 'ERROR' });
    const tt4 = ticketTypes.find(x => x.id === 'TT-004A');
    db.orderItems.push({ id: uid('CT'), orderId: err.id, ticketTypeId: 'TT-004A', quantity: 2, unitPrice: tt4.price });
    err.total = 2 * tt4.price; tt4.sold += 2; db.payments[db.payments.length - 1].amount = err.total;
    db.supports.push({ id: 'HT-0001', userId: 'U-KHACH', orderId: err.id, ticketId: null, category: 'NHAN_VE', subject: 'Đã thanh toán nhưng chưa nhận được vé', content: 'Tôi đã thanh toán thành công đơn hàng nhưng không thấy vé trong tài khoản.', status: 'NEW', assignee: null, createdAt: t - 2 * day, messages: [] });

    // Một số người mua khác để thống kê có số liệu
    const others = ['Phạm An', 'Hoàng Bình', 'Võ Chi', 'Đặng Dũng', 'Bùi Hà'];
    others.forEach((n, i) => pre('U-BTC', i % 2 ? 'EV-001' : 'EV-008', [[i % 2 ? 'TT-001A' : 'TT-008A', 1 + (i % 3)]], { name: n, email: 'nguoi' + i + '@mail.vn', phone: '09111111' + i }));

    db.notifications.push({ id: uid('TB'), userId: 'U-BTC', text: 'Sự kiện "Workshop Nhiếp ảnh Đường phố" đã được gửi kiểm duyệt.', createdAt: t - day, read: false });
    return db;
  }

  // ---------------------------------------------------------- lưu trữ
  let db;
  function load() {
    try { const raw = localStorage.getItem(KEY); db = raw ? JSON.parse(raw) : null; } catch (e) { db = null; }
    if (!db) { db = seed(); save(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* bỏ qua khi bị chặn storage */ } }
  function reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(CLOCK_KEY); localStorage.removeItem('tg_session'); } catch (e) {} db = seed(); save(); }

  function audit(actorId, action, target, detail) {
    db.audit.unshift({ id: uid('LS'), actorId, action, target, detail: detail || '', at: now() });
  }
  function notify(userId, text, link) {
    if (!userId) return;
    db.notifications.unshift({ id: uid('TB'), userId, text, link: link || '', createdAt: now(), read: false });
  }

  // ---------------------------------------------------------- truy vấn chung
  const byId = (col, id) => db[col].find(x => x.id === id);
  const userByEmail = (email) => db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
  const typesOf = (eventId) => db.ticketTypes.filter(t => t.eventId === eventId);
  const itemsOf = (orderId) => db.orderItems.filter(i => i.orderId === orderId);
  const ticketsOf = (orderId) => db.tickets.filter(t => t.orderId === orderId);
  const available = (tt) => tt.quantity - tt.held - tt.sold; // quy ước 2.2.2

  function eventMinPrice(eventId) {
    const ps = typesOf(eventId).map(t => t.price);
    return ps.length ? Math.min(...ps) : 0;
  }
  function saleState(tt) {
    const n = now();
    if (n < tt.saleStart) return 'NOT_STARTED';
    if (n > tt.saleEnd) return 'ENDED';
    if (available(tt) <= 0) return 'SOLD_OUT';
    return 'ON_SALE';
  }

  // ---------------------------------------------------------- tài khoản (UC-09..13)
  function register({ name, email, phone, password, confirm }) {
    if (!name || name.trim().length < 2) fail('Họ tên phải có ít nhất 2 ký tự.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) fail('Email không đúng định dạng.');
    if (!/^0\d{9}$/.test(phone || '')) fail('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
    if (!password || password.length < 6) fail('Mật khẩu phải có ít nhất 6 ký tự.');
    if (password !== confirm) fail('Mật khẩu xác nhận không khớp.');
    if (userByEmail(email)) fail('Email đã được sử dụng.'); // QTN / quy ước email duy nhất
    const u = { id: uid('U'), email: email.trim().toLowerCase(), name: name.trim(), phone, roles: ['CUSTOMER'], status: 'HOAT_DONG', createdAt: now() };
    u.salt = u.id; u.pw = hash(password, u.salt);
    db.users.push(u); audit(u.id, 'DANG_KY', u.id); save();
    return u;
  }
  function login(email, password) {
    const u = userByEmail(email);
    if (!u || u.pw !== hash(password, u.salt)) fail('Email hoặc mật khẩu không đúng.');
    if (u.status === 'KHOA') fail('Tài khoản đã bị khóa. Vui lòng liên hệ CSKH.');
    audit(u.id, 'DANG_NHAP', u.id); save();
    return u;
  }
  function updateProfile(userId, { name, phone, password }) {
    const u = byId('users', userId);
    if (!name || name.trim().length < 2) fail('Họ tên phải có ít nhất 2 ký tự.');
    if (!/^0\d{9}$/.test(phone || '')) fail('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
    u.name = name.trim(); u.phone = phone;
    if (password) { if (password.length < 6) fail('Mật khẩu mới phải có ít nhất 6 ký tự.'); u.pw = hash(password, u.salt); }
    save(); return u;
  }
  function adminSetUser(adminId, userId, { status, roles }) {
    const u = byId('users', userId);
    if (u.id === adminId && status === 'KHOA') fail('Không thể tự khóa tài khoản đang đăng nhập.');
    if (status) u.status = status;
    if (roles) { if (!roles.length) fail('Tài khoản phải có ít nhất một vai trò.'); u.roles = roles; }
    audit(adminId, 'CAP_NHAT_TAI_KHOAN', u.id, JSON.stringify({ status: u.status, roles: u.roles }));
    notify(u.id, 'Quyền/trạng thái tài khoản của bạn đã được cập nhật.');
    save();
  }

  // ---------------------------------------------------------- phân quyền theo sự kiện
  function canManageEvent(user, ev) {
    if (!user || !ev) return false;
    if (ev.ownerId === user.id) return true;
    return db.members.some(m => m.eventId === ev.id && m.userEmail === user.email && m.role === 'QUAN_LY');
  }
  function checkinEventsOf(user) {
    if (!user) return [];
    const ids = new Set(db.members.filter(m => m.userEmail === user.email && m.role === 'CHECKIN').map(m => m.eventId));
    db.events.filter(e => canManageEvent(user, e)).forEach(e => ids.add(e.id));
    return db.events.filter(e => ids.has(e.id) && e.status === 'PUBLISHED');
  }

  // ---------------------------------------------------------- sự kiện (UC-01, 15, 16, 17)
  function validateEventForSubmit(ev) {
    const errs = [];
    if (!ev.title || ev.title.trim().length < 5) errs.push('Tên sự kiện tối thiểu 5 ký tự.');
    if (!ev.category) errs.push('Chưa chọn thể loại.');
    if (!ev.venue || !ev.address) errs.push('Thiếu địa điểm hoặc địa chỉ.');
    if (!ev.description || ev.description.trim().length < 20) errs.push('Mô tả tối thiểu 20 ký tự.');
    if (!ev.startAt || !ev.endAt || ev.endAt <= ev.startAt) errs.push('Thời gian kết thúc phải sau thời gian bắt đầu.');
    if (ev.startAt && ev.startAt <= now()) errs.push('Thời gian bắt đầu phải ở tương lai.');
    const types = typesOf(ev.id);
    if (!types.length) errs.push('Cần ít nhất một loại vé.');
    types.forEach(t => {
      if (t.saleEnd > ev.startAt) errs.push(`Loại vé "${t.name}": thời gian kết thúc bán phải trước khi sự kiện bắt đầu.`);
    });
    return errs;
  }
  function saveEvent(user, data) {
    let ev = data.id ? byId('events', data.id) : null;
    if (ev) {
      if (!canManageEvent(user, ev)) fail('Bạn không có quyền với sự kiện này.');
      if (!['DRAFT', 'REJECTED'].includes(ev.status)) fail('Chỉ chỉnh sửa nội dung khi sự kiện ở trạng thái Bản nháp hoặc Bị từ chối.');
    } else {
      ev = { id: uid('EV'), ownerId: user.id, status: 'DRAFT', createdAt: now(), reviewNote: '', cover: 'g' + (1 + Math.floor(Math.random() * 8)) };
      db.events.push(ev);
    }
    ['title', 'category', 'venue', 'address', 'description', 'refundPolicy', 'startAt', 'endAt'].forEach(k => { if (data[k] !== undefined) ev[k] = data[k]; });
    if (!ev.title) fail('Cần nhập tên sự kiện để lưu bản nháp.');
    audit(user.id, 'LUU_SU_KIEN', ev.id); save();
    return ev;
  }
  function submitEvent(user, eventId) {
    const ev = byId('events', eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền với sự kiện này.');
    if (!['DRAFT', 'REJECTED'].includes(ev.status)) fail('Sự kiện không ở trạng thái có thể gửi duyệt.');
    const errs = validateEventForSubmit(ev);
    if (errs.length) fail('Chưa thể gửi duyệt:\n• ' + errs.join('\n• '));
    ev.status = 'PENDING'; ev.submittedAt = now();
    audit(user.id, 'GUI_DUYET', ev.id);
    db.users.filter(u => u.roles.includes('ADMIN')).forEach(a => notify(a.id, `Có yêu cầu công bố mới: "${ev.title}".`, '#/admin/review/' + ev.id));
    notify(ev.ownerId, `Đã gửi yêu cầu công bố sự kiện "${ev.title}".`, '#/org/event/' + ev.id);
    save();
  }
  function saveTicketType(user, eventId, data) {
    const ev = byId('events', eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền với sự kiện này.');
    if (ev.status === 'CANCELLED') fail('Sự kiện đã hủy.');
    const price = Number(data.price), qty = Number(data.quantity), min = Number(data.minPerOrder), max = Number(data.maxPerOrder);
    if (!data.name || !data.name.trim()) fail('Tên loại vé là bắt buộc.');
    if (!(price > 0)) fail('Giá bán phải lớn hơn 0.');
    if (!Number.isInteger(qty) || qty <= 0) fail('Số lượng phát hành phải là số nguyên dương.');
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) fail('Giới hạn mua: tối thiểu ≥ 1 và tối đa ≥ tối thiểu.');
    if (!(data.saleStart && data.saleEnd && data.saleEnd > data.saleStart)) fail('Thời gian kết thúc bán phải sau thời gian bắt đầu bán.');
    if (ev.startAt && data.saleEnd > ev.startAt) fail('Thời gian kết thúc bán phải trước thời điểm sự kiện bắt đầu.');
    let tt = data.id ? byId('ticketTypes', data.id) : null;
    if (tt) {
      if (qty < tt.held + tt.sold) fail(`Không thể giảm số lượng xuống dưới ${tt.held + tt.sold} (đang giữ + đã bán).`); // YC-CN-07
      Object.assign(tt, { name: data.name.trim(), price, quantity: qty, minPerOrder: min, maxPerOrder: max, saleStart: data.saleStart, saleEnd: data.saleEnd });
    } else {
      tt = { id: uid('TT'), eventId, name: data.name.trim(), price, quantity: qty, minPerOrder: min, maxPerOrder: max, saleStart: data.saleStart, saleEnd: data.saleEnd, held: 0, sold: 0 };
      db.ticketTypes.push(tt);
    }
    audit(user.id, 'LUU_LOAI_VE', tt.id); save();
    return tt;
  }
  function deleteTicketType(user, typeId) {
    const tt = byId('ticketTypes', typeId); const ev = byId('events', tt.eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền.');
    if (tt.held + tt.sold > 0) fail('Loại vé đã phát sinh đơn hàng, không thể xóa.');
    db.ticketTypes = db.ticketTypes.filter(x => x.id !== typeId); save();
  }
  function cancelEvent(user, eventId, reason) {
    const ev = byId('events', eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền.');
    if (ev.status === 'CANCELLED') fail('Sự kiện đã hủy trước đó.');
    if (!reason || reason.trim().length < 5) fail('Vui lòng nhập lý do hủy (tối thiểu 5 ký tự).');
    ev.status = 'CANCELLED'; ev.cancelReason = reason; ev.cancelledAt = now();
    // Dừng bán; xử lý đơn chưa thanh toán; vô hiệu hóa vé
    db.orders.filter(o => o.eventId === ev.id).forEach(o => {
      if (o.status === 'PENDING_PAYMENT') releaseOrder(o, 'CANCELLED', 'Sự kiện bị hủy');
      if (o.status === 'PAID') {
        ticketsOf(o.id).forEach(t => { if (t.status === 'VALID') t.status = 'VOID'; });
        notify(o.userId, `Sự kiện "${ev.title}" đã bị hủy. Bạn có thể gửi yêu cầu hoàn vé cho đơn ${o.id}.`, '#/my/order/' + o.id);
      }
    });
    audit(user.id, 'HUY_SU_KIEN', ev.id, reason); save();
  }

  // ---------------------------------------------------------- kiểm duyệt (UC-02)
  function reviewEvent(admin, eventId, approve, note) {
    const ev = byId('events', eventId);
    if (ev.status !== 'PENDING') fail('Sự kiện không ở trạng thái chờ duyệt.');
    if (!approve && (!note || note.trim().length < 5)) fail('Phải nhập lý do từ chối (tối thiểu 5 ký tự).');
    ev.status = approve ? 'PUBLISHED' : 'REJECTED';
    ev.reviewNote = note || ''; ev.reviewedAt = now(); ev.reviewedBy = admin.id;
    audit(admin.id, approve ? 'DUYET_SU_KIEN' : 'TU_CHOI_SU_KIEN', ev.id, note);
    notify(ev.ownerId, approve ? `Sự kiện "${ev.title}" đã được duyệt và công bố.` : `Sự kiện "${ev.title}" bị từ chối: ${note}`, '#/org/event/' + ev.id);
    save();
  }

  // ---------------------------------------------------------- đặt vé (UC-03)
  function placeOrder(user, eventId, selections, attendee) {
    sweepExpired();
    const ev = byId('events', eventId);
    if (!ev || ev.status !== 'PUBLISHED') fail('Sự kiện chưa được công bố hoặc đã bị hủy.');
    const lines = Object.entries(selections).map(([id, q]) => [byId('ticketTypes', id), Number(q)]).filter(([, q]) => q > 0);
    if (!lines.length) fail('Vui lòng chọn ít nhất một vé.');
    for (const [tt, q] of lines) {
      if (!tt || tt.eventId !== eventId) fail('Loại vé không thuộc sự kiện.');
      const st = saleState(tt);
      if (st === 'NOT_STARTED') fail(`"${tt.name}" chưa đến thời gian mở bán.`);
      if (st === 'ENDED') fail(`"${tt.name}" đã hết thời gian bán.`);
      if (!Number.isInteger(q)) fail('Số lượng phải là số nguyên.');
      if (q < tt.minPerOrder || q > tt.maxPerOrder) fail(`"${tt.name}": mỗi đơn mua từ ${tt.minPerOrder} đến ${tt.maxPerOrder} vé.`);
      if (q > available(tt)) fail(`"${tt.name}" chỉ còn ${available(tt)} vé. Vui lòng điều chỉnh số lượng.`);
    }
    if (!attendee || !attendee.name || attendee.name.trim().length < 2) fail('Vui lòng nhập họ tên người tham dự.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email || '')) fail('Email người tham dự không hợp lệ.');
    if (!/^0\d{9}$/.test(attendee.phone || '')) fail('Số điện thoại người tham dự không hợp lệ.');
    // Tạo đơn + tạm giữ (nguyên tử: chỉ thay đổi khi đã kiểm tra xong)
    const o = { id: uid('DH'), userId: user.id, eventId, status: 'PENDING_PAYMENT', issueStatus: 'NONE', total: 0, createdAt: now(), expiresAt: now() + HOLD_MINUTES * 60000, attendee };
    lines.forEach(([tt, q]) => {
      tt.held += q; o.total += q * tt.price;
      db.orderItems.push({ id: uid('CT'), orderId: o.id, ticketTypeId: tt.id, quantity: q, unitPrice: tt.price }); // đơn giá chốt tại thời điểm tạo
    });
    db.orders.push(o);
    audit(user.id, 'TAO_DON', o.id); save();
    return o;
  }

  function releaseOrder(o, status, reason) {
    itemsOf(o.id).forEach(i => { const tt = byId('ticketTypes', i.ticketTypeId); if (tt) tt.held = Math.max(0, tt.held - i.quantity); });
    o.status = status; o.closedAt = now(); o.closeReason = reason || '';
  }
  // Kiểm tra & đánh dấu đơn hết hạn, giải phóng tạm giữ
  function sweepExpired() {
    let changed = false;
    db.orders.forEach(o => {
      if (o.status === 'PENDING_PAYMENT' && now() > o.expiresAt) {
        const paid = db.payments.some(p => p.orderId === o.id && p.result === 'SUCCESS');
        if (!paid) { releaseOrder(o, 'EXPIRED', 'Quá thời hạn thanh toán'); notify(o.userId, `Đơn ${o.id} đã hết hạn thanh toán.`, '#/my/order/' + o.id); changed = true; }
      }
    });
    if (changed) save();
  }
  function cancelUnpaidOrder(user, orderId) { // UC-19
    sweepExpired();
    const o = byId('orders', orderId);
    if (!o || o.userId !== user.id) fail('Không tìm thấy đơn hàng.');
    if (db.payments.some(p => p.orderId === o.id && p.result === 'SUCCESS')) fail('Đơn đã thanh toán, không áp dụng hủy đơn chưa thanh toán.');
    if (o.status !== 'PENDING_PAYMENT') fail('Đơn không ở trạng thái chờ thanh toán.');
    releaseOrder(o, 'CANCELLED', 'Khách hàng hủy');
    audit(user.id, 'HUY_DON', o.id); save();
  }

  // ---------------------------------------------------------- thanh toán & phát hành vé (UC-04)
  // outcome: 'SUCCESS' | 'FAILED' | 'SUCCESS_ISSUE_ERROR'
  function pay(user, orderId, outcome, method) {
    sweepExpired();
    const o = byId('orders', orderId);
    if (!o || o.userId !== user.id) fail('Không tìm thấy đơn hàng.');
    const existing = db.payments.find(p => p.orderId === o.id && p.result === 'SUCCESS');
    if (existing) return { order: o, duplicate: true }; // xử lý lặp: dùng kết quả cũ, không phát hành thêm
    if (o.status === 'EXPIRED') fail('Đơn đã hết hạn thanh toán. Vui lòng đặt đơn mới.');
    if (o.status !== 'PENDING_PAYMENT') fail('Đơn không ở trạng thái chờ thanh toán.');
    const p = { id: uid('GD'), orderId: o.id, amount: o.total, method: method || 'Ví điện tử (mô phỏng)', ref: 'GD' + Math.floor(Math.random() * 1e8), createdAt: now() };
    if (outcome === 'FAILED') {
      p.result = 'FAILED'; db.payments.push(p);
      audit(user.id, 'THANH_TOAN_THAT_BAI', o.id); save();
      return { order: o, failed: true };
    }
    p.result = 'SUCCESS'; db.payments.push(p);
    o.status = 'PAID'; o.paidAt = now();
    itemsOf(o.id).forEach(i => { const tt = byId('ticketTypes', i.ticketTypeId); tt.held -= i.quantity; tt.sold += i.quantity; });
    if (outcome === 'SUCCESS_ISSUE_ERROR') {
      o.issueStatus = 'ERROR';
      notify(o.userId, `Đơn ${o.id} đã thanh toán nhưng chưa phát hành đủ vé. Hệ thống đang xử lý.`, '#/my/order/' + o.id);
    } else {
      issueTickets(o);
      notify(o.userId, `Thanh toán thành công đơn ${o.id}. Vé điện tử đã được phát hành.`, '#/my/order/' + o.id);
    }
    audit(user.id, 'THANH_TOAN_THANH_CONG', o.id); save();
    return { order: o };
  }
  function issueTickets(o) {
    itemsOf(o.id).forEach(i => {
      const have = db.tickets.filter(t => t.orderId === o.id && t.ticketTypeId === i.ticketTypeId).length;
      for (let k = have; k < i.quantity; k++) // không tạo vé trùng khi xử lý lại
        db.tickets.push({ id: uid('VE'), code: ticketCode(), orderId: o.id, ticketTypeId: i.ticketTypeId, eventId: o.eventId, status: 'VALID', issuedAt: now() });
    });
    o.issueStatus = 'ISSUED';
  }

  // ---------------------------------------------------------- check-in (UC-05)
  function checkin(user, eventId, rawCode, method) {
    const ev = byId('events', eventId);
    const allowed = checkinEventsOf(user).some(e => e.id === eventId);
    const code = String(rawCode || '').trim().toUpperCase();
    const log = (result, reason, ticket) => {
      const c = { id: uid('CI'), eventId, ticketId: ticket ? ticket.id : null, code, staffId: user.id, method, result, reason, at: now() };
      db.checkins.unshift(c); save(); return c;
    };
    if (!allowed) return log('DENIED', 'Bạn không được phân công check-in sự kiện này.');
    if (!code) return log('DENIED', 'Chưa nhập mã vé.');
    const t = db.tickets.find(x => x.code === code);
    if (!t) return log('DENIED', 'Mã vé không tồn tại.');
    if (t.eventId !== eventId) return log('DENIED', 'Vé không thuộc sự kiện này.', t);
    if (t.status === 'USED') { const last = db.checkins.find(c => c.ticketId === t.id && c.result === 'OK'); return log('DENIED', 'Vé đã được check-in lúc ' + (last ? new Date(last.at).toLocaleTimeString('vi-VN') : '') + '.', t); }
    if (t.status === 'VOID') return log('DENIED', 'Vé đã bị vô hiệu hóa (hoàn tiền/hủy sự kiện).', t);
    if (ev.status !== 'PUBLISHED') return log('DENIED', 'Sự kiện không còn hiệu lực.', t);
    t.status = 'USED'; t.usedAt = now();
    const c = log('OK', 'Hợp lệ', t);
    audit(user.id, 'CHECK_IN', t.id); save();
    return c;
  }

  // ---------------------------------------------------------- thành viên sự kiện (UC-21)
  function addMember(user, eventId, email, role) {
    const ev = byId('events', eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) fail('Email không hợp lệ.');
    email = email.trim().toLowerCase();
    if (db.members.some(m => m.eventId === eventId && m.userEmail === email && m.role === role)) fail('Thành viên đã có quyền này.');
    db.members.push({ id: uid('M'), eventId, userEmail: email, role, addedAt: now() });
    const u = userByEmail(email); if (u) notify(u.id, `Bạn được cấp quyền ${role === 'CHECKIN' ? 'check-in' : 'quản lý'} cho sự kiện "${ev.title}".`);
    audit(user.id, 'THEM_THANH_VIEN', eventId, email + ' ' + role); save();
  }
  function removeMember(user, memberId) {
    const m = byId('members', memberId); const ev = byId('events', m.eventId);
    if (!canManageEvent(user, ev)) fail('Bạn không có quyền.');
    db.members = db.members.filter(x => x.id !== memberId);
    audit(user.id, 'THU_HOI_QUYEN', m.eventId, m.userEmail); save();
  }

  // ---------------------------------------------------------- hỗ trợ (UC-06)
  function createSupport(user, { orderId, category, subject, content }) {
    const o = byId('orders', orderId);
    if (!o || o.userId !== user.id) fail('Yêu cầu phải gắn với đơn hàng thuộc tài khoản của bạn.');
    if (!subject || subject.trim().length < 5) fail('Tiêu đề tối thiểu 5 ký tự.');
    if (!content || content.trim().length < 10) fail('Nội dung tối thiểu 10 ký tự.');
    const s = { id: uid('HT'), userId: user.id, orderId, category, subject: subject.trim(), content: content.trim(), status: 'NEW', assignee: null, createdAt: now(), messages: [] };
    db.supports.unshift(s);
    db.users.filter(u => u.roles.includes('CSKH')).forEach(c => notify(c.id, `Yêu cầu hỗ trợ mới ${s.id}: ${s.subject}`, '#/cs/support/' + s.id));
    audit(user.id, 'GUI_HO_TRO', s.id); save(); return s;
  }
  function supportReply(user, supportId, text, newStatus) {
    const s = byId('supports', supportId);
    const isOwner = s.userId === user.id; const isCS = user.roles.includes('CSKH');
    if (!isOwner && !isCS) fail('Bạn không có quyền.');
    if (s.status === 'CLOSED') fail('Yêu cầu đã đóng.');
    if (!text || !text.trim()) fail('Nội dung phản hồi không được để trống.');
    s.messages.push({ by: user.id, role: isCS ? 'CSKH' : 'KHACH', text: text.trim(), at: now() });
    if (isCS) {
      s.assignee = s.assignee || user.id;
      s.status = newStatus || 'IN_PROGRESS';
      notify(s.userId, `CSKH đã phản hồi yêu cầu ${s.id}.`, '#/my/support/' + s.id);
    } else if (s.status === 'NEED_INFO') s.status = 'IN_PROGRESS';
    audit(user.id, 'PHAN_HOI_HO_TRO', s.id, s.status); save();
  }

  // ---------------------------------------------------------- hoàn vé (UC-22, 07, 23, 08)
  function refundEligibility(o) {
    if (!o || o.status !== 'PAID') return 'Chỉ áp dụng cho đơn đã thanh toán.';
    if (ticketsOf(o.id).some(t => t.status === 'USED')) return 'Đơn đã có vé được check-in, không đủ điều kiện hoàn toàn bộ đơn.';
    if (db.refunds.some(r => r.orderId === o.id && r.status === 'SUCCESS')) return 'Đơn đã được hoàn tiền.';
    if (db.refundRequests.some(r => r.orderId === o.id && ['WAIT_CS', 'WAIT_ORG', 'WAIT_ADMIN', 'APPROVED'].includes(r.status))) return 'Đơn đang có yêu cầu hoàn vé được xử lý.';
    return null;
  }
  function requestRefund(user, orderId, reason) {
    const o = byId('orders', orderId);
    if (!o || o.userId !== user.id) fail('Không tìm thấy đơn hàng.');
    const why = refundEligibility(o); if (why) fail(why);
    if (!reason || reason.trim().length < 10) fail('Lý do tối thiểu 10 ký tự.');
    const source = o.issueStatus === 'ERROR' ? 'ISSUE_ERROR' : 'POLICY';
    const r = { id: uid('HV'), orderId, userId: user.id, eventId: o.eventId, reason: reason.trim(), source, status: 'WAIT_CS', amount: o.total, createdAt: now(), history: [{ at: now(), by: user.id, text: 'Khách hàng gửi yêu cầu' }] };
    db.refundRequests.unshift(r);
    db.users.filter(u => u.roles.includes('CSKH')).forEach(c => notify(c.id, `Yêu cầu hoàn vé mới ${r.id}.`, '#/cs/refunds'));
    audit(user.id, 'GUI_HOAN_VE', r.id); save(); return r;
  }
  // CSKH kiểm tra thông tin rồi chuyển BTC (chính sách) hoặc QTV (lỗi cung cấp vé)
  function csForwardRefund(user, reqId, note) {
    const r = byId('refundRequests', reqId);
    if (r.status !== 'WAIT_CS') fail('Yêu cầu không ở bước CSKH kiểm tra.');
    const why = refundEligibility(byId('orders', r.orderId));
    if (why && !why.startsWith('Đơn đang có')) fail(why);
    r.status = r.source === 'ISSUE_ERROR' ? 'WAIT_ADMIN' : 'WAIT_ORG';
    r.history.push({ at: now(), by: user.id, text: 'CSKH đã kiểm tra và chuyển ' + (r.source === 'ISSUE_ERROR' ? 'quản trị viên xác minh' : 'đơn vị tổ chức xét duyệt') + (note ? ': ' + note : '') });
    const ev = byId('events', r.eventId);
    if (r.status === 'WAIT_ORG') notify(ev.ownerId, `Có yêu cầu hoàn vé ${r.id} cần xét duyệt.`, '#/org/event/' + ev.id + '?tab=refunds');
    else db.users.filter(u => u.roles.includes('ADMIN')).forEach(a => notify(a.id, `Cần xác minh lỗi cung cấp vé ${r.id}.`, '#/admin/ticket-errors'));
    audit(user.id, 'CHUYEN_HOAN_VE', r.id); save();
  }
  function decideRefund(user, reqId, approve, note) { // UC-07 (BTC) & UC-23 (QTV)
    const r = byId('refundRequests', reqId); const ev = byId('events', r.eventId);
    if (r.status === 'WAIT_ORG') { if (!canManageEvent(user, ev)) fail('Chỉ đơn vị tổ chức được xét duyệt.'); }
    else if (r.status === 'WAIT_ADMIN') { if (!user.roles.includes('ADMIN')) fail('Chỉ quản trị viên được xác minh.'); }
    else fail('Yêu cầu không ở bước xét duyệt.');
    if (!approve && (!note || note.trim().length < 5)) fail('Phải nhập lý do từ chối.');
    r.status = approve ? 'APPROVED' : 'REJECTED'; r.decidedBy = user.id; r.decidedAt = now(); r.decisionNote = note || '';
    r.history.push({ at: now(), by: user.id, text: (approve ? 'Chấp thuận' : 'Từ chối') + (note ? ': ' + note : '') });
    notify(r.userId, approve ? `Yêu cầu hoàn vé ${r.id} đã được chấp thuận, đang chờ xử lý hoàn tiền.` : `Yêu cầu hoàn vé ${r.id} bị từ chối: ${note}`, '#/my/order/' + r.orderId);
    if (approve) db.users.filter(u => u.roles.includes('CSKH')).forEach(c => notify(c.id, `Hoàn vé ${r.id} đã được chấp thuận – cần xử lý hoàn tiền.`, '#/cs/refunds'));
    audit(user.id, approve ? 'CHAP_THUAN_HOAN' : 'TU_CHOI_HOAN', r.id, note); save();
  }
  // Admin chủ động xác minh đơn lỗi phát hành (không cần khách gửi yêu cầu)
  function adminRetryIssue(admin, orderId) {
    const o = byId('orders', orderId);
    if (o.issueStatus !== 'ERROR') fail('Đơn không ở trạng thái lỗi phát hành.');
    issueTickets(o);
    notify(o.userId, `Vé của đơn ${o.id} đã được phát hành lại thành công.`, '#/my/order/' + o.id);
    audit(admin.id, 'PHAT_HANH_LAI', o.id); save();
  }
  function processRefund(user, reqId, outcome) { // UC-08
    if (!user.roles.includes('CSKH')) fail('Chỉ CSKH được phân quyền mới xử lý hoàn tiền.');
    const r = byId('refundRequests', reqId); const o = byId('orders', r.orderId);
    if (!['APPROVED', 'PROCESSING'].includes(r.status)) fail('Yêu cầu chưa được chấp thuận hoặc đã hoàn tất.');
    if (db.refunds.some(x => x.orderId === o.id && x.status === 'SUCCESS')) fail('Khoản này đã hoàn thành công, không hoàn lặp.');
    if (ticketsOf(o.id).some(t => t.status === 'USED')) fail('Đơn đã có vé check-in, không thể hoàn.');
    ticketsOf(o.id).forEach(t => { if (t.status === 'VALID') t.status = 'VOID'; }); // vô hiệu hóa vé
    const paid = db.payments.filter(p => p.orderId === o.id && p.result === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
    const rf = { id: uid('RF'), requestId: r.id, orderId: o.id, amount: paid, status: outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED', by: user.id, at: now() };
    db.refunds.unshift(rf);
    if (rf.status === 'SUCCESS') {
      r.status = 'DONE'; o.refundStatus = 'REFUNDED';
      notify(r.userId, `Đã hoàn ${paid.toLocaleString('vi-VN')}đ cho đơn ${o.id}.`, '#/my/order/' + o.id);
    } else {
      r.status = 'PROCESSING'; o.refundStatus = 'PROCESSING'; // vé không tự có hiệu lực trở lại
    }
    r.history.push({ at: now(), by: user.id, text: 'Giao dịch hoàn tiền ' + (rf.status === 'SUCCESS' ? 'thành công' : 'thất bại – tiếp tục theo dõi') });
    audit(user.id, 'HOAN_TIEN_' + rf.status, r.id); save();
    return rf;
  }

  // ---------------------------------------------------------- thống kê (UC-24)
  function eventStats(eventId) {
    const types = typesOf(eventId);
    const orders = db.orders.filter(o => o.eventId === eventId);
    const tickets = db.tickets.filter(t => t.eventId === eventId);
    const paid = orders.filter(o => o.status === 'PAID');
    const refunded = db.refunds.filter(r => r.status === 'SUCCESS' && byId('orders', r.orderId).eventId === eventId).reduce((s, r) => s + r.amount, 0);
    return {
      types: types.map(t => ({ ...t, available: available(t), checkedIn: tickets.filter(x => x.ticketTypeId === t.id && x.status === 'USED').length })),
      orders: orders.length, paidOrders: paid.length,
      revenue: paid.reduce((s, o) => s + o.total, 0), refunded,
      sold: types.reduce((s, t) => s + t.sold, 0), held: types.reduce((s, t) => s + t.held, 0),
      checkedIn: tickets.filter(t => t.status === 'USED').length, issued: tickets.length,
    };
  }

  load();
  window.DB = {
    HOLD_MINUTES, get data() { return db; }, save, reset, now, advanceClock, clockOffset, BizError,
    byId, userByEmail, typesOf, itemsOf, ticketsOf, available, saleState, eventMinPrice,
    register, login, updateProfile, adminSetUser,
    canManageEvent, checkinEventsOf,
    saveEvent, submitEvent, saveTicketType, deleteTicketType, cancelEvent, validateEventForSubmit,
    reviewEvent, placeOrder, cancelUnpaidOrder, sweepExpired, pay, checkin,
    addMember, removeMember, createSupport, supportReply,
    refundEligibility, requestRefund, csForwardRefund, decideRefund, adminRetryIssue, processRefund,
    eventStats,
  };
})();
