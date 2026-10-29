# Hoa Lụa Thu Hiền V1.3.9.4 – Gallery nhiều ảnh cho sản phẩm

## Chức năng
- ADMIN → Sản phẩm → Thêm / Sửa: tải nhiều ảnh JPG/PNG/WebP lên Cloudflare R2 (tối đa 12 ảnh/sản phẩm; mỗi ảnh tối đa 5 MB sau xử lý).
- Chọn **Làm ảnh bìa**, thay đổi thứ tự bằng ← / → hoặc **Xóa** từng ảnh khỏi bộ ảnh của sản phẩm.
- **Lưu sản phẩm** để cập nhật ảnh bìa và danh sách ảnh phụ vào Cloudflare D1.
- Trang SEO sản phẩm hiển thị ảnh lớn, thumbnail, chuyển ảnh, xem phóng lớn, điều khiển bằng bàn phím và vuốt trên điện thoại.
- Ảnh bìa tiếp tục dùng cho danh sách sản phẩm, giỏ hàng, và ảnh mặc định chia sẻ sản phẩm. Schema Product có danh sách ảnh (hữu ích cho SEO).
- Ảnh đã có từ V1.3.9.3 được giữ nguyên. Nếu chưa bổ sung ảnh phụ, sản phẩm vẫn hiển thị một ảnh như cũ.

## Bước 1 – Sao lưu
1. Sao lưu GitHub hiện tại bằng Code → Download ZIP.
2. Sao lưu D1 nếu có thể (Cloudflare D1 → Export Data).

## Bước 2 – Chạy SQL đúng một lần (trước khi cập nhật GitHub)
Mở Cloudflare → Storage & databases → D1 → `hoa-lua-thu-hien-db` → Console.

Dán nội dung file `migrations/0010_console_copy.sql`:

```sql
ALTER TABLE products ADD COLUMN gallery_images TEXT NOT NULL DEFAULT '[]';
```

Bấm Execute. Truy vấn kiểm tra:

```sql
SELECT id, image, gallery_images FROM products LIMIT 3;
```

Các sản phẩm hiện có phải có `gallery_images` = `[]`, còn `image` vẫn nguyên như trước. **Không chạy SQL 0010 lần thứ hai** (sẽ báo cột đã tồn tại).

## Bước 3 – Cập nhật GitHub
1. Chỉ giải nén **bản vá** `Hoa_Lua_Thu_Hien_V1_3_9_4_BAN_VA_GITHUB.zip` (không dùng gói FULL qua giao diện web).
2. GitHub → `binhvb94/hoa-lua-thu-hien` → Add file → Upload files.
3. Kéo **các thư mục và file nằm bên trong** ZIP đã giải nén, giữ nguyên đường dẫn (admin/, dist/, functions/, lib/, migrations/, tests/, ...).
4. Commit vào `main`. Cloudflare Pages tự build và deploy.
5. Đợi Cloudflare hiển thị Deployment **Success**, sau đó tải lại ADMIN bằng Ctrl+Shift+R.

## Bước 4 – Kiểm thử nhanh
1. ADMIN → Sản phẩm → Sửa sản phẩm đang có: xác nhận ảnh bìa vẫn hiện.
2. Tải thêm 2–3 ảnh. Chuyển ảnh thứ hai thành **Làm ảnh bìa**, dùng ← / → sắp xếp, xóa thử một ảnh phụ.
3. Bấm **Lưu sản phẩm** (chưa lưu thì website chưa cập nhật).
4. Mở trang `/san-pham/slug/`, xem thumbnail dưới ảnh, bấm chuyển ảnh và phóng lớn.
5. Kiểm tra mobile: vuốt ảnh để đổi ảnh; xem giỏ hàng/đặt COD như trước.
6. Kiểm tra trên trang danh sách sản phẩm xem ảnh bìa đã đúng.

## Lưu ý
- Xóa ảnh trong ADMIN chỉ xóa khỏi Gallery của sản phẩm. File R2 không bị tự xóa, tránh ảnh hưởng những nơi khác đang tham chiếu.
- Ảnh chính `image` vẫn được lưu riêng nhằm tương thích các tính năng cũ.
- Ảnh chia sẻ SEO mặc định thuộc ADMIN → Quản lý SEO vẫn hoạt động riêng.
- Không phải tạo R2 bucket hay binding mới. Giữ `DB` và `PRODUCT_IMAGES` hiện tại.
- Không chạy lại các SQL 0001–0009.
- Nếu upload một phần thành công rồi gặp lỗi mạng, những ảnh tải lên thành công vẫn hiện trong danh sách soạn thảo; bấm Lưu sản phẩm để giữ chúng.
