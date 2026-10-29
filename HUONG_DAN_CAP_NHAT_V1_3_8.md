# HOA LỤA THU HIỀN V1.3.8 – FAVICON / ẢNH CHIA SẺ / DANH MỤC ĐỘNG

## Bước 0 – Sao lưu trước khi cập nhật

- Vào GitHub `binhvb94/hoa-lua-thu-hien` > **Code > Download ZIP** để lưu V1.3.7.
- Sao lưu Cloudflare D1 database `hoa-lua-thu-hien-db` (export/backup) trước khi chạy SQL.
- Không sửa production nếu đang có đơn hàng chưa xử lý mà chưa sao lưu.

## Bước 1 – Chạy SQL 0006 trên Cloudflare D1 (bắt buộc)

Cloudflare > Storage & databases > D1 > `hoa-lua-thu-hien-db` > Console.

Mở `migrations/0006_console_copy.sql`, sao chép **toàn bộ nội dung**, dán vào Console, Execute. Chỉ cần chạy một lần.

SQL tạo hai bảng **product_categories** và **product_category_links**, tự đưa ba danh mục Hoa lụa/Hoa cao su/Hoa decor và các sản phẩm hiện có vào bảng liên kết. Không xóa bảng `products`, `orders`, `registrations`, `site_cms` hoặc dữ liệu R2.

Có thể kiểm tra sau khi chạy:

```sql
SELECT slug, name, is_active FROM product_categories ORDER BY sort_order;
SELECT COUNT(*) AS total_links FROM product_category_links;
```

## Bước 2 – Cập nhật GitHub

1. Giải nén ZIP V1.3.8.
2. Vào repository `binhvb94/hoa-lua-thu-hien` nhánh `main`.
3. **Add file > Upload files**: upload *toàn bộ nội dung bên trong* thư mục giải nén, không tải nguyên ZIP.
4. Commit `Hoa Lua Thu Hien V1.3.8 - SEO sitewide and dynamic categories`.
5. Trong Cloudflare Workers & Pages > `hoa-lua-thu-hien` > Deployments xác nhận **Production / Success**.
6. Mở `https://hoaluathuhien.shop/admin/`, bấm `Ctrl+Shift+R`.

Cấu hình hiện có tiếp tục dùng: D1 binding `DB`, R2 binding `PRODUCT_IMAGES`, ADMIN_PASSWORD_HASH, `ENABLE_ORDERS=true`, `ENABLE_REGISTRATION=true`. Giữ `previewMode:false` trong `config.js`.

## Bước 3 – Quản lý favicon và ảnh chia sẻ

ADMIN > **Quản lý SEO > SEO toàn site**:

- **Favicon**: nên tải PNG vuông 512 × 512 px, tối đa 5 MB. Upload lên R2 và **Lưu nháp SEO > Xem trước > Xuất bản**.
- **Ảnh chia sẻ mặc định**: nên dùng PNG/WebP/JPG kích thước 1200 × 630 px, tối đa 5 MB.
- **Tiêu đề/mô tả chia sẻ mặc định**: không nên dài hoặc trùng lặp quá mức.
- Ảnh chia sẻ riêng ở **SEO trang chủ** (socialImage), hoặc trong SEO danh mục, có thể ghi đè ảnh chia sẻ mặc định. Trang sản phẩm dùng ảnh sản phẩm riêng.

Lưu ý **Lưu nháp / Xuất bản** thuộc CMS chung. Bấm Xuất bản SEO sẽ xuất bản cả các thay đổi nội dung website đã lưu nháp.

Kiểm tra bằng **View Page Source** trên `https://hoaluathuhien.shop/`: tìm `rel="icon"`, `og:image`, `og:title`. Đừng chỉ nhìn DOM sau khi JavaScript chạy vì mạng xã hội đọc HTML phía máy chủ.

Sau khi thay ảnh, Facebook và Zalo có thể vẫn hiển thị ảnh cũ do bộ nhớ đệm; cần dùng Facebook Sharing Debugger hoặc công cụ làm mới tương ứng. Không bảo đảm bản xem trước sẽ thay đổi ngay lập tức.

## Bước 4 – Quản lý danh mục

ADMIN > **Danh mục**:

- **+ Thêm danh mục**: nhập tên, slug không dấu (URL sẽ là `/danh-muc/slug/`), mô tả, ảnh, SEO title/description/ảnh.
- **Sửa danh mục**: đổi tên, mô tả, ảnh, trạng thái. **Slug không đổi sau khi tạo** để giữ URL SEO ổn định.
- **Sản phẩm trong danh mục**: tích chọn sản phẩm, **Lưu sản phẩm trong danh mục**; 1 sản phẩm có thể thuộc nhiều danh mục. Muốn bỏ sản phẩm khỏi một danh mục, bỏ tick rồi lưu. Hệ thống không cho bỏ nếu đó là danh mục cuối cùng của sản phẩm.
- **Xóa danh mục**: nếu đang là danh mục chính của sản phẩm, phải chuyển danh mục chính ở mục **Sản phẩm** trước. Xóa chỉ ẩn và loại khỏi sitemap, **không xóa sản phẩm hay đơn hàng**. Có thể tạo lại đúng slug sau khi xóa để khôi phục danh mục.
- Ảnh và SEO của danh mục lưu trực tiếp vào D1, cập nhật website ngay, không thông qua CMS nháp. SEO 3 danh mục cũ ở CMS vẫn được dùng làm mặc định nếu bạn chưa nhập SEO riêng trong mục Danh mục.

Các danh mục đang hiển thị được đưa vào bộ lọc và thẻ danh mục trên trang chủ. Đường dẫn SEO riêng `/danh-muc/<slug>/` có HTML máy chủ. Sitemap chỉ liệt kê danh mục có ít nhất một sản phẩm thật đang bán; sản phẩm mẫu không được sitemap đưa lên.

## Kiểm tra sau triển khai

- Trang chủ, trang danh mục và trang sản phẩm riêng mở bình thường trên điện thoại/máy tính.
- ADMIN vẫn đủ mục: Sản phẩm, **Danh mục**, Đơn hàng, Khách hàng, Nội dung website, Quản lý SEO.
- Tạo 1 danh mục thử; thêm sản phẩm hiện có vào; kiểm tra `/danh-muc/slug/` chứa sản phẩm; bỏ chọn và kiểm tra thay đổi; xóa danh mục thử.
- Tải favicon và ảnh chia sẻ thử; xem trước; Xuất bản; kiểm tra HTML công khai.
- Tạo 1 đơn COD thử và 1 đăng ký nhận tin thử để chắc chức năng bán hàng cũ vẫn hoạt động.

## Khôi phục khi có lỗi

Nếu Cloudflare Production lỗi build, có thể rollback deployment trong Cloudflare sau khi xác định phiên bản. **Không xóa các bảng D1 mới** để tránh làm mất liên kết danh mục; rollback mã nguồn cũ có thể hoạt động khi D1 chứa thêm bảng.

Phiên bản này được build/test cục bộ, không có quyền tự triển khai vào tài khoản Cloudflare/GitHub của chủ website.
