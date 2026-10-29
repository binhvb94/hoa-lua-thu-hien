# Hoa Lụa Thu Hiền V1.3.9.1 – Ô lượt bán hiển thị do ADMIN nhập

Trong **Thêm / Sửa sản phẩm** có thêm **Lượt bán hiển thị**. Nhập `4725` → web hiển thị `4.725 lượt bán` tại trang chủ, danh mục, trang SEO sản phẩm và mục Đề xuất. Con số này không tự lấy từ đơn COD; thống kê đơn thật và đánh giá xác thực vẫn độc lập.

**Cần chạy migration `migrations/0008_console_copy.sql` trên Cloudflare D1 một lần trước khi đưa mã nguồn mới lên GitHub.** Đọc `HUONG_DAN_CAP_NHAT_V1_3_9_1.md` để nâng cấp và xem ghi chú về công bố số liệu chính xác.

---

# Hoa Lụa Thu Hiền V1.3.9

Bản nâng cấp từ V1.3.8: **Đề xuất cho bạn** tối đa 8 sản phẩm ở trang chi tiết SEO (bán chạy, đánh giá cao, từ khóa tương tự, kết hợp); hiện số bán **thực tế từ đơn đã giao** và điểm trung bình từ **đánh giá thật của người mua có đơn đã giao**.

⚠️ Không tạo số lượt bán hoặc đánh giá giả. ADMIN xem, duyệt hoặc ẩn đánh giá thật; không nhập số sao tùy ý.

**Thứ tự triển khai:** Backup D1 và GitHub → chạy `migrations/0007_console_copy.sql` đúng một lần trong Cloudflare D1 Console → upload toàn bộ mã nguồn V1.3.9 trên GitHub → kiểm tra Cloudflare Pages Production Success → thử đặt và chuyển đơn sang Đã giao, gửi đánh giá bằng mã đơn & SĐT và duyệt qua ADMIN.

Không tạo lại D1, R2, CMS, Pixel, không đụng tới danh sách người đăng ký nhận tin. Số bán thực tế được tính từ đơn của chính website (không gồm đơn từ các kênh khác).

# Hoa Lụa Thu Hiền V1.3.8

**Tham khảo `HUONG_DAN_CAP_NHAT_V1_3_8.md` để chạy migration số 6 trước khi upload toàn bộ mã nguồn.**

# Hoa Lụa Thu Hiền V1.3.7 – SEO ADMIN tập trung

Thêm mục **Quản lý SEO** vào ADMIN: tùy biến thẻ title/description/ảnh chia sẻ cho trang chủ và ba danh mục, xem trước nháp có bảo vệ, xuất bản qua CMS và quản lý SEO sản phẩm trong một nơi. **Không cần migration mới.** Duy trì toàn bộ chức năng V1.3.6. Xem `HUONG_DAN_CAP_NHAT_V1_3_7.md`.

---

# Hoa Lụa Thu Hiền V1.3.6 – URL sản phẩm chuẩn SEO + giỏ hàng dùng chung

Nâng cấp không thay đổi database. Khắc phục link `#san-pham/...`, cho phép xem trang sản phẩm HTML độc lập và thêm vào giỏ trực tiếp; hỗ trợ `/?mo_gio=1` để mở giỏ hàng khi quay lại trang chủ. Giữ nguyên ADMIN, CMS, đơn hàng, khách đăng ký và Meta Pixel. Xem `HUONG_DAN_CAP_NHAT_V1_3_6.md` để triển khai.

---

# HOA LỤA THU HIỀN V1.3.5 — SEO TOÀN DIỆN

Bổ sung URL HTML riêng cho mỗi sản phẩm và danh mục, dữ liệu Product/Breadcrumb JSON-LD, sitemap XML tự động từ Cloudflare D1, robots.txt, canonical/OG/meta trang chủ từ CMS và trường SEO tùy chọn trong ADMIN. Giữ nguyên V1.3.4: đơn COD, khách đăng ký độc lập, Pixel, CMS và R2.

**Cập nhật:** đọc `HUONG_DAN_CAP_NHAT_V1_3_5.md`, chạy `migrations/0005_console_copy.sql` trên D1 trước, rồi upload toàn bộ mã nguồn lên GitHub nhánh `main`.

**Tự kiểm thử:** `npm run build` và `npm test` (Node.js 22+).

---

# HOA LỤA THU HIỀN — V1.3.4: ADMIN ĐƠN HÀNG + KHÁCH HÀNG

**Xem ngay file `HUONG_DAN_CAP_NHAT_V1_3_4.md` để triển khai an toàn.**

- Đơn hàng: từ giỏ hàng → đặt COD → bảng `orders`; hiển thị đầy đủ thông tin và bốn trạng thái Đặt hàng, Đang giao, Đã giao, Đơn hủy.
- Khách hàng: từ form đăng ký nhận tin → bảng `registrations`; độc lập tuyệt đối với đơn hàng, không tự ghép theo điện thoại hay email.
- Lịch sử trạng thái lưu trong `order_status_history` bằng trigger SQLite.
- Không xóa/chỉnh dữ liệu CMS, Pixel, sản phẩm đã có.
- Chạy `migrations/0004_console_copy.sql` trước khi cập nhật mã nguồn.
- **Chưa tự bật nhận đơn/đăng ký**: website còn ở previewMode theo V1.3.3. Xem bước 5 trong hướng dẫn.

---

# HOA LỤA THU HIỀN – V1.3.3 QUẢN LÝ META PIXEL TRONG ADMIN

Bản đầy đủ nâng cấp V1.3.2. Giữ nguyên quản lý sản phẩm, CMS nội dung website, chỉnh cỡ chữ banner, lưu nháp/xem trước/xuất bản. Thêm mục **Marketing & Meta Pixel** bên trong CMS.

**Không yêu cầu migration SQL mới.** Dùng D1/R2 và Secret hiện có.

Đọc `HUONG_DAN_PIXEL_ADMIN_V1_3_3.md` để triển khai và kiểm tra.

# HOA LỤA THU HIỀN V1.3.2 — BẢN ĐẦY ĐỦ, KHÔI PHỤC CMS

Đây là bộ mã nguồn **đầy đủ** gồm website khách hàng + ADMIN sản phẩm + ADMIN nội dung website + bản nháp/xem trước/xuất bản + điều chỉnh font banner theo thiết bị.

**Xem chi tiết:** `HUONG_DAN_KHOI_PHUC_CMS_V1_3_2.md`.

## Lệnh kiểm tra

```bash
npm run test
npm run check:cms
npm run build
```

Cloudflare Pages cấu hình: Framework None, build `npm run build`, output `dist`, nhánh `main`. Giữ nguyên D1 `DB`, R2 `PRODUCT_IMAGES` và Secret `ADMIN_PASSWORD_HASH` đang có.

**Không chạy lại migration để phục hồi menu bị mất.** Khôi phục menu là việc của mã nguồn và deployment. Dữ liệu nội dung/bản nháp đã lưu trong D1 không thay đổi.
