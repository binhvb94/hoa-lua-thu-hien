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
