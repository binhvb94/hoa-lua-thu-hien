# HOA LỤA THU HIỀN — V1.2: TRANG QUẢN TRỊ SẢN PHẨM

**Phiên bản nâng cấp của V1.1, KHÔNG tạo dự án Cloudflare mới.**

- Web khách: `https://hoa-lua-thu-hien.pages.dev` hoặc `https://hoaluathuhien.shop` sau khi gắn domain.
- ADMIN: `/admin/` trên cùng domain.
- Frontend: HTML/CSS/JS. Hosting: **Cloudflare Pages**; dữ liệu: **D1**; ảnh: **R2**.
- Thay sản phẩm/giá/ảnh/ẩn/xóa **trên giao diện ADMIN** mà không sửa GitHub hoặc build lại.
- 9 sản phẩm V1.1 được seed vào D1 dưới nhãn **MẪU** (chưa phải hàng thật).
- Trạng thái nhận đơn/đăng ký vẫn **KHÓA** theo cấu hình V1.1. Không mở bán chỉ vì đã có ADMIN.
- Chưa có quản lý tồn kho/đơn hàng trong ADMIN; phạm vi V1.2 là **quản trị sản phẩm**.

## A. Cập nhật repo GitHub V1.1 (chỉ làm MỘT LẦN)

Đã có repo `https://github.com/binhvb94/hoa-lua-thu-hien` và Cloudflare Pages kết nối nhánh `main`.

**Cách khuyến nghị trên Windows:**

1. Giải nén ZIP phiên bản V1.2 vào `D:\Hoa_Lua_Thu_Hien_Pages_V1_2_Admin`.
2. Mở PowerShell (cần Git) và chạy:

```powershell
cd D:\
git clone https://github.com/binhvb94/hoa-lua-thu-hien.git
Copy-Item "D:\Hoa_Lua_Thu_Hien_Pages_V1_2_Admin\*" "D:\hoa-lua-thu-hien\" -Recurse -Force
cd D:\hoa-lua-thu-hien
git add .
git commit -m "Hoa Lua Thu Hien V1.2 - Admin products D1 R2"
git push origin main
```

> Nếu `D:\hoa-lua-thu-hien` đã tồn tại, KHÔNG chạy lại `git clone`: `cd D:\hoa-lua-thu-hien`, `git pull origin main`, sao chép file và commit/push như trên.
>
> Không sao chép `config.js` từ dự án QUTA/Pancook. Không đưa mật khẩu hay API token vào GitHub.
>
> Cloudflare Pages đã có build settings `npm run build` → `dist`: **giữ nguyên**. `functions/` ở cấp root; KHÔNG dời vào `dist/`.

Sau khi push lên `main`, Cloudflare Pages tự triển khai giao diện `/admin/`, nhưng API quản trị sẽ báo **chưa cấu hình** cho đến khi hoàn thành D1 và secret bên dưới. Việc này không ảnh hưởng trang web đã chạy; bạn sẽ vẫn thấy dữ liệu minh họa khi `previewMode:true`.

## B. Tạo D1 dành riêng cho Hoa Lụa Thu Hiền

Tại Cloudflare, chọn **Account Hoa Lua Thu Hien** (KHÔNG dùng QUTA/Pancook).

1. **Storage & databases → D1 → Create database**.
2. Tên gợi ý: `hoa-lua-thu-hien-db`.
3. Mở database → **Console** (SQL editor).
4. Dán/chạy **toàn bộ nội dung** file `migrations/0001_init.sql` trước.
5. Tiếp tục dán/chạy **toàn bộ nội dung** file `migrations/0002_catalog_admin.sql`.
6. Chạy lệnh xác minh:

```sql
SELECT COUNT(*) AS count_products FROM products;
```

Kết quả dự kiến: **9** (các sản phẩm mẫu). Nếu hiện lỗi SQL, KHÔNG tiếp tục bật nhận đơn, gửi nguyên nội dung thông báo lỗi.

