# Kịch bản demo kèm giải thích

Tài liệu dùng khi trình bày bản demo trước giảng viên. Thời lượng gợi ý: **12–15 phút**. Mỗi bước gồm **thao tác** (làm gì), **kết quả** (màn hình hiển thị gì) và **giải thích** (bước đó minh họa quy tắc, yêu cầu hay Use Case nào trong đồ án).

## 0. Chuẩn bị

1. Mở trang demo (xem `README.md` để chạy).
2. Bấm **⚙ Công cụ demo → Khôi phục dữ liệu mẫu** để bắt đầu từ trạng thái sạch.
3. Tất cả tài khoản demo dùng mật khẩu **123456**. Ở trang Đăng nhập có sẵn nút đăng nhập nhanh theo vai trò.

| Tài khoản | Vai trò |
|---|---|
| khach@demo.vn | Khách hàng |
| btc@demo.vn | Đơn vị tổ chức |
| admin@demo.vn | Quản trị viên |
| cskh@demo.vn | Nhân viên CSKH |
| checkin@demo.vn | Nhân sự check-in (được phân công sự kiện “Đêm nhạc Jazz Hôm Nay” và “Đêm nhạc Mùa Thu Hà Nội”) |

> **Câu mở đầu gợi ý:** “Bản demo hiện thực hệ thống đề xuất ở Chương 2–4. Dữ liệu lưu trên trình duyệt. Thanh toán và hoàn tiền được mô phỏng, vì tích hợp cổng thanh toán nằm ngoài phạm vi đề tài (mục 5 Phần mở đầu). Em sẽ demo theo đúng bốn quy trình chính.”

---

## Phần A. Khách vãng lai tìm kiếm sự kiện (UC-14) – 1 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| A1 | Mở trang chủ khi chưa đăng nhập | Banner, danh sách sự kiện sắp diễn ra, nhóm theo thể loại | Khách vãng lai (ACT-01) xem được thông tin công khai. Chỉ sự kiện **Đã công bố** mới hiển thị (QTN-06). |
| A2 | Gõ “nhạc” vào ô tìm kiếm | Danh sách kết quả, lọc được theo thể loại | YC-CN-05. |
| A3 | Mở “Đêm nhạc Mùa Thu Hà Nội” | Thông tin vé: giá, giới hạn mua, số vé còn lại | QTN-07, QTN-08: mỗi loại vé có giá, số lượng, giới hạn mua và thời gian bán. |
| A4 | Mở “Lễ hội Ẩm thực Đường phố” | Vé hiển thị “Mở bán …”, nút mua bị khóa | Điều kiện đặt vé: loại vé phải **đang trong thời gian mở bán** (quy ước 2.2.2). |

## Phần B. Quy trình 1: Công bố sự kiện (UC-01, UC-16, UC-02) – 3 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| B1 | Đăng nhập **btc@demo.vn** → **+ Tạo sự kiện** | Trình soạn 3 bước | Chỉ tài khoản được QTV cấp vai trò Đơn vị tổ chức mới tạo được sự kiện. |
| B2 | Chỉ nhập tên rồi bấm **Lưu bản nháp** | Lưu thành công, trạng thái **Bản nháp** | YC-CN-06: thông tin chưa hoàn thiện được lưu nháp. |
| B3 | Xem bước 3 | Nút “Gửi kiểm duyệt” bị khóa, có danh sách điều kiện còn thiếu | Hệ thống kiểm tra tính đầy đủ trước khi tiếp nhận yêu cầu công bố (QTN-05, 3.1a). |
| B4 | Điền đủ thông tin, **+ Thêm loại vé**, thử nhập giá = 0 | Báo lỗi “Giá bán phải lớn hơn 0” | Ràng buộc loại vé: giá > 0, số lượng nguyên dương, tối thiểu ≤ tối đa, ngừng bán trước giờ diễn. |
| B5 | Nhập đúng (ví dụ 200.000đ, số lượng 50) → Lưu → **Gửi kiểm duyệt** | Trạng thái **Chờ duyệt**; chuông thông báo của QTV tăng | Không sửa được khi đang chờ duyệt. QTV được thông báo (YC-CN-22). |
| B6 | Đăng nhập **admin@demo.vn** → Kiểm duyệt → mở sự kiện vừa gửi → bấm **Từ chối** khi chưa nhập lý do | Báo lỗi bắt buộc nhập lý do | YC-CN-08: từ chối phải có lý do. |
| B7 | Nhập lý do “Thiếu thông tin nghệ sĩ” → Từ chối | Sự kiện **Bị từ chối**; BTC nhận thông báo kèm lý do | BTC thấy lý do, được sửa và gửi lại (vòng lặp trong BPMN 3.1a). |
| B8 | BTC sửa, gửi lại → QTV **Chấp thuận** | Sự kiện **Đã công bố**, hiện ở trang chủ | Kết quả được thông báo trong cả hai trường hợp. |

