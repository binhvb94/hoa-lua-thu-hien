# Hoa Lụa Thu Hiền V1.3.9.3 – Tổng hợp đánh giá từ các kênh

## Những gì thay đổi
- Bỏ ô nhập nguồn đánh giá trong ADMIN; không công bố tên nguồn trên website.
- Giữ 5 ô nhập số lượng theo mức sao, chỉ dùng cho đánh giá **có thật** từ các kênh bán ngoài website.
- Điểm hiển thị = trung bình có trọng số của đánh giá ngoài website được tổng hợp + đánh giá đơn đã giao được duyệt trên website.
- Ví dụ: 20 x 5 sao + 1 x 4 sao => 104/21 = 4,95; thêm 1 x 4 sao từ đơn đã giao => 108/22 = 4,91.
- Gắn nhãn công khai “đánh giá tổng hợp” khi có số liệu ngoài website để tránh diễn đạt nhầm tất cả là đánh giá xác thực tại website.
- Dữ liệu cũ của bảng D1, sản phẩm và đơn hàng không thay đổi. Cột `external_rating_source` giữ tương thích với SQL số 9 nhưng không cần nhập nữa.
- Không dùng điểm đánh giá tổng hợp nhập tay trong `AggregateRating` JSON-LD gửi Google.

## Triển khai
1. Sao lưu GitHub và D1.
2. **Không cần SQL mới** nếu đã dùng V1.3.9.2 và chạy SQL số 9.
3. Giải nén ZIP bản vá. Tải các file bên trong vào gốc GitHub bằng `Add file → Upload files` và Commit lên nhánh `main`.
4. Chờ Cloudflare Pages Deployments báo `Success`.
5. Ctrl + Shift + R → ADMIN → Sản phẩm → Sửa; thử nhập các mức sao, kiểm tra điểm tổng hợp và lưu sản phẩm.
6. Kiểm tra trang chủ, danh mục, trang SEO sản phẩm, giỏ hàng, CMS, Pixel và đơn hàng.

**Chỉ nhập số đánh giá thực có bằng chứng từ khách hàng. Không sử dụng để tạo đánh giá giả.**
