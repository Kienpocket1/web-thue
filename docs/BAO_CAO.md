---
title: "PHÂN TÍCH HỆ THỐNG PHÂN PHỐI VÉ VÀ QUẢN LÝ SỰ KIỆN"
subtitle: "Phần bổ sung: Chương 4 – Thiết kế hệ thống, Chương 5 – Kết luận, Phụ lục"
lang: vi
---

> Tài liệu này nối tiếp Chương 1–3 trong bản đồ án gốc. Bố cục, mã quy tắc (QTN), mã yêu cầu (YC-CN, YC-PCN) và mã Use Case (UC) được giữ thống nhất với các chương trước. Bản minh họa giao diện được xây dựng dưới dạng ứng dụng web chạy trên trình duyệt (TicketGo) với dữ liệu mẫu; thanh toán, gửi email và hoàn tiền được mô phỏng.

# CHƯƠNG 4. THIẾT KẾ HỆ THỐNG

## 4.1. Thiết kế cơ sở dữ liệu

### 4.1.1. Xác định các thực thể và thuộc tính

Từ các nhóm dữ liệu đã xác định tại mục 2.2.1 và các quy ước tại mục 2.2.2, hệ thống đề xuất gồm các thực thể sau:

Bảng 4.1. Danh sách thực thể và thuộc tính chính

| STT | Thực thể | Ý nghĩa | Thuộc tính chính |
|---|---|---|---|
| 1 | NGUOI_DUNG | Tài khoản sử dụng hệ thống | MaND, Email, MatKhauBam, Salt, HoTen, SoDienThoai, TrangThai, NgayTao |
| 2 | VAI_TRO_NGUOI_DUNG | Vai trò hệ thống được cấp cho tài khoản | MaND, VaiTro (KHACH_HANG, DON_VI_TO_CHUC, QUAN_TRI_VIEN, CSKH) |
| 3 | SU_KIEN | Sự kiện do đơn vị tổ chức tạo | MaSK, MaBTC, TenSK, TheLoai, DiaDiem, DiaChi, MoTa, ChinhSachHoan, BatDau, KetThuc, TrangThai, LyDoTuChoi, NguoiDuyet, ThoiDiemDuyet, LyDoHuy |
| 4 | THANH_VIEN_SU_KIEN | Thành viên được BTC phân quyền theo sự kiện | MaTV, MaSK, Email, Quyen (CHECKIN, QUAN_LY), NgayCap |
| 5 | LOAI_VE | Loại vé thuộc một sự kiện | MaLV, MaSK, TenLV, GiaBan, SoLuongPhanBo, DangGiu, DaBan, ToiThieuMoiDon, ToiDaMoiDon, BatDauBan, KetThucBan |
| 6 | DON_HANG | Đơn đặt vé của khách hàng | MaDH, MaND, MaSK, TongTien, TrangThai, TrangThaiPhatHanh, HanThanhToan, ThoiDiemThanhToan, HoTenNTD, EmailNTD, SdtNTD |
| 7 | CHI_TIET_DON | Dòng chi tiết theo loại vé | MaCT, MaDH, MaLV, SoLuong, DonGia |
| 8 | THANH_TOAN | Kết quả giao dịch thanh toán | MaGD, MaDH, SoTien, PhuongThuc, MaThamChieu, KetQua, ThoiDiem |
| 9 | VE_DIEN_TU | Vé được phát hành cho đơn đã thanh toán | MaVe, MaDinhDanh, MaDH, MaLV, MaSK, TrangThai, ThoiDiemPhatHanh, ThoiDiemSuDung |
| 10 | LUOT_CHECKIN | Mỗi lần kiểm tra vé tại cửa | MaCI, MaSK, MaVe, MaNhap, MaNhanSu, PhuongThuc, KetQua, LyDo, ThoiDiem |
| 11 | YEU_CAU_HO_TRO | Yêu cầu hỗ trợ gắn với đơn hàng | MaHT, MaND, MaDH, PhanLoai, TieuDe, NoiDung, TrangThai, NguoiXuLy, NgayTao |
| 12 | PHAN_HOI_HO_TRO | Trao đổi giữa khách hàng và CSKH | MaHT, NguoiGui, VaiTro, NoiDung, ThoiDiem |
| 13 | YEU_CAU_HOAN_VE | Yêu cầu hoàn toàn bộ đơn | MaHV, MaDH, MaND, Nguon (CHINH_SACH / LOI_CUNG_CAP_VE), LyDo, TrangThai, SoTien, NguoiQuyetDinh, GhiChuQuyetDinh |
| 14 | GIAO_DICH_HOAN_TIEN | Kết quả mỗi lần thực hiện hoàn tiền | MaRF, MaHV, MaDH, SoTien, KetQua, NguoiThucHien, ThoiDiem |
| 15 | THONG_BAO | Thông báo gửi đến người dùng | MaTB, MaND, NoiDung, LienKet, DaDoc, ThoiDiem |
| 16 | NHAT_KY | Nhật ký thao tác phục vụ truy vết | MaLS, MaND, HanhDong, DoiTuong, ChiTiet, ThoiDiem |