## Phần C. Quy trình 2: Đặt vé và thanh toán (UC-03, UC-04, UC-19) – 4 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| C1 | Bấm **Mua vé ngay** khi chưa đăng nhập | Chuyển sang đăng nhập | Đặt vé yêu cầu xác thực (tiền điều kiện UC-03). |
| C2 | Đăng nhập **khach@demo.vn** → “Đêm nhạc Mùa Thu” → **Mua vé ngay** | Màn hình chọn vé, thông tin người tham dự được điền sẵn | QTN-09: cung cấp thông tin người tham dự. |
| C3 | Chọn **Vé VVIP (gần hết)** số lượng 3 → Xác nhận | Báo lỗi “mỗi đơn mua từ 1 đến 2 vé” | QTN-07: giới hạn mua. **Không tạo đơn, không tạm giữ** (hậu điều kiện thất bại của UC-03). |
| C4 | Chọn Vé Thường × 2 + VIP × 1 → Xác nhận | Tạo mã đơn, đồng hồ đếm ngược 15 phút | Tạo đơn **Chờ thanh toán** và **tạm giữ** vé; đơn giá chốt tại thời điểm tạo đơn. |
| C5 | (Tùy chọn) Mở tab BTC → Quản lý sự kiện | Cột “Đang giữ” tăng 2 và 1 | Khả dụng = Phân bổ − Đang giữ − Đã bán. |
| C6 | Bấm **✖ Thanh toán thất bại** | Thông báo thất bại, vẫn ở trang thanh toán, ghi số lần thất bại | YC-CN-11: được thử lại khi đơn còn hiệu lực. |
| C7 | Bấm **✔ Thanh toán thành công** | Chuyển sang chi tiết đơn với **3 vé điện tử**, mỗi vé có QR riêng | Đang giữ chuyển thành Đã bán; phát hành đúng số lượng, mỗi vé một mã định danh (YC-CN-12, QTN-10, QTN-12). |
| C8 | Đặt một đơn mới → **⚙ Công cụ demo → Tua thời gian +16 phút** | Đơn chuyển **Hết hạn**, vé tạm giữ được giải phóng | Trước khi đánh dấu hết hạn, hệ thống kiểm tra đơn chưa có thanh toán thành công (quy ước 2.2.2). |
| C9 | Đặt đơn mới → **Hủy đơn** | Đơn **Đã hủy**, giải phóng tạm giữ | UC-19. Đơn đã thanh toán **không** có nút hủy (QTN-16). Sau đó nhớ “Đặt lại đồng hồ”. |

## Phần D. Quy trình 3: Check-in (UC-21, UC-05) – 2 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| D1 | BTC → sự kiện → tab **Thành viên** → thêm `checkin@demo.vn` quyền Nhân sự check-in | Thêm thành công | QTN-04, YC-CN-15: phân quyền check-in **theo từng sự kiện**. |
| D2 | Đăng nhập **checkin@demo.vn** → Check-in → “Đêm nhạc Jazz Hôm Nay” | Màn hình quét QR và nhập mã | Chỉ thấy sự kiện được phân công. |
| D3 | Bấm một mã vé mẫu (hoặc **Bật camera** và quét QR trên điện thoại) → Kiểm tra | ✅ **Check-in thành công**, hiện loại vé và người tham dự | QTN-15: quét QR hoặc nhập thủ công. Vé chuyển **Đã check-in**. |
| D4 | Kiểm tra lại đúng mã đó | ⛔ **Từ chối – Vé đã được check-in lúc …** | Mỗi vé chỉ check-in thành công một lần (YC-PCN-07). |
| D5 | Nhập mã của sự kiện khác, hoặc mã bất kỳ | ⛔ “Vé không thuộc sự kiện này” / “Mã vé không tồn tại” | Kiểm tra đúng sự kiện và sự tồn tại của vé. Mọi lượt kiểm tra đều được ghi lịch sử (YC-PCN-08). |

## Phần E. Quy trình 4: Hỗ trợ và hoàn tiền (UC-06, UC-22, UC-07, UC-08, UC-23) – 4 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| E1 | **khach** → Vé của tôi → đơn đã thanh toán của “Đêm nhạc Mùa Thu” (chưa check-in) → **Yêu cầu hoàn vé toàn bộ đơn**, nhập lý do | Yêu cầu ở trạng thái **Chờ CSKH kiểm tra** | YC-CN-18. Chỉ hoàn **toàn bộ đơn**, đơn đã thanh toán, **chưa có vé check-in**, không trùng yêu cầu đang xử lý. |
| E2 | Mở đơn đã check-in ở phần D | Không có nút hoàn, hiển thị lý do | Kiểm tra điều kiện tiếp nhận. |
| E3 | **cskh** → Hoàn vé/hoàn tiền → **Kiểm tra & chuyển BTC** | Trạng thái **Chờ BTC xét duyệt**; BTC nhận thông báo | QTN-17, QTN-19: CSKH tiếp nhận, BTC quyết định theo chính sách sự kiện. |
| E4 | **btc** → Quản lý sự kiện → tab **Hoàn vé** → Từ chối khi chưa nhập lý do | Báo lỗi | Từ chối phải có lý do và được thông báo cho khách hàng. |
| E5 | BTC **Chấp thuận** | Trạng thái **Đã chấp thuận**; CSKH nhận thông báo | Quyết định xét duyệt được ghi nhận riêng với kết quả giao dịch hoàn tiền. |
| E6 | **cskh** → **Mô phỏng thất bại** | **Đang hoàn tiền**; vé đã bị vô hiệu | Giao dịch chưa hoàn tất được tiếp tục theo dõi; vé **không tự động có hiệu lực trở lại**. |
| E7 | **cskh** → **Hoàn tiền: thành công** | **Đã hoàn tiền**, số tiền bằng số đã thanh toán; khách nhận thông báo | Không thể hoàn lặp (YC-CN-20). Bấm “Lịch sử” để xem dòng thời gian. |
| E8 | **khach** → Hỗ trợ của tôi → Gửi yêu cầu → **cskh** phản hồi với trạng thái “Yêu cầu bổ sung thông tin” | Khách thấy phản hồi và trạng thái | UC-06: tiếp nhận, phân loại, yêu cầu bổ sung, phản hồi. |
| E9 | **admin** → **Lỗi cung cấp vé** → đơn “Kịch nói” → **Phát hành lại vé** | Khách nhận đủ vé, không bị trùng | Lỗi phát hành tạm thời **không tự động** dẫn đến hoàn tiền. Nếu không thể cung cấp vé, QTV xác nhận căn cứ hoàn (UC-23), độc lập với quyết định của BTC. |

