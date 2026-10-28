# HOA LỤA THU HIỀN – Cloudflare Pages V1.1

Phiên bản **sẵn sàng để triển khai bản xem trước** cho máy tính và điện thoại, với 9 sản phẩm và giá minh họa. Đơn hàng/đăng ký mặc định bị khóa an toàn. Chưa có kết nối tài khoản Cloudflare, chưa có URL công khai, chưa có Meta Pixel ID và chưa có dữ liệu sản phẩm chính thức.

## A. Đăng website bằng GitHub + Cloudflare Pages (khuyến nghị)

**Chú ý:** Không dùng dự án QUTA hay Pancook sẵn có. Tạo một repository và Pages project riêng cho **Hoa Lụa Thu Hiền**.

1. Giải nén file ZIP. Mở PowerShell tại thư mục `Hoa_Lua_Thu_Hien_Pages_V1_1` (thư mục chứa `index.html`, `package.json`, `functions/`).
2. Tạo **repository GitHub mới** tên `hoa-lua-thu-hien` (có thể để Private), không tích sẵn README.
3. Chạy các lệnh (thay `<TEN_GITHUB>` bằng GitHub username thật):

   ```powershell
   cd D:\Hoa_Lua_Thu_Hien_Pages_V1_1
   git init
   git add .
   git commit -m "Hoa Lua Thu Hien V1.1 - preview ready"
   git branch -M main
   git remote add origin https://github.com/<TEN_GITHUB>/hoa-lua-thu-hien.git
   git push -u origin main
   ```

4. Mở https://dash.cloudflare.com/ → **Workers & Pages → Create application → Pages → Import an existing Git repository**; cho phép Cloudflare truy cập repo mới, chọn `hoa-lua-thu-hien`.
5. Trong **Build settings**, chọn:

   | Mục | Giá trị |
   | --- | --- |
   | Project name | `hoa-lua-thu-hien` (nếu khả dụng) |
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | để mặc định `/` |

6. Bấm **Save and Deploy**. Khi Cloudflare báo triển khai thành công, giao diện sẽ có URL `https://<ten-du-an>.pages.dev` do **Cloudflare cấp**. Mở URL này bằng điện thoại và máy tính để kiểm tra. Chưa cấu hình domain riêng hoặc D1 cũng xem được giao diện và giỏ hàng.

**Lưu ý:** Kéo thả ZIP trực tiếp trong Cloudflare Dashboard có thể đăng giao diện tĩnh, nhưng **không triển khai Pages Functions**. Không dùng cách kéo thả cho bản bán hàng có chức năng lưu đơn. Nếu chọn Direct Upload trước, không thể chuyển cùng Pages project sang Git integration sau này. Tạo dự án Pages mới nếu muốn đổi phương thức. Đối với file zip này, nên chọn Git từ đầu.

## B. Những gì xem/thử được ngay

- Trang chủ responsive, danh mục 3 dòng hoa; lọc, sắp xếp và tìm kiếm.
- Mở chi tiết sản phẩm, URL sản phẩm dạng `#san-pham/<slug>`, thêm và chỉnh giỏ hàng.
- Xem luồng checkout (nhưng **không gửi đơn**), mẫu biểu đăng ký (nhưng **không nhận đăng ký**).
- Trang có nhãn `BẢN XEM TRƯỚC` để tránh khách hiểu nhầm ảnh/giá mẫu là sản phẩm thật.
- Pixel chưa phát sự kiện vì `pixelId` chưa được điền.

## C. Thay dữ liệu thật trước khi bán

1. Gửi ảnh thật của từng sản phẩm vào `assets/products/` hoặc nhập URL ảnh có quyền sử dụng. Sửa `data/products.js`: ID duy nhất (`TH001`, ...), tên sản phẩm, danh mục, giá thực, giá cũ nếu có, chất liệu, kích thước và mô tả. Ảnh sản phẩm nên sử dụng đường dẫn `/assets/products/ten-file.webp`.
2. Thay ảnh banner trang chủ và ảnh cho danh mục trong `index.html` (hiện có ảnh mẫu nguồn Unsplash); thay nội dung thương hiệu và chính sách theo thông tin cửa hàng đã xác minh.
3. Cập nhật `config.js` với số Zalo chính thức; liên kết Facebook đã đặt theo fanpage được cung cấp.
4. Khi nội dung, hình ảnh, giá bán, phí giao hàng, tồn kho và quy trình hỗ trợ đã chính xác, đổi `previewMode: true` → `false` trong `config.js` và push lên GitHub.

