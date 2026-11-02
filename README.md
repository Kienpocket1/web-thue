# TicketGo – Hệ thống phân phối vé & quản lý sự kiện (bản demo)

Bản demo web cho đồ án **“Phân tích hệ thống phân phối vé và quản lý sự kiện”**. Giao diện theo phong cách nền tảng bán vé sự kiện: nền tối, màu nhấn xanh lá, thẻ sự kiện.

## Chạy demo

Không cần cài đặt hay build. Cách đơn giản nhất:

```bash
python3 -m http.server 8000
```

Sau đó mở http://localhost:8000. Cũng có thể bật **GitHub Pages** cho repo: Settings → Pages → Branch `main`, thư mục `/ (root)`.

Tài khoản demo (mật khẩu **123456**): `khach@demo.vn`, `btc@demo.vn`, `admin@demo.vn`, `cskh@demo.vn`, `checkin@demo.vn`.

Nút **⚙ Công cụ demo** (góc trái dưới) dùng để tua thời gian (minh họa đơn hết hạn) và khôi phục dữ liệu mẫu.

## Chức năng theo vai trò

| Vai trò | Chức năng |
|---|---|
| Khách vãng lai | Tìm kiếm, xem sự kiện, đăng ký, đăng nhập |
| Khách hàng | Đặt vé, tạm giữ 15 phút, thanh toán (mô phỏng), vé QR, hủy đơn chưa TT, hỗ trợ, hoàn vé |
| Đơn vị tổ chức | Tạo sự kiện / loại vé, lưu nháp, gửi duyệt, thống kê, người tham dự, thành viên, xét duyệt hoàn vé, hủy sự kiện |
| Quản trị viên | Kiểm duyệt sự kiện, tài khoản & phân quyền, xác minh lỗi cung cấp vé, nhật ký |
| Nhân viên CSKH | Xử lý yêu cầu hỗ trợ, chuyển và xử lý hoàn tiền |
| Nhân sự check-in | Quét QR bằng camera hoặc nhập mã, kiểm tra hợp lệ, lịch sử |

## Cấu trúc

```
index.html              Khung trang
assets/css/style.css    Giao diện
assets/js/db.js         Dữ liệu mẫu + nghiệp vụ (quy tắc, trạng thái, phân quyền)
assets/js/app.js        Điều hướng và các màn hình
docs/BAO_CAO.md / .docx Báo cáo: Chương 4, Chương 5, Phụ lục
docs/KICH_BAN_DEMO.md   Kịch bản demo từng bước + giải thích + câu hỏi thường gặp
docs/img/               Ảnh chụp giao diện, ERD, kiến trúc
```

## Giới hạn

Dữ liệu lưu trên trình duyệt (localStorage). Thanh toán, email và hoàn tiền được mô phỏng. Bản demo phục vụ mục đích học tập. Tên, logo và dữ liệu là giả lập, không liên kết với bất kỳ nền tảng bán vé thực tế nào.