7. **Workers & Pages → hoa-lua-thu-hien → Settings → Bindings → Add → D1 database**.
8. **Variable name:** `DB` (VIẾT HOA) → chọn database `hoa-lua-thu-hien-db`.
9. **Save** và **Redeploy** production deployment để binding có hiệu lực.

> V1.1 không có bảng products; khi sử dụng V1.2 cần áp dụng CẢ 2 migration với database mới. Nếu đã tạo D1 và chạy 0001 trước đó, chỉ chạy thêm 0002. Câu lệnh `CREATE TABLE IF NOT EXISTS` và `INSERT OR IGNORE` hỗ trợ chạy lại an toàn.

## C. Tạo R2 để lưu ảnh sản phẩm

1. Chọn đúng Account **Hoa Lua Thu Hien** → **Storage & databases → R2 → Create bucket**.
2. Tên: `hoa-lua-thu-hien-images`.
3. **Workers & Pages → hoa-lua-thu-hien → Settings → Bindings → Add → R2 bucket**.
4. **Variable name:** `PRODUCT_IMAGES` (VIẾT HOA) → bucket `hoa-lua-thu-hien-images`.
5. Save và Redeploy trang Pages.

> Không cần mở public bucket; ảnh được phục vụ qua `/media/<uuid>.jpg|png|webp`. ADMIN chỉ cho phép tệp JPG/PNG/WebP hợp lệ tối đa 5 MB. Ảnh quá lớn tự được thu nhỏ ở trình duyệt khi hỗ trợ. R2 có hạn mức/điều kiện kích hoạt riêng; nếu chưa kích hoạt được, ADMIN vẫn có thể gắn link ảnh HTTPS nhưng không upload file lên Cloudflare.

## D. Thiết lập mật khẩu ADMIN (KHÔNG đưa vào mã nguồn)

Trong thư mục V1.2 trên máy Windows, mở PowerShell rồi chạy:

```powershell
node scripts/hash-password.mjs
```

Nhập **mật khẩu riêng, tối thiểu 14 ký tự**. Script sẽ in **một giá trị hash** dạng:

`pbkdf2_sha256$310000$...$...`

Trên Cloudflare: **Workers & Pages → hoa-lua-thu-hien → Settings → Variables and Secrets → Add**.

- **Name:** `ADMIN_PASSWORD_HASH`
- **Value:** dán **toàn bộ chuỗi hash** vừa tạo
- **Type:** chọn **Secret / Encrypt** (KHÔNG đặt dạng biến công khai, không đặt trong `config.js`)
- **Environment:** Production
- Save và Redeploy.

Không gửi mật khẩu thật/hash vào chat, không đưa hash vào GitHub. Nên dùng mật khẩu khác hoàn toàn mật khẩu GitHub, Porkbun, Cloudflare.

ADMIN: `https://hoaluathuhien.shop/admin/` (sau khi tên miền Active + custom domain gắn Pages), hoặc `https://hoa-lua-thu-hien.pages.dev/admin/`.

### Đặc điểm bảo mật

- Mật khẩu so khớp PBKDF2-SHA256 có salt riêng, 310.000 vòng, bằng WebCrypto ở máy chủ.
- Cookie phiên **HttpOnly, Secure, SameSite=Strict** trên HTTPS, có CSRF token, hết hạn sau 12h.
- Giới hạn 5 lần sai/15 phút cho mỗi IP (dựa trên CF-Connecting-IP ở Cloudflare).
- API thêm/sửa/ẩn/xóa và upload ảnh từ chối nếu chưa đăng nhập.
- Mã sản phẩm giữ cố định, giá đơn được lấy từ D1 thay vì dữ liệu người mua có thể sửa.
- Sự kiện `Purchase` chỉ phát sau khi máy chủ ghi đơn COD hợp lệ.

### Những việc cần làm trước khi mở bán