### 4.1.2. Sơ đồ ERD

![Hình 4.1. Sơ đồ ERD của hệ thống đề xuất.](img/erd.png){ width=16cm }

### 4.1.3. Mối quan hệ giữa các thực thể

Bảng 4.2. Mối quan hệ giữa các thực thể

| Quan hệ | Bản số | Diễn giải |
|---|---|---|
| NGUOI_DUNG – VAI_TRO_NGUOI_DUNG | 1 – n | Một tài khoản có thể có nhiều vai trò (ví dụ vừa là khách hàng vừa là đơn vị tổ chức). |
| NGUOI_DUNG – SU_KIEN | 1 – n | Một đơn vị tổ chức tạo nhiều sự kiện; mỗi sự kiện có một chủ sở hữu. |
| SU_KIEN – THANH_VIEN_SU_KIEN | 1 – n | BTC bổ sung thành viên bằng email và cấp quyền theo từng sự kiện (QTN-04). |
| SU_KIEN – LOAI_VE | 1 – n | Mỗi loại vé thuộc đúng một sự kiện; sự kiện cần ít nhất một loại vé để gửi duyệt. |
| NGUOI_DUNG – DON_HANG | 1 – n | Mỗi đơn hàng thuộc một khách hàng. |
| SU_KIEN – DON_HANG | 1 – n | Mỗi đơn hàng thuộc một sự kiện; không gộp vé của nhiều sự kiện. |
| DON_HANG – CHI_TIET_DON – LOAI_VE | n – n | Đơn hàng gồm nhiều loại vé của cùng sự kiện; đơn giá chốt tại thời điểm tạo đơn. |
| DON_HANG – THANH_TOAN | 1 – n | Một đơn có thể có nhiều lần thanh toán thất bại và tối đa một kết quả thành công. |
| DON_HANG – VE_DIEN_TU | 1 – n | Số vé phát hành bằng tổng số lượng trong chi tiết đơn. |
| VE_DIEN_TU – LUOT_CHECKIN | 1 – n | Một vé có thể được kiểm tra nhiều lần nhưng chỉ một lượt có kết quả thành công. |
| DON_HANG – YEU_CAU_HO_TRO | 1 – n | Yêu cầu hỗ trợ gắn với đơn hàng thuộc tài khoản người gửi. |
| DON_HANG – YEU_CAU_HOAN_VE | 1 – n | Tại một thời điểm chỉ có tối đa một yêu cầu đang xử lý cho mỗi đơn. |
| YEU_CAU_HOAN_VE – GIAO_DICH_HOAN_TIEN | 1 – n | Có thể phát sinh giao dịch thất bại trước khi có giao dịch thành công; không hoàn lặp. |

### 4.1.4. Thiết kế các bảng dữ liệu và ràng buộc

Bảng 4.3. Bảng LOAI_VE

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| MaLV | VARCHAR(20) | PK |
| MaSK | VARCHAR(20) | FK → SU_KIEN, NOT NULL |
| TenLV | NVARCHAR(100) | NOT NULL |
| GiaBan | DECIMAL(12,0) | CHECK (GiaBan > 0) |
| SoLuongPhanBo | INT | CHECK (SoLuongPhanBo > 0) |
| DangGiu, DaBan | INT | DEFAULT 0, CHECK (≥ 0); CHECK (DangGiu + DaBan ≤ SoLuongPhanBo) |
| ToiThieuMoiDon, ToiDaMoiDon | INT | CHECK (1 ≤ ToiThieu ≤ ToiDa) |
| BatDauBan, KetThucBan | DATETIME | CHECK (KetThucBan > BatDauBan); KetThucBan ≤ SU_KIEN.BatDau |

Bảng 4.4. Bảng DON_HANG

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| MaDH | VARCHAR(20) | PK |
| MaND | VARCHAR(20) | FK → NGUOI_DUNG |
| MaSK | VARCHAR(20) | FK → SU_KIEN |
| TongTien | DECIMAL(14,0) | = Σ(SoLuong × DonGia) của CHI_TIET_DON |
| TrangThai | VARCHAR(20) | IN (CHO_THANH_TOAN, DA_THANH_TOAN, DA_HUY, HET_HAN) |
| TrangThaiPhatHanh | VARCHAR(20) | IN (CHUA, DA_PHAT_HANH, LOI_PHAT_HANH) |
| HanThanhToan | DATETIME | = NgayTao + thời hạn cấu hình (demo: 15 phút) |

Bảng 4.5. Bảng VE_DIEN_TU

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| MaVe | VARCHAR(20) | PK |
| MaDinhDanh | VARCHAR(20) | UNIQUE – nội dung mã QR |
| MaDH, MaLV, MaSK | VARCHAR(20) | FK |
| TrangThai | VARCHAR(20) | IN (CON_HIEU_LUC, DA_SU_DUNG, VO_HIEU) |

Các bảng còn lại được mô tả chi tiết tại Phụ lục 2. Các ràng buộc liên bảng được hiện thực trong tầng nghiệp vụ:

