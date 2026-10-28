# HOA LỤA THU HIỀN V1.3.4 – ĐƠN HÀNG & KHÁCH HÀNG

Đây là mã nguồn ĐẦY ĐỦ kế thừa V1.3.3 (sản phẩm, nội dung CMS nháp/xem trước/xuất bản, quản lý Pixel, mật khẩu ADMIN PBKDF2 100000), không phải bản vá rời rạc.

## 1. Sao lưu trước khi cập nhật

- GitHub `binhvb94/hoa-lua-thu-hien`: Code → Download ZIP để lưu bản cũ.
- Nên sao lưu database `hoa-lua-thu-hien-db` trước khi chạy migration.
- KHÔNG tạo Cloudflare Account, Pages, D1, R2, hay mật khẩu ADMIN mới.

## 2. Cập nhật database (BẮT BUỘC TRƯỚC KHI DEPLOY)

Vào Cloudflare Account **Hoa Lua Thu Hien** → Storage & databases → D1 SQL Database → `hoa-lua-thu-hien-db` → Console.

Mở `migrations/0004_console_copy.sql` bằng VS Code, sao chép toàn bộ mã SQL và thực thi trên Console.

File `0004_orders_customers_admin.sql` cũng có nội dung tương đương nhưng chứa chú thích; `0004_console_copy.sql` dễ dùng với Cloudflare Console hơn.

Migration KHÔNG xóa hoặc ghi đè bảng `orders`, `registrations`, `products`, `site_cms`, `admin_sessions` và không chèn sản phẩm mẫu. Nó bổ sung chỉ mục và bảng/trigger nhật ký trạng thái.

Xác nhận:

```sql
SELECT name FROM sqlite_master WHERE type IN ('table','trigger') AND name IN ('orders','registrations','order_status_history','trg_orders_status_audit') ORDER BY name;
```

Phải xuất hiện: `orders`, `registrations`, `order_status_history`, `trg_orders_status_audit`.

## 3. Cập nhật GitHub

Giải nén file ZIP đầy đủ. Vào https://github.com/binhvb94/hoa-lua-thu-hien → Add file → Upload files. Kéo nội dung BÊN TRONG thư mục giải nén (các thư mục `admin/`, `functions/`, `lib/`, `data/`, `migrations/`, `scripts/` và các file `index.html`, `app.js`, `package.json`, ...). Không upload nguyên ZIP hoặc một thư mục bao ngoài. Bấm Commit changes lên `main`.

Cloudflare Pages tự triển khai `npm run build`, đầu ra `dist`.

## 4. Kiểm tra ADMIN trước khi cho khách đặt hàng

Đợi Cloudflare → Workers & Pages → hoa-lua-thu-hien → Deployments → Success.
Vào `https://hoaluathuhien.shop/admin/`, Ctrl + Shift + R, đăng nhập ADMIN.

Menu phải có: Sản phẩm / Đơn hàng / Khách hàng / Nội dung website.

- Đơn hàng: hiển thị danh sách, lọc theo bốn trạng thái, tìm kiếm, bấm **Xem / Cập nhật** để xem đủ chi tiết và sửa trạng thái.
- Khách hàng: chỉ đọc bảng `registrations` từ biểu mẫu đăng ký nhận tin; không tự ghép với các đơn ở `orders`.
- CMS: giữ nguyên nháp, xem trước, xuất bản và quản lý Meta Pixel.

## 5. Bật đặt hàng và đăng ký THẬT (CHỈ KHI ĐÃ THAY DỮ LIỆU MẪU)

Mặc định phiên bản này CỐ Ý không tự bật nhận đơn/đăng ký. Nếu website vẫn chứa 9 sản phẩm mẫu, KHÔNG bật ngay.

Khi giá, ảnh và sản phẩm thật đã chính xác:

(A) GitHub → file `config.js`: đổi `previewMode: true` thành `previewMode: false`, Commit. Điều này cũng loại bỏ nhãn xem trước và mở giao diện đặt hàng/đăng ký ở phía trình duyệt.

(B) Cloudflare Pages → `hoa-lua-thu-hien` → Settings → Production → Variables and secrets:

- Plain text variable `ENABLE_ORDERS` = `true`
- Plain text variable `ENABLE_REGISTRATION` = `true`

Lưu. Thực hiện Redeploy Production mới nhất nếu có thay đổi bindings/variables. Giữ `ADMIN_PASSWORD_HASH`, `DB`, `PRODUCT_IMAGES` như cũ.

Hai biến dùng để mở các API POST `/api/orders` và `/api/register` ở phía máy chủ. Phải là chuỗi chính xác `true` (chữ thường).

(C) Kiểm thử từ trình duyệt ẩn danh:

1. Thêm một **sản phẩm thật** vào giỏ; tới trang thanh toán, nhập số điện thoại/địa chỉ kiểm thử và đặt COD.
2. ADMIN → Đơn hàng → xem đơn vừa tạo, xác nhận sản phẩm, giá, số lượng, địa chỉ, mã đơn; đổi trạng thái từ Đặt hàng → Đang giao → Đã giao. Có lịch sử thay đổi.
3. Tại trang chủ đăng ký nhận tin với số điện thoại/email kiểm thử và đồng ý nhận thông tin.
4. ADMIN → Khách hàng thấy dữ liệu đăng ký; bảng Đơn hàng không tự thay đổi vì đăng ký không tạo đơn.
5. Nếu dùng dữ liệu kiểm thử, xử lý/xóa theo quy trình phù hợp, tránh lưu PII của người khác trái ý muốn.

## 6. Lưu ý bảo mật / Pixel

- API danh sách đơn và khách cần phiên ADMIN, không công khai. Đổi trạng thái cần token chống CSRF và phát hiện cập nhật cũ.
- Tất cả số tiền COD lấy từ sản phẩm D1 lúc đặt, không tin giá do trình duyệt gửi.
- Vẫn giữ Pixel `Purchase` tại thời điểm máy chủ TIẾP NHẬN đơn COD (chưa phải đã thu tiền), `CompleteRegistration` chỉ khi số điện thoại đăng ký mới được lưu.
- Bản xem trước CMS không tạo đơn hoặc đăng ký, không bắn Pixel.
- Cần cân nhắc chống spam (Turnstile hoặc WAF), kiểm tra luồng vận hành và chính sách quyền riêng tư trước quảng cáo diện rộng.

## 7. Nếu menu biến mất sau cập nhật

Thử Ctrl + Shift + R, kiểm tra Deployment Success và cùng commit. Build V1.3.4 có kiểm tra đủ CMS + Meta Pixel + đơn hàng/khách hàng.