Sửa xong, GitHub push sẽ tự kích hoạt bản triển khai Cloudflare Pages mới (nếu vẫn bật auto deploy).

## D. Kích hoạt lưu đơn COD bằng Cloudflare D1 (sau khi chốt dữ liệu)

Trên PC đã cài Node.js 20+:

```powershell
npm install
npx wrangler login
npx wrangler d1 create thuhien-shop
npx wrangler d1 execute thuhien-shop --remote --file=migrations/0001_init.sql
```

Cloudflare sẽ trả về một `database_id`; không cần đưa token tài khoản vào code. Mở **Cloudflare Pages project → Settings → Bindings → Add → D1 database**, chọn database vừa tạo, **Variable name phải là `DB`**. Tạo **Environment variables** cho **Production**:

| Variable | Value |
| --- | --- |
| `ENABLE_ORDERS` | `true` |
| `ENABLE_REGISTRATION` | `true` |

Sau khi thêm binding và biến môi trường, **redeploy**. Hai API:

- `POST /api/orders` lưu đơn COD `new`, giá được kiểm tra lại ở server.
- `POST /api/register` lưu thành viên mới, chống đăng ký trùng số điện thoại.

**Chưa có quản lý đơn bằng UI**, chưa có thông báo đơn qua email/Telegram/Zalo, chưa có thanh toán trực tuyến, kiểm tra tồn kho, chống spam nâng cao hay xử lý hoàn/đổi. Cần hoàn thiện theo quy trình cửa hàng trước khi quảng cáo rộng rãi. Trạng thái `Purchase` tương ứng **đơn COD mới được ghi nhận**, không phải đã thu tiền.

**Bảo mật:** Nên thêm Cloudflare Turnstile/rate limiting, kiểm thử request, quy trình xóa dữ liệu và trang chính sách riêng. Không lưu API token hay secret trong `config.js` hoặc GitHub.

## E. Meta Pixel – bật sau khi có sản phẩm thật và server nhận đơn

Trong `config.js`, điền ID Pixel: `pixelId: '123456789012345'` (chỉ là ví dụ, phải thay bằng ID thật). Meta Pixel chỉ tải sau khi khách nhấn đồng ý đo lường. Các sự kiện có trong mã nguồn:

| Event | Kích hoạt |
| --- | --- |
| `PageView` | Vào website / điều hướng chi tiết sản phẩm |
| `ViewContent` | Mở sản phẩm |
| `Search` | Khách tìm kiếm |
| `AddToCart` | Thêm vào giỏ thực sự |
| `InitiateCheckout` | Mở bước đặt hàng |
| `Purchase` | **API xác nhận lưu đơn hàng mới**; không gửi cho request lỗi hoặc đơn gửi lại |
| `CompleteRegistration` | **API xác nhận tạo thành viên mới**; không gửi cho đăng ký trùng |

Kiểm thử từng sự kiện ở Meta **Events Manager → Test events** trên domain live sau khi nhấn `Đồng ý Pixel`. Dữ liệu của Pixel có thể bị hạn chế bởi việc từ chối consent, trình duyệt hoặc adblocker. Nếu gắn Meta Product Catalog sau này, cần dùng **đúng các product ID** giống website và không thay đổi tùy tiện.

Browser Pixel đã có; **Conversions API và khử trùng lặp Browser/Server chưa tích hợp**. Nên bổ sung khi mở rộng chiến dịch, chứ không tự nhận là đã có CAPI.

## F. Kiểm tra build (không cần login Cloudflare)

Từ thư mục nguồn chạy:

```powershell
npm run build
```

Kết quả trong thư mục `dist/`. Cấu trúc này cố ý **chỉ chứa file giao diện**, không lộ `migrations`, `functions`, `README` hay thông tin máy chủ. Cloudflare sẽ đọc riêng thư mục `functions/` để tạo API.

## Tài liệu Cloudflare

- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/bindings/