- **Không âm số lượng khả dụng (YC-PCN-06):** Khả dụng = SoLuongPhanBo − DangGiu − DaBan; kiểm tra lại tại thời điểm xác nhận đặt vé, chỉ cập nhật khi mọi dòng chi tiết hợp lệ.
- **Không giảm phân bổ dưới lượng đã dùng (YC-CN-07):** SoLuongPhanBo mới ≥ DangGiu + DaBan.
- **Không phát hành trùng (YC-PCN-07):** Khi xử lý lại, chỉ phát hành phần còn thiếu so với SoLuong của chi tiết đơn; kết quả thanh toán thành công lặp lại trả về kết quả cũ.
- **Mỗi vé check-in thành công một lần:** Chỉ ghi nhận thành công khi vé ở trạng thái CON_HIEU_LUC, sau đó chuyển DA_SU_DUNG.
- **Không hoàn lặp:** Không tạo giao dịch hoàn khi đơn đã có GIAO_DICH_HOAN_TIEN thành công.

## 4.2. Thiết kế kiến trúc hệ thống

### 4.2.1. Kiến trúc tổng thể

Hệ thống được thiết kế theo kiến trúc ba tầng: tầng trình bày, tầng nghiệp vụ và tầng dữ liệu. Các dịch vụ bên ngoài (cổng thanh toán, email) được tách thành giao tiếp riêng; trong phạm vi đề tài, chúng được mô phỏng.

![Hình 4.2. Kiến trúc tổng thể của hệ thống đề xuất.](img/kien-truc.png){ width=16cm }

Trong bản demo, ba tầng được hiện thực như sau:

| Tầng | Thiết kế | Bản demo |
|---|---|---|
| Trình bày | Giao diện web đáp ứng nhiều kích thước màn hình | `index.html`, `assets/css/style.css`, các màn hình trong `assets/js/app.js` |
| Nghiệp vụ | Các dịch vụ kiểm tra quy tắc, phân quyền, chuyển trạng thái | `assets/js/db.js` (đối tượng `DB` với các hàm `placeOrder`, `pay`, `checkin`, `processRefund`, …) |
| Dữ liệu | Hệ quản trị CSDL quan hệ | `localStorage` của trình duyệt (cấu trúc tương ứng bảng ở mục 4.1) |

### 4.2.2. Các thành phần chức năng

Bảng 4.6. Các thành phần chức năng

| Thành phần | Chức năng | Use Case |
|---|---|---|
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, hồ sơ, khóa/mở khóa, cấp vai trò | UC-09 → UC-13 |
| Sự kiện & kiểm duyệt | Tạo, lưu nháp, sửa, thiết lập loại vé, gửi duyệt, duyệt/từ chối, hủy sự kiện | UC-01, 02, 15, 16, 17 |
| Đặt vé & thanh toán | Kiểm tra điều kiện, tạo đơn, tạm giữ, ghi nhận kết quả, hủy/hết hạn, phát hành vé | UC-03, 04, 18, 19, 20 |
| Vé & check-in | Sinh mã QR, quét/nhập mã, kiểm tra hiệu lực, ghi nhận lượt tham dự | UC-05, 21 |
| Hỗ trợ & hoàn tiền | Gửi/xử lý hỗ trợ, gửi hoàn vé, xét duyệt, xác minh lỗi cung cấp vé, hoàn tiền | UC-06, 07, 08, 22, 23 |
| Theo dõi | Thống kê vé bán, tạm giữ, doanh thu, check-in, hoàn tiền | UC-24 |
| Thông báo & nhật ký | Thông báo kết quả xử lý; ghi người, thời điểm, hành động | YC-CN-22, YC-PCN-08 |

## 4.3. Thiết kế phân quyền người dùng

Quyền được kiểm soát theo ba lớp: **vai trò hệ thống** (do quản trị viên cấp), **quyền theo sự kiện** (do đơn vị tổ chức cấp cho thành viên) và **quyền sở hữu dữ liệu** (khách hàng chỉ xem đơn, vé, yêu cầu của mình).

Bảng 4.7. Ma trận phân quyền

| Chức năng | Khách vãng lai | Khách hàng | Đơn vị tổ chức | Quản trị viên | CSKH | Nhân sự check-in |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Tìm kiếm, xem sự kiện đã công bố | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Đăng ký tài khoản | ✔ | | | | | |
| Đặt vé, thanh toán, hủy đơn chưa TT | | ✔ (của mình) | | | | |
| Xem vé, đơn hàng | | ✔ (của mình) | ✔ (sự kiện mình) | ✔ | ✔ (tra cứu) | |
| Gửi hỗ trợ, gửi hoàn vé | | ✔ (của mình) | | | | |
| Tạo/sửa sự kiện, loại vé, gửi duyệt, hủy | | | ✔ (sự kiện mình) | | | |
| Quản lý thành viên sự kiện | | | ✔ | | | |
| Xét duyệt hoàn vé theo chính sách | | | ✔ | | | |
| Kiểm duyệt sự kiện | | | | ✔ | | |
| Quản lý tài khoản, phân quyền | | | | ✔ | | |
| Xác minh lỗi cung cấp vé | | | | ✔ | | |
| Tiếp nhận, phản hồi hỗ trợ | | | | | ✔ | |
| Chuyển hoàn vé, xử lý hoàn tiền | | | | | ✔ | |
| Check-in | | | ✔ (sự kiện mình) | | | ✔ (sự kiện được phân công) |
| Xem nhật ký thao tác | | | | ✔ | | |