## Phần F. Quản trị và các tình huống bổ sung – 1 phút

| # | Thao tác | Kết quả | Giải thích |
|---|---|---|---|
| F1 | **admin** → Tài khoản & quyền → cấp vai trò Đơn vị tổ chức cho một khách hàng → Lưu | Tài khoản đó thấy menu “Sự kiện của tôi” | UC-13. |
| F2 | **admin** → Khóa tài khoản `khach@demo.vn` → thử đăng nhập | “Tài khoản đã bị khóa” | QTN-03. Nhớ mở khóa lại. |
| F3 | Đang đăng nhập **khach**, gõ `#/admin/users` vào thanh địa chỉ | “Không có quyền truy cập” | YC-PCN-05: kiểm tra quyền ở cả màn hình và hàm nghiệp vụ. |
| F4 | **btc** → “Kịch nói: Chuyến tàu cuối” → **Hủy sự kiện** (nhập lý do) | Dừng bán, đơn chưa thanh toán bị hủy, vé vô hiệu, khách nhận thông báo | UC-17. Sự kiện đã hủy **không** có nghĩa các khoản hoàn đã hoàn tất. |
| F5 | **admin** → **Nhật ký** | Danh sách thao tác có người thực hiện và thời điểm | YC-PCN-08: khả năng truy vết. |

---

## Câu hỏi giảng viên có thể hỏi và gợi ý trả lời

**Hỏi: Nếu hai người cùng mua vé cuối cùng thì sao?**
Đáp: Thiết kế quy định kiểm tra lại số lượng khả dụng tại thời điểm xác nhận rồi mới tạo đơn và tạm giữ. Khi triển khai thật trên CSDL, thao tác này chạy trong một giao dịch có khóa dòng `LOAI_VE` (hoặc dùng câu lệnh `UPDATE … SET DangGiu = DangGiu + n WHERE SoLuongPhanBo - DangGiu - DaBan >= n`), nên người đến sau nhận thông báo không đủ vé. Bản demo chạy trên một trình duyệt nên chưa minh họa tranh chấp đồng thời; đây là hạn chế đã nêu ở mục 5.2.

**Hỏi: Tại sao cần trạng thái “tạm giữ”?**
Đáp: Để khách đang thanh toán không bị người khác mua mất vé, đồng thời vé không bị khóa vĩnh viễn khi khách bỏ dở, vì quá hạn thì hệ thống giải phóng.

**Hỏi: Cổng thanh toán gửi kết quả thành công 2 lần thì sao?**
Đáp: Hàm `pay` kiểm tra đơn đã có giao dịch thành công thì trả về kết quả cũ, không phát hành thêm vé. Hàm phát hành vé chỉ tạo phần còn thiếu theo chi tiết đơn.

**Hỏi: Vì sao BTC duyệt hoàn mà CSKH lại thực hiện hoàn tiền?**
Đáp: Theo QTN-17, BTC quyết định theo chính sách của họ. Theo QTN-19, CSKH của nền tảng tiếp nhận và xử lý. Tách quyết định khỏi thực hiện giúp truy vết và tránh xung đột lợi ích.

**Hỏi: Khác biệt giữa hoàn theo chính sách và hoàn do lỗi cung cấp vé?**
Đáp: Hoàn theo chính sách do BTC quyết định. Lỗi cung cấp vé thuộc trách nhiệm nền tảng (QTN-18), nên QTV xác minh, không phụ thuộc quyết định của BTC.

**Hỏi: Dữ liệu lưu ở đâu?**
Đáp: Bản demo lưu trong localStorage của trình duyệt. Cấu trúc dữ liệu tương ứng các bảng ở mục 4.1, nên có thể chuyển sang CSDL quan hệ khi phát triển tiếp.
