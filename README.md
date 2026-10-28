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