Trong bản demo, mỗi tuyến màn hình được gắn điều kiện truy cập (`AUTH`, `ADMIN`, `CSKH`, `CHECKIN`); mỗi hàm nghiệp vụ kiểm tra lại quyền theo sự kiện (`canManageEvent`, `checkinEventsOf`) và quyền sở hữu, nên việc nhập trực tiếp đường dẫn không vượt qua được phân quyền.

## 4.4. Thiết kế giao diện người dùng

Giao diện sử dụng nền tối, màu nhấn xanh lá, bố cục thẻ sự kiện và thanh danh mục, theo phong cách phổ biến của các nền tảng bán vé sự kiện. Các thành phần dùng chung (nút, nhãn trạng thái, bảng, hộp thoại, thông báo) được thống nhất (YC-PCN-02). Trường bắt buộc có dấu \*; lỗi nhập liệu và kết quả thao tác hiển thị bằng thông báo (YC-PCN-01, 09).

### 4.4.1. Giao diện đăng ký và đăng nhập

![Hình 4.3. Giao diện đăng nhập. Có sẵn các tài khoản demo theo vai trò.](img/02-dang-nhap.png){ width=16cm }

![Hình 4.4. Giao diện đăng ký. Kiểm tra email duy nhất, định dạng số điện thoại, độ dài và xác nhận mật khẩu.](img/03-dang-ky.png){ width=16cm }

### 4.4.2. Giao diện dành cho khách hàng

#### 4.4.2.1. Giao diện tìm kiếm và xem thông tin sự kiện

![Hình 4.5. Trang chủ: banner sự kiện nổi bật, danh sách sắp diễn ra và theo thể loại.](img/01-trang-chu.png){ width=16cm }

![Hình 4.6. Tìm kiếm theo từ khóa và lọc theo thể loại.](img/04-tim-kiem.png){ width=16cm }

![Hình 4.7. Chi tiết sự kiện: thời gian, địa điểm, giới thiệu, chính sách hoàn vé và tình trạng từng loại vé (đang bán, chưa mở bán, hết vé).](img/05-chi-tiet-su-kien.png){ width=16cm }

#### 4.4.2.2. Giao diện đặt vé và thanh toán

![Hình 4.8. Chọn loại vé, số lượng và nhập thông tin người tham dự; tóm tắt đơn hiển thị tổng tiền.](img/06-dat-ve.png){ width=16cm }

![Hình 4.9. Thông báo khi số lượng vượt giới hạn mua hoặc lượng khả dụng.](img/10-loi-khong-du-ve.png){ width=16cm }

![Hình 4.10. Thanh toán: thời gian giữ vé còn lại; cổng thanh toán mô phỏng cho phép chọn kết quả thành công, thất bại hoặc thành công nhưng lỗi phát hành vé.](img/07-thanh-toan.png){ width=16cm }

#### 4.4.2.3. Giao diện quản lý đơn hàng, vé và yêu cầu hỗ trợ

![Hình 4.11. Danh sách đơn hàng và trạng thái.](img/09-don-hang.png){ width=16cm }

![Hình 4.12. Chi tiết đơn với vé điện tử có mã QR riêng, lịch sử giao dịch và chức năng yêu cầu hoàn vé.](img/08-ve-dien-tu.png){ width=16cm }

![Hình 4.13. Gửi và theo dõi yêu cầu hỗ trợ.](img/11-ho-tro-khach.png){ width=16cm }

### 4.4.3. Giao diện dành cho đơn vị tổ chức

#### 4.4.3.1. Giao diện quản lý sự kiện và loại vé

![Hình 4.14. Danh sách sự kiện của đơn vị tổ chức với trạng thái, tỷ lệ bán và check-in.](img/12-btc-danh-sach.png){ width=16cm }

![Hình 4.15. Tạo/sửa sự kiện theo 3 bước: thông tin, loại vé, gửi kiểm duyệt. Hệ thống liệt kê các điều kiện chưa đáp ứng trước khi cho phép gửi.](img/13-btc-tao-su-kien.png){ width=16cm }

#### 4.4.3.2. Giao diện quản lý đơn hàng, người tham dự và thống kê

![Hình 4.16. Tổng quan sự kiện: vé đã bán, đang giữ, doanh thu, check-in theo từng loại vé; các tab đơn hàng và người tham dự.](img/14-btc-thong-ke.png){ width=16cm }

#### 4.4.3.3. Giao diện quản lý thành viên và xét duyệt hoàn vé

![Hình 4.17. Thêm thành viên bằng email và cấp quyền check-in hoặc quản lý.](img/15-btc-thanh-vien.png){ width=16cm }

![Hình 4.18. Xét duyệt yêu cầu hoàn vé theo chính sách sự kiện; từ chối bắt buộc nhập lý do.](img/23-btc-xet-duyet-hoan.png){ width=16cm }

