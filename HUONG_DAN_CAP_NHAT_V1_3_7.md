# Hoa Lụa Thu Hiền V1.3.7 – Quản lý SEO ngay trong ADMIN

Bản nâng cấp trực tiếp từ V1.3.6. **Không chạy SQL mới**. Không sửa tên miền, database D1, bucket R2 hoặc Secret `ADMIN_PASSWORD_HASH`.

## 1. Cập nhật

1. Sao lưu website hiện tại: trong GitHub repository `binhvb94/hoa-lua-thu-hien`, chọn **Code → Download ZIP**. Nếu có điều kiện, sao lưu D1.
2. Giải nén file ZIP V1.3.7 được cung cấp. Mở thư mục đã giải nén.
3. GitHub → **Add file → Upload files**. Kéo **toàn bộ file và thư mục bên trong** vào repository gốc (`index.html`, `admin/`, `data/`, `functions/`, `lib/`, ...). Không tạo thêm một lớp thư mục bên ngoài, không upload nguyên ZIP.
4. Commit vào nhánh `main` với lời nhắn `Hoa Lua Thu Hien V1.3.7 - SEO ADMIN`.
5. Cloudflare Pages `hoa-lua-thu-hien` → Deployments. Chờ bản Production mới nhất **Success**. Cấu hình build cũ vẫn là `npm run build`, output `dist`. Nếu Cloudflare báo lỗi, kiểm tra build logs; không sửa SQL.
6. Vào `https://hoaluathuhien.shop/admin/`, nhấn `Ctrl + Shift + R` để bỏ cache, đăng nhập. Menu phải có **Quản lý SEO** bên cạnh **Nội dung website**.

**An toàn:** bản ZIP giữ `config.js` với `previewMode: false`; giữ các luồng COD, đăng ký, D1/R2, Pixel và trang SEO sản phẩm. Dữ liệu thực lưu trong Cloudflare D1/R2, không chứa trong ZIP. Các biến Production `ENABLE_ORDERS` và `ENABLE_REGISTRATION` giữ nguyên.

## 2. Sử dụng Quản lý SEO

- **Trang chủ:** chỉnh SEO title, description, ảnh chia sẻ (tự tải ảnh lên R2 nếu cần).
- **Hoa lụa, Hoa cao su, Hoa decor:** mỗi trang danh mục có title/description/ảnh chia sẻ riêng. Để trống thì tự tạo theo danh mục.
- **Từng sản phẩm:** tìm sản phẩm → **Sửa SEO** → sửa hai trường SEO trong biểu mẫu sản phẩm → **Lưu sản phẩm**. SEO sản phẩm lưu **ngay** như các thuộc tính sản phẩm khác, không có chế độ nháp CMS.
- Mô phỏng Google/ảnh chia sẻ trong mục SEO chỉ là gợi ý. Google có thể tự tạo tiêu đề/mô tả khác dựa trên nội dung và truy vấn tìm kiếm.

### Bản nháp – xem trước – xuất bản

Đối với **trang chủ và danh mục**: chỉnh nội dung → **Lưu nháp SEO** → **Xem trước** (yêu cầu phiên ADMIN, gắn `noindex`) → **Xuất bản**. Khi chưa xuất bản, khách thấy bản đang hoạt động. **Lưu ý: CMS dùng chung một bản nháp**, nên nút Xuất bản SEO sẽ xuất bản *toàn bộ các thay đổi CMS đã lưu nháp khác*, không chỉ SEO. Hãy kiểm tra nội dung khác trước khi xác nhận.

Không chỉnh sửa URL chuẩn/canonical tự động để tránh trùng URL hoặc link hỏng.

## 3. Kiểm tra sau cập nhật

- `https://hoaluathuhien.shop/`
- `https://hoaluathuhien.shop/danh-muc/hoa-lua/`
- `https://hoaluathuhien.shop/sitemap.xml`
- `https://hoaluathuhien.shop/robots.txt`
- Một URL `https://hoaluathuhien.shop/san-pham/<slug>/` thật.
- Đặt đơn COD thử và kiểm tra trong ADMIN → Đơn hàng; đăng ký nhận tin thử và kiểm tra ADMIN → Khách hàng (hai mục độc lập); kiểm tra Meta Pixel nếu đã bật bằng Test Events.

**Lưu ý Google:** Sitemap đã gửi thành công ở Search Console nên không cần gửi lại mỗi khi sửa title/description. Việc thay đổi thẻ SEO không bảo đảm Google lập chỉ mục hoặc thay tiêu đề ngay lập tức.

## 4. Dành cho kỹ thuật

`npm test` và `npm run build` (Node.js 22+). Thử nghiệm với D1 cục bộ nếu cần. Không chạy lại migrations 0001–0005 trên database đã hoạt động. Thư mục `dist/` được sinh lại khi build; chỉnh mã gốc, không sửa `dist/` để phát triển.
