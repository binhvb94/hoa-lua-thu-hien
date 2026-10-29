# V1.3.9.2 — Đánh giá tổng hợp có nguồn, nhập thủ công 1–5 sao

## Nội dung
- 5 ô từ 1 sao đến 5 sao trong ADMIN > Sản phẩm > Sửa/Thêm; tự tính điểm bình quân và tổng đánh giá.
- Chỉ nhập số liệu thật từ các kênh khác (Fanpage, sàn TMĐT...) và khai báo nguồn khi số lượng khác 0.
- Trên website ghi rõ “đánh giá tổng hợp từ [nguồn] (cửa hàng nhập)” để phân biệt với đánh giá xác thực bằng đơn hàng.
- Đánh giá xác thực/kiểm duyệt và thống kê đơn đã giao vẫn giữ nguyên, độc lập.
- Không đưa số sao tổng hợp do ADMIN nhập vào AggregateRating JSON-LD của Google.

## Cập nhật (GitHub giới hạn 100 file)
1. Sao lưu D1 và tải bản sao GitHub cũ.
2. D1 Console: chạy đúng một lần `migrations/0009_console_copy.sql`.
3. Giải nén **bản vá** và tải toàn bộ file bên trong vào thư mục gốc GitHub. Các file trùng đường dẫn sẽ thay thế bản cũ.
4. Commit lên `main`, kiểm tra Cloudflare Pages Deployment Success, Ctrl+Shift+R.
5. ADMIN > Sản phẩm > Sửa > nhập số đánh giá 1–5 sao và nguồn (nếu có), bấm Lưu sản phẩm.
6. Kiểm tra trang sản phẩm, danh mục và trang chủ.

### Thử mẫu
5 sao: 10, 4 sao: 4, còn lại: 0 => (5*10+4*4)/14 = 4,71/5 (14 đánh giá).
Nếu không có đánh giá từ kênh khác, để tất cả = 0; khi đó chỉ đánh giá xác thực từ đơn hàng mới được hiển thị.

*Lưu ý*: Số sao tự nhập chỉ nên dùng với dữ liệu có nguồn thật. Không nhập số lượng người đánh giá giả vì dễ gây hiểu lầm và có thể vi phạm chính sách quảng cáo/quy định bảo vệ người tiêu dùng.
