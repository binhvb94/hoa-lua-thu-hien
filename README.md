# HOA LỤA THU HIỀN V1.3 – CMS: LƯU NHÁP / XEM TRƯỚC / XUẤT BẢN

Nâng cấp trực tiếp từ website V1.2.1 đang vận hành trên Cloudflare Pages.

**Xem file `HUONG_DAN_CAP_NHAT_V1_3.md` để cập nhật an toàn.**

Điểm mới: mục **Nội dung website** trong `/admin/`, chỉnh nội dung theo nhóm; `Lưu bản nháp`, `Xem trước` riêng cho ADMIN, `Xuất bản website` và `Hủy bản nháp`. Cơ chế bản nháp chỉ áp dụng nội dung giao diện; **sản phẩm vẫn được áp dụng ngay khi lưu**, như V1.2.

Cần chạy `migrations/0003_site_cms.sql` trên D1 **TRƯỚC KHI** upload mã nguồn mới. Không tạo Cloudflare Account, Pages Project, D1, R2 hoặc Secret mới. Tất cả tính năng đặt hàng, giỏ hàng và Pixel giữ cơ chế cũ.

- API public: `/api/site` chỉ trả dữ liệu đã xuất bản.
- API ADMIN: `/api/admin/site`, `/api/admin/site/draft`, `/api/admin/site/preview`, `/api/admin/site/publish`, `/api/admin/site/discard`.
- Bản xem trước: `/?cms_preview=1` (cần đăng nhập cùng tên miền).
- DB: `site_cms` + `site_publication_history`.
- Thử nghiệm: `node --test tests/site-cms.test.mjs`; build: `npm run build`.

Lưu ý: Bộ mã nguồn này chưa được tự động upload lên GitHub hoặc Cloudflare của bạn. Phải chạy migration và commit để đưa lên hệ thống đang chạy.