1. Đổi 9 sản phẩm mẫu thành sản phẩm thật trong ADMIN hoặc xóa/ẩn chúng.
2. Kiểm tra ảnh, tên, mã, giá bán, đường dẫn sản phẩm.
3. Kiểm tra quy trình COD. Chỉ sau khi xác nhận, thay `previewMode:true` thành `false` **trong `config.js`** và cấu hình biến `ENABLE_ORDERS=true`, `ENABLE_REGISTRATION=true` tại Pages (phần này hiện chưa đưa vào bảng ADMIN).
4. Gắn Meta Pixel ID trong `config.js` và thử trong **Meta Events Manager → Test events**.
5. Lưu ý Pixel chỉ kích hoạt sau khi khách đồng ý cookie theo logic hiện có.

## E. Hướng dẫn sử dụng ADMIN

- **Thêm**: bấm `＋ Thêm sản phẩm`, nhập tên, danh mục, giá, chọn ảnh, bật **Hiển thị trên website**, lưu.
- **Sửa**: bấm `Sửa` ở sản phẩm; sửa tên, mô tả, ảnh, giá → `Lưu sản phẩm`.
- **Ẩn**: `Sửa` → tắt `Hiển thị trên website` → Lưu. Sản phẩm biến mất khỏi danh mục khách nhưng vẫn còn trong ADMIN.
- **Xóa**: bấm `Xóa`, xác nhận. Sản phẩm bị đánh dấu xóa mềm trong D1; lịch sử đơn cũ không bị mất.
- **Tìm**: ô tìm kiếm theo tên/mã/chất liệu; lọc theo trạng thái.
- **Mã ID** giữ nguyên khi sửa, để phục vụ đơn hàng và Meta Pixel. Đường dẫn `slug` có thể sửa, nhưng link cũ sẽ không còn dẫn tới sản phẩm.
- Thay đổi sản phẩm hiển thị khi khách tải lại trang; giỏ hàng đang mở của khách không tự đồng bộ cho tới khi tải lại.

## F. Test kỹ trước khi vận hành

- Chưa đăng nhập: `GET /api/admin/products` phải trả 401.
- Login sai 5 lần: phải chặn 15 phút.
- Login đúng: hiện danh sách 9 mẫu (sau D1 migration).
- Upload 1 ảnh JPG thật: trả về `/media/...` và truy cập URL ảnh được.
- Thêm một sản phẩm đang bán: xuất hiện trong `/api/products`, trên website sau refresh.
- Tạm ẩn sản phẩm: không còn trên website; vẫn còn trong ADMIN.
- Đổi giá sản phẩm và thử giỏ hàng; khi bật orders, server phải tính theo giá mới trong D1.
- Đăng xuất: cập nhật sản phẩm bị từ chối, cookie phiên bị xóa.

## G. Cấu trúc chính

| File | Vai trò |
| --- | --- |
| `admin/index.html` | Trang ADMIN |
| `admin/admin.js`, `admin/admin.css` | UI quản trị |
| `functions/api/admin/` | Đăng nhập, phiên, CRUD, upload |
| `functions/api/products.js` | Danh mục công khai từ D1 |
| `functions/media/[key].js` | Trả ảnh từ R2 |
| `functions/api/orders.js` | Nhận đơn/giá từ D1 |
| `lib/admin-auth.js`, `lib/catalog.js` | Xác thực, kiểm tra dữ liệu ở máy chủ |
| `migrations/0001_init.sql` | Bảng orders + registrations gốc |
| `migrations/0002_catalog_admin.sql` | Bảng products + admin sessions + mẫu |
| `scripts/hash-password.mjs` | Tạo hash tại máy local |

**Ghi chú triển khai:** Bộ ZIP là mã nguồn chưa được push hộ lên GitHub và chưa thể tự tạo tài nguyên trong Cloudflare Account của bạn. Giữ bản V1.1 chạy song song đến khi hoàn tất D1, R2 và Secret.
