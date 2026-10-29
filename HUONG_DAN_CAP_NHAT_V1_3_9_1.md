# Hoa Lụa Thu Hiền V1.3.9.1 – Lượt bán hiển thị do ADMIN nhập

## Thay đổi

- Thêm **Lượt bán hiển thị (nhập thủ công)** trong ADMIN → Sản phẩm → Thêm/Sửa.
- Ví dụ nhập `4725`, nhấn Lưu sản phẩm, trang chủ, danh mục, trang SEO sản phẩm và các thẻ Đề xuất cho bạn đều hiển thị **4.725 lượt bán**.
- Đây là trường nhập riêng `products.display_sold_count` trong Cloudflare D1. **Không lấy từ số đơn đã giao, không tự tăng khi thay đổi trạng thái đơn**, không làm thay đổi đơn hàng hay báo cáo doanh số nội bộ.
- ADMIN vẫn xem được thống kê số sản phẩm từ đơn thực tế đã giao trong mục Thống kê đơn, và xem/duyệt đánh giá xác thực riêng.
- Chế độ Đề xuất “Bán chạy” ưu tiên con số do ADMIN nhập. Các chế độ Đánh giá cao và Liên quan không thay đổi.
- Nhập `0` nếu không muốn hiển thị số lượt bán. Giới hạn 0–999.999.999.

**Về tính chính xác:** con số công bố cho khách nên phản ánh tổng lượng bán thực tế có thể kiểm chứng (kể cả đơn từ Facebook, cửa hàng, sàn TMĐT). Việc tự nhập không đồng nghĩa hệ thống đã xác minh doanh số đó.

## Thứ tự cập nhật

1. Sao lưu bản đang chạy trên GitHub và sao lưu Cloudflare D1.
2. Vào **Cloudflare → D1 Database → hoa-lua-thu-hien-db → Console**, mở `migrations/0008_console_copy.sql`, dán và Execute **một lần**. Kết quả không trả bảng dữ liệu là bình thường.
3. Trong GitHub repo `binhvb94/hoa-lua-thu-hien` (nhánh `main`) dùng Add file → Upload files để tải toàn bộ thư mục/file bên trong bộ ZIP này lên đúng vị trí và Commit. Không upload ZIP nguyên khối vào repo.
4. Đợi Cloudflare Pages Production triển khai **Success**. Tải lại ADMIN bằng Ctrl + Shift + R.
5. Vào **Sản phẩm → Sửa** một sản phẩm, nhập `4725` ở **Lượt bán hiển thị**, bấm **Lưu sản phẩm**. Mở trang chủ, `/danh-muc/.../` và `/san-pham/.../` để kiểm tra `4.725 lượt bán`.

## Cần chú ý

- **Chạy SQL số 8 trước khi cập nhật GitHub.** Nếu mã mới deploy trước khi có cột `display_sold_count`, API sản phẩm sẽ lỗi.
- **Không chạy lại SQL số 7** nếu V1.3.9 đã hoạt động.
- SQL số 8 chỉ thêm 1 cột `INTEGER DEFAULT 0` vào bảng `products`, không xóa/đổi tên sản phẩm, danh mục, đơn hàng, CMS, Pixel hay đánh giá.
- Sau khi cập nhật, chỉ số hiển thị của sản phẩm cũ khởi đầu là 0; nhập thủ công để cập nhật.
- Không cần tạo lại Cloudflare D1, R2, biến Production hay tài khoản ADMIN.
- Phần đánh giá sao tiếp tục đến từ khách có đơn đã giao và được duyệt, không tạo đánh giá giả.

## Kiểm thử nội bộ

`npm run build` · `npm test` (29 bài kiểm thử, gồm kiểm thử lưu/sửa/đọc 4.725 lượt bán). Chưa triển khai trực tiếp trên Cloudflare Production.