### 4.4.4. Giao diện dành cho quản trị viên

#### 4.4.4.1. Giao diện quản lý tài khoản và phân quyền

![Hình 4.19. Cấp/thu hồi vai trò, khóa/mở khóa tài khoản.](img/16-qtv-tai-khoan.png){ width=16cm }

#### 4.4.4.2. Giao diện kiểm duyệt sự kiện và xác minh lỗi cung cấp vé

![Hình 4.20. Danh sách sự kiện chờ duyệt.](img/17-qtv-kiem-duyet.png){ width=16cm }

![Hình 4.21. Xem chi tiết, kết quả kiểm tra tự động, chấp thuận hoặc từ chối kèm lý do.](img/18-qtv-chi-tiet-duyet.png){ width=16cm }

![Hình 4.22. Đơn đã thanh toán nhưng lỗi phát hành vé: phát hành lại hoặc xác nhận căn cứ hoàn tiền.](img/19-qtv-loi-cung-cap-ve.png){ width=16cm }

### 4.4.5. Giao diện dành cho nhân viên CSKH

#### 4.4.5.1. Giao diện tiếp nhận và xử lý yêu cầu hỗ trợ

![Hình 4.23. Danh sách yêu cầu hỗ trợ.](img/20-cskh-ho-tro.png){ width=16cm }

![Hình 4.24. Trao đổi với khách hàng, cập nhật trạng thái (đang xử lý, yêu cầu bổ sung, chuyển xử lý, đã phản hồi, đóng) và tra cứu đơn liên quan.](img/21-cskh-xu-ly.png){ width=16cm }

#### 4.4.5.2. Giao diện xử lý và theo dõi hoàn tiền

![Hình 4.25. Kiểm tra và chuyển yêu cầu đến bên có thẩm quyền; thực hiện và theo dõi giao dịch hoàn tiền.](img/22-cskh-hoan-tien.png){ width=16cm }

### 4.4.6. Giao diện dành cho nhân sự check-in

![Hình 4.26. Quét QR bằng camera hoặc nhập mã thủ công; kết quả hợp lệ hiển thị loại vé và người tham dự.](img/24-checkin-ok.png){ width=16cm }

![Hình 4.27. Vé đã check-in bị từ chối và hiển thị thời điểm check-in trước đó.](img/25-checkin-tu-choi.png){ width=16cm }

![Hình 4.28. Giao diện trên màn hình điện thoại (YC-PCN-03).](img/26-mobile.png){ width=40% }

## 4.5. Tiểu kết chương 4

Chương 4 đã thiết kế cơ sở dữ liệu gồm 16 thực thể cùng các ràng buộc toàn vẹn, kiến trúc ba tầng, ma trận phân quyền theo vai trò và theo sự kiện, cùng giao diện cho sáu nhóm người sử dụng. Thiết kế được hiện thực thành bản demo web chạy được, bao phủ đầy đủ 24 Use Case đã phân tích ở Chương 3.

# CHƯƠNG 5. KẾT LUẬN

## 5.1. Kết quả đạt được

- Khảo sát và hệ thống hóa nghiệp vụ phân phối vé, quản lý sự kiện trên cơ sở tham khảo Ticketbox; phân biệt rõ thông tin khảo sát với quy ước của hệ thống đề xuất.
- Xác định 6 tác nhân, 22 yêu cầu chức năng, 10 yêu cầu phi chức năng và 24 Use Case; đặc tả chi tiết 8 Use Case trọng tâm.
- Thiết kế cơ sở dữ liệu, kiến trúc, phân quyền và giao diện.
- Xây dựng bản demo web (TicketGo) minh họa đầy đủ bốn quy trình chính: công bố sự kiện; đặt vé và thanh toán; check-in; hỗ trợ và hoàn tiền. Bản demo xử lý các tình huống ngoại lệ: không đủ vé, vượt giới hạn mua, thanh toán thất bại, đơn hết hạn, lỗi phát hành vé, check-in trùng, hoàn tiền thất bại, hủy sự kiện.
- Kết quả kiểm tra theo kịch bản (Phụ lục 5) cho thấy các luồng thực hiện đúng với đặc tả.

## 5.2. Hạn chế

- Dữ liệu lưu trên trình duyệt (localStorage); chưa có máy chủ và CSDL dùng chung giữa nhiều người dùng, chưa xử lý tranh chấp đồng thời khi nhiều khách đặt cùng lúc.
- Thanh toán, email và hoàn tiền được mô phỏng; chưa tích hợp cổng thanh toán thực tế.
- Mật khẩu được băm ở phía trình duyệt chỉ nhằm minh họa nguyên tắc; chưa đáp ứng tiêu chuẩn bảo mật cho môi trường vận hành.
- Chưa triển khai vé miễn phí, chọn ghế, khuyến mãi, hoàn một phần, check-in ngoại tuyến và đối soát ngân hàng.
- Chưa kiểm thử hiệu năng, khả năng chịu tải và bảo mật.

## 5.3. Hướng phát triển

