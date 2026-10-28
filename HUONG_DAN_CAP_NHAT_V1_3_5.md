# HOA LỤA THU HIỀN V1.3.5 – SEO TỰ ĐỘNG TỪ D1

**Phiên bản nâng cấp từ V1.3.4**, không đổi database và không xóa đơn hàng, người đăng ký hoặc nội dung CMS/Pixel.

## Bước 0 – Sao lưu

- Vào GitHub repository `binhvb94/hoa-lua-thu-hien` > **Code > Download ZIP** để sao lưu mã nguồn đang chạy.
- Cloudflare D1 > `hoa-lua-thu-hien-db` > **Export Data** để sao lưu cơ sở dữ liệu, đặc biệt quan trọng nếu đang nhận đơn thật.
- Không sửa Secret ADMIN, bindings `DB` và `PRODUCT_IMAGES`, hoặc hai biến `ENABLE_ORDERS`, `ENABLE_REGISTRATION`.

## Bước 1 – Nâng cấp D1 (chỉ chạy MỘT LẦN)

Mở **Cloudflare D1 > hoa-lua-thu-hien-db > Console**. Mở `migrations/0005_console_copy.sql`, sao chép *chỉ nội dung SQL*, dán vào ô nhập dưới cùng, bấm **Execute**. File này có 2 câu `ALTER TABLE` và 1 câu `CREATE INDEX`, không xóa dữ liệu.

Nếu Console hỗ trợ từng câu một, chạy lần lượt:

```sql
ALTER TABLE products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
```

```sql
ALTER TABLE products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
```

```sql
CREATE INDEX IF NOT EXISTS idx_products_seo_index ON products(is_deleted,is_active,is_sample,updated_at);
```

Nếu gặp lỗi **duplicate column name**, có khả năng câu lệnh đó đã được chạy trước đó. ĐỪNG tạo database mới; kiểm tra bằng:

```sql
PRAGMA table_info(products);
```

Kết quả cần có `seo_title` và `seo_description`. Chỉ chạy câu còn thiếu.

## Bước 2 – Cập nhật GitHub

- Giải nén `Hoa_Lua_Thu_Hien_V1_3_5_SEO_Toan_Dien_FULL.zip`.
- Vào repository `https://github.com/binhvb94/hoa-lua-thu-hien` > **Add file > Upload files**.
- Tải toàn bộ file **bên trong** thư mục giải nén vào thư mục gốc repository (không upload nguyên ZIP hay thư mục cha). Các file cũ trùng đường dẫn sẽ được thay nội dung; những file không có trong ZIP không tự mất.
- Bấm **Commit changes** lên branch `main`; vào Cloudflare Pages > `hoa-lua-thu-hien` > Deployments và đợi **Success**.
- Lưu ý giữ nguyên cấu trúc thư mục `functions/`, `lib/`, `admin/`, `data/`, `migrations/`.

**Thứ tự quan trọng: chạy migration D1 trước, rồi mới cập nhật GitHub.**

## Bước 3 – Kiểm tra sau triển khai

Truy cập các URL:

1. `https://hoaluathuhien.shop/` — trang chủ, giỏ hàng và chức năng cũ vẫn chạy.
2. `https://hoaluathuhien.shop/robots.txt` — có dòng `Sitemap: https://hoaluathuhien.shop/sitemap.xml`.
3. `https://hoaluathuhien.shop/sitemap.xml` — XML chứa URL trang chủ và các sản phẩm đang bán, không phải sản phẩm mẫu.
4. `https://hoaluathuhien.shop/danh-muc/hoa-lua/` — trang danh mục HTML.
5. `https://hoaluathuhien.shop/admin/` > **Sản phẩm** > một sản phẩm đang bán > **Xem trang SEO ↗**.
6. `https://hoaluathuhien.shop/admin/` > **Nội dung website** > **Cấu hình SEO trang chủ** — sửa Title, Description rồi lưu nháp, xem trước, xuất bản.

**Lưu ý:** 9 sản phẩm demo ban đầu không được đưa vào sitemap và được đánh dấu `noindex` cho tới khi bạn sửa sản phẩm thực tế trong ADMIN. Cả sản phẩm ẩn/xóa đều không công khai trên trang SEO.

## Bước 4 – Gửi sitemap cho Google Search Console

Vào property **hoaluathuhien.shop** đã xác minh > **Sơ đồ trang web (Sitemaps)** > thêm URL `sitemap.xml` > Gửi. Tiếp theo mở **Kiểm tra URL**, nhập đường dẫn `/san-pham/.../` của một sản phẩm thật và yêu cầu lập chỉ mục nếu phù hợp. Google có thể mất nhiều ngày hoặc tuần để xử lý và không đảm bảo sẽ lập chỉ mục toàn bộ URL.

## Tự động SEO khi thêm sản phẩm

- Đăng nhập ADMIN > **Sản phẩm** > Thêm sản phẩm.
- Điền tên, đường dẫn (`slug`), ảnh, giá, mô tả, chất liệu và kích thước.
- Hai trường **Tiêu đề SEO** và **Mô tả SEO** có thể để trống: hệ thống sẽ tự lấy tên/mô tả để tạo SEO.
- Bật **Hiển thị trên website** và lưu. Trang sản phẩm `/san-pham/<slug>/` xuất hiện ngay; sitemap cập nhật theo D1.
- Đổi slug sẽ đổi URL. Nếu đã chia sẻ URL cũ, nên tránh đổi hoặc bổ sung redirect thủ công; V1.3.5 chưa tự tạo redirect slug cũ.

## Giữ nguyên các nghiệp vụ

Bản này giữ nguyên `ENABLE_ORDERS`, `ENABLE_REGISTRATION`, Pixel (chỉ sau khi đồng ý), CMS nháp/xuất bản, D1/R2, giỏ hàng COD và danh sách Đơn hàng/Khách hàng. Trang SEO có nút **Xem sản phẩm và thêm vào giỏ hàng** dẫn về cửa sổ mua hàng đang hoạt động trên trang chủ.

## Chú ý vận hành

- Nếu trang chủ, trang sản phẩm hoặc `/sitemap.xml` trả 503, mở Cloudflare Pages **Real-time Logs** để xem lỗi; kiểm tra đã chạy đủ migration 0005.
- Các mục hiển thị trên Google phụ thuộc quá trình thu thập/lập chỉ mục và chất lượng nội dung; trang có schema không đồng nghĩa chắc chắn xuất hiện kết quả giàu thông tin.
- Ở V1.3.5, chưa có tự động redirect 301 khi đổi slug hoặc hệ thống quản lý tồn kho chính xác. Không tự khai `InStock`, xếp hạng sao hay đánh giá nếu chưa có dữ liệu thật.
- SEO trang sản phẩm cập nhật ngay trong D1; cấu hình SEO *trang chủ* sử dụng quy trình CMS **Lưu nháp → Xem trước → Xuất bản**.