- Xây dựng backend (ví dụ Node.js/Express hoặc Laravel) với CSDL quan hệ (PostgreSQL/MySQL) theo thiết kế tại mục 4.1, sử dụng giao dịch và khóa dòng để tạm giữ vé an toàn khi đặt đồng thời.
- Tích hợp cổng thanh toán (VNPay, MoMo…) qua webhook có kiểm tra chữ ký và xử lý idempotent.
- Gửi email/SMS vé điện tử; ký số mã QR để chống làm giả.
- Ứng dụng check-in trên di động hỗ trợ ngoại tuyến và đồng bộ.
- Bổ sung chọn ghế theo sơ đồ, vé miễn phí, mã giảm giá, hoàn một phần đơn và báo cáo đối soát.

# TÀI LIỆU THAM KHẢO

1. Ticketbox (2022), *Quy chế hoạt động sàn giao dịch thương mại điện tử Ticketbox*.
2. Ticketbox (2023), *Điều khoản sử dụng dành cho khách hàng*.
3. Ticketbox, *Thông tin giới thiệu ứng dụng TicketBox Event Manager* (Google Play / App Store).
4. Object Management Group (2014), *Business Process Model and Notation (BPMN) Version 2.0.2*.
5. Object Management Group (2017), *Unified Modeling Language (UML) Version 2.5.1*.
6. Dennis A., Wixom B. H., Roth R. M. (2018), *Systems Analysis and Design*, 7th ed., Wiley.

# PHỤ LỤC

## Phụ lục 1. Bảng đối chiếu yêu cầu và Use Case

| Yêu cầu | Use Case | Màn hình demo |
|---|---|---|
| YC-CN-01 Đăng ký tài khoản | UC-09 | `#/register` |
| YC-CN-02 Đăng nhập, đăng xuất | UC-10, UC-11 | `#/login`, nút Đăng xuất |
| YC-CN-03 Quản lý thông tin cá nhân | UC-12 | `#/profile` |
| YC-CN-04 Quản lý tài khoản, phân quyền | UC-13 | `#/admin/users` |
| YC-CN-05 Tìm kiếm, xem sự kiện | UC-14 | `#/`, `#/search`, `#/event/:id` |
| YC-CN-06 Quản lý sự kiện | UC-01, UC-15, UC-17 | `#/org/event/new`, `/edit`, tab Tổng quan (Hủy sự kiện) |
| YC-CN-07 Quản lý loại vé | UC-01, UC-16 | Bước 2 của trình soạn sự kiện |
| YC-CN-08 Kiểm duyệt sự kiện | UC-02 | `#/admin/review/:id` |
| YC-CN-09 Đặt vé | UC-03 | `#/book/:id` |
| YC-CN-10 Quản lý đơn hàng | UC-18, UC-19 | `#/my/orders`, nút Hủy đơn; tự động hết hạn |
| YC-CN-11 Xử lý thanh toán | UC-04 | `#/pay/:id` |
| YC-CN-12 Phát hành vé điện tử | UC-04 | `#/my/order/:id` |
| YC-CN-13 Quản lý vé đã mua | UC-20 | `#/my/order/:id` |
| YC-CN-14 Kiểm tra vé, check-in | UC-05 | `#/checkin/:id` |
| YC-CN-15 Quản lý thành viên | UC-21 | Tab Thành viên |
| YC-CN-16 Gửi yêu cầu hỗ trợ | UC-06 | `#/my/support` |
| YC-CN-17 Tiếp nhận, xử lý hỗ trợ | UC-06 | `#/cs/support/:id` |
| YC-CN-18 Gửi yêu cầu hoàn vé | UC-22 | `#/my/order/:id` |
| YC-CN-19 Xét duyệt, xác minh hoàn | UC-07, UC-23 | Tab Hoàn vé (BTC), `#/admin/ticket-errors` |
| YC-CN-20 Xử lý, theo dõi hoàn tiền | UC-08 | `#/cs/refunds` |
| YC-CN-21 Theo dõi hoạt động sự kiện | UC-24 | `#/org/event/:id` |
| YC-CN-22 Thông báo kết quả xử lý | UC-01, 02, 04, 06, 07, 08, 17 | Biểu tượng chuông 🔔 |

## Phụ lục 2. Từ điển dữ liệu

Bảng PL2.1. Trạng thái và ý nghĩa

| Thực thể | Giá trị | Ý nghĩa | Chuyển tiếp hợp lệ |
|---|---|---|---|
| SU_KIEN | BAN_NHAP | Đang soạn, chưa gửi | → CHO_DUYET |
| | CHO_DUYET | Đã gửi, chờ QTV | → DA_CONG_BO / BI_TU_CHOI |
| | BI_TU_CHOI | Có lý do từ chối, được sửa và gửi lại | → CHO_DUYET |
| | DA_CONG_BO | Hiển thị công khai, bán theo thời gian của loại vé | → DA_HUY |
| | DA_HUY | Dừng bán, vô hiệu vé | (kết thúc) |
| DON_HANG | CHO_THANH_TOAN | Đã tạo, đang tạm giữ vé | → DA_THANH_TOAN / DA_HUY / HET_HAN |
| | DA_THANH_TOAN | Có kết quả thanh toán thành công | (hoàn tiền theo dõi riêng) |
| | DA_HUY, HET_HAN | Đã giải phóng lượng tạm giữ | (kết thúc) |
| VE_DIEN_TU | CON_HIEU_LUC | Có thể check-in | → DA_SU_DUNG / VO_HIEU |
| | DA_SU_DUNG | Đã check-in thành công | (kết thúc) |
| | VO_HIEU | Do hoàn tiền hoặc hủy sự kiện | (kết thúc) |
| YEU_CAU_HOAN_VE | CHO_CSKH → CHO_BTC / CHO_QTV → CHAP_THUAN / TU_CHOI → DANG_HOAN → DA_HOAN | Luồng xử lý hoàn vé | Theo UC-22, 07, 23, 08 |
| YEU_CAU_HO_TRO | MOI, DANG_XU_LY, CHO_BO_SUNG, DA_CHUYEN, DA_PHAN_HOI, DA_DONG | Trạng thái hỗ trợ | Do CSKH cập nhật |

Bảng PL2.2. Thuộc tính tính toán

| Thuộc tính | Công thức |
|---|---|
| Số lượng khả dụng | SoLuongPhanBo − DangGiu − DaBan |
| Tổng tiền đơn | Σ SoLuong × DonGia (đơn giá tại thời điểm tạo đơn) |
| Số tiền hoàn | Σ SoTien các giao dịch thanh toán thành công của đơn |
| Doanh thu sự kiện | Σ TongTien các đơn DA_THANH_TOAN (hoàn tiền thống kê riêng) |

## Phụ lục 3. Biểu mẫu và quy tắc kiểm tra dữ liệu đầu vào

| Biểu mẫu | Trường | Quy tắc | Thông báo lỗi |
|---|---|---|---|
| Đăng ký | Họ tên | ≥ 2 ký tự | Họ tên phải có ít nhất 2 ký tự. |
| | Email | Đúng định dạng, chưa được sử dụng | Email không đúng định dạng / Email đã được sử dụng. |
| | Số điện thoại | 10 chữ số, bắt đầu bằng 0 | Số điện thoại gồm 10 chữ số, bắt đầu bằng 0. |
| | Mật khẩu | ≥ 6 ký tự, trùng xác nhận | Mật khẩu phải có ít nhất 6 ký tự / không khớp. |
| Đăng nhập | Email, mật khẩu | Khớp tài khoản, tài khoản không bị khóa | Email hoặc mật khẩu không đúng / Tài khoản đã bị khóa. |
| Sự kiện | Tên | ≥ 5 ký tự (gửi duyệt) | Tên sự kiện tối thiểu 5 ký tự. |
| | Thời gian | Bắt đầu ở tương lai; kết thúc > bắt đầu | Thời gian kết thúc phải sau thời gian bắt đầu. |
| | Mô tả | ≥ 20 ký tự | Mô tả tối thiểu 20 ký tự. |
| | Loại vé | ≥ 1 loại vé | Cần ít nhất một loại vé. |
| Loại vé | Giá | > 0 | Giá bán phải lớn hơn 0. |
| | Số lượng | Số nguyên dương; ≥ đang giữ + đã bán | Không thể giảm số lượng xuống dưới … |
| | Giới hạn mua | 1 ≤ tối thiểu ≤ tối đa | Giới hạn mua: tối thiểu ≥ 1 và tối đa ≥ tối thiểu. |
| | Thời gian bán | Kết thúc bán > bắt đầu bán; ≤ giờ bắt đầu sự kiện | Thời gian kết thúc bán phải trước thời điểm sự kiện bắt đầu. |
| Đặt vé | Số lượng | Trong giới hạn mua, ≤ khả dụng, đang mở bán | “…” chỉ còn N vé / mỗi đơn mua từ a đến b vé / chưa mở bán. |
| | Người tham dự | Họ tên, email, SĐT hợp lệ | Vui lòng nhập họ tên / Email / SĐT không hợp lệ. |
| Từ chối duyệt / hoàn | Lý do | ≥ 5 ký tự | Phải nhập lý do từ chối. |
| Hoàn vé | Lý do | ≥ 10 ký tự; đơn đã TT, chưa check-in, không có yêu cầu đang xử lý | Lý do tối thiểu 10 ký tự / Đơn đã có vé được check-in… |
| Hỗ trợ | Tiêu đề, nội dung | ≥ 5 / ≥ 10 ký tự; gắn với đơn của mình | Tiêu đề tối thiểu 5 ký tự… |
| Check-in | Mã vé | Tồn tại, đúng sự kiện, còn hiệu lực, chưa sử dụng, đúng phân công | Mã vé không tồn tại / không thuộc sự kiện / đã check-in / đã vô hiệu. |

## Phụ lục 4. Luồng liên kết các màn hình giao diện

```
Trang chủ ─┬─ Tìm kiếm ── Chi tiết sự kiện ── [Đăng nhập] ── Đặt vé ── Thanh toán ─┬─ Chi tiết đơn (vé QR)
           │                                                                     ├─ (thất bại) → Thanh toán lại
           │                                                                     └─ (hủy/hết hạn) → Danh sách đơn
           ├─ Vé của tôi ── Chi tiết đơn ─┬─ Yêu cầu hoàn vé
           │                              └─ Gửi hỗ trợ ── Hỗ trợ của tôi ── Chi tiết hỗ trợ
           └─ Đăng nhập / Đăng ký ── Hồ sơ cá nhân

BTC:   Sự kiện của tôi ─┬─ Tạo sự kiện (1 Thông tin → 2 Loại vé → 3 Gửi duyệt)
                        └─ Quản lý sự kiện: Tổng quan | Đơn hàng | Người tham dự | Thành viên | Hoàn vé
QTV:   Kiểm duyệt ── Chi tiết duyệt | Tài khoản & quyền | Lỗi cung cấp vé | Nhật ký
CSKH:  Yêu cầu hỗ trợ ── Chi tiết xử lý | Hoàn vé / hoàn tiền ── Lịch sử
Check-in: Chọn sự kiện ── Màn hình quét/nhập mã ── Kết quả + Lịch sử
```

## Phụ lục 5. Kịch bản minh họa và đánh giá giao diện

Kịch bản chi tiết từng bước, kèm giải thích nghiệp vụ, được trình bày trong tài liệu `docs/KICH_BAN_DEMO.md`. Bảng dưới tổng hợp kết quả chạy thử.

| Mã | Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|---|
| KB-01 | BTC tạo sự kiện, thêm loại vé, gửi duyệt | Trạng thái Chờ duyệt, QTV nhận thông báo | Đạt |
| KB-02 | QTV từ chối không nhập lý do | Báo lỗi, không đổi trạng thái | Đạt |
| KB-03 | QTV từ chối có lý do → BTC sửa, gửi lại → QTV duyệt | Bị từ chối → Chờ duyệt → Đã công bố | Đạt |
| KB-04 | Khách đặt vượt giới hạn / vượt khả dụng | Báo lỗi, không tạo đơn, không tạm giữ | Đạt |
| KB-05 | Khách đặt vé hợp lệ | Tạo đơn chờ TT, tăng “đang giữ” | Đạt |
| KB-06 | Thanh toán thất bại rồi thành công | Lần 1 ghi nhận thất bại; lần 2 phát hành đủ vé QR | Đạt |
| KB-07 | Tua thời gian quá hạn | Đơn hết hạn, giải phóng tạm giữ | Đạt |
| KB-08 | Khách hủy đơn chưa thanh toán | Đơn Đã hủy, giải phóng tạm giữ | Đạt |
| KB-09 | Check-in mã hợp lệ, rồi nhập lại | Lần 1 thành công; lần 2 bị từ chối “đã check-in” | Đạt |
| KB-10 | Check-in mã của sự kiện khác / không tồn tại | Từ chối kèm lý do | Đạt |
| KB-11 | Hoàn vé theo chính sách: Khách → CSKH → BTC → CSKH | Vé vô hiệu, đơn Đã hoàn tiền, không hoàn lặp | Đạt |
| KB-12 | Hoàn tiền thất bại rồi thành công | Lần 1 “Đang hoàn tiền”, vé không có hiệu lực lại; lần 2 hoàn tất | Đạt |
| KB-13 | Thanh toán thành công nhưng lỗi phát hành vé → QTV phát hành lại | Đơn hiện cảnh báo; sau xử lý có đủ vé, không trùng | Đạt |
| KB-14 | BTC hủy sự kiện | Đơn chưa TT bị hủy, vé vô hiệu, khách được thông báo | Đạt |
| KB-15 | Truy cập trang quản trị bằng tài khoản khách | Hiển thị “Không có quyền truy cập” | Đạt |
| KB-16 | Xem trên màn hình 390px | Không tràn ngang, thao tác chính đầy đủ | Đạt |

Đánh giá theo yêu cầu phi chức năng:

| Tiêu chí | Đánh giá |
|---|---|
| YC-PCN-01 Dễ sử dụng | Giao diện tiếng Việt, đánh dấu trường bắt buộc, thanh tiến trình các bước đặt vé, thông báo lỗi cụ thể. |
| YC-PCN-02 Nhất quán | Dùng chung bộ màu, nút, nhãn trạng thái và thuật ngữ trên mọi màn hình. |
| YC-PCN-03 Hiển thị | Bố cục co giãn từ 390px đến 1280px, không tràn ngang. |
| YC-PCN-05 Phân quyền | Kiểm tra quyền cả ở tuyến màn hình và ở hàm nghiệp vụ. |
| YC-PCN-06, 07 Toàn vẹn, tin cậy | Không âm khả dụng, không phát hành trùng, không check-in hai lần, không hoàn lặp (KB-04, 06, 09, 11). |
| YC-PCN-08 Truy vết | Nhật ký thao tác (QTV) và lịch sử xử lý hoàn vé. |
| YC-PCN-09 Xử lý lỗi | Không báo thành công khi thao tác chưa hoàn tất; hướng dẫn bước tiếp theo. |
