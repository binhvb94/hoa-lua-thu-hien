# HƯỚNG DẪN NÂNG CẤP HOA LỤA THU HIỀN V1.3 – CMS

## A. Trạng thái và nơi triển khai

Đây là bản NÂNG CẤP từ V1.2/V1.2.1, KHÔNG tạo dự án Cloudflare mới.

- GitHub: `https://github.com/binhvb94/hoa-lua-thu-hien` (branch `main`)
- Cloudflare Account: **Hoa Lua Thu Hien**
- Pages project: `hoa-lua-thu-hien`
- D1 binding `DB`: `hoa-lua-thu-hien-db` (đã có)
- R2 binding `PRODUCT_IMAGES`: `hoa-lua-thu-hien-images` (đã có)
- Secret `ADMIN_PASSWORD_HASH`: **GIỮ NGUYÊN**, không gửi qua GitHub
- Địa chỉ ADMIN: `https://hoa-lua-thu-hien.pages.dev/admin/`, hoặc `/admin/` trên tên miền riêng khi đã gắn Pages.

## B. BẮT BUỘC: Chạy migration 0003 trước khi upload lên GitHub

Vào đúng account **Hoa Lua Thu Hien** → Storage & databases → D1 SQL Database → `hoa-lua-thu-hien-db` → Console.

Mở `migrations/0003_site_cms.sql` và thực thi SQL. File này chỉ tạo `site_cms` và `site_publication_history`, không xóa bảng đơn hàng, sản phẩm hoặc phiên đăng nhập. Nếu Cloudflare Console không nhận dạng câu lệnh do chú thích bị dồn dòng, xóa các dòng bắt đầu bằng `--` rồi dán lại câu lệnh SQL nguyên vẹn.

Sau khi chạy, kiểm tra:

```sql
SELECT name FROM sqlite_master
WHERE type='table' AND name IN ('site_cms','site_publication_history')
ORDER BY name;
```

Kết quả phải có **2 bảng**. Tiếp tục:

```sql
SELECT id,draft_rev,live_rev FROM site_cms WHERE id='home';
```

Dự kiến: `home`, `0`, `0` (trước lần sửa/xuất bản đầu tiên).

**Không** chạy lại `0001_init.sql` / `0002_catalog_admin.sql`; không tạo D1/R2/Secret mới.

## C. Cập nhật mã nguồn lên GitHub

- Giải nén ZIP V1.3.
- Mở `https://github.com/binhvb94/hoa-lua-thu-hien` → `Add file` → `Upload files`.
- Kéo **toàn bộ nội dung BÊN TRONG thư mục** đã giải nén, gồm `admin`, `assets`, `data`, `dist`, `functions`, `lib`, `migrations`, `scripts`, `app.js`, `site-frontend.js`, `index.html`, `package.json`, ... vào kho gốc GitHub, **không** kéo nguyên ZIP hay thư mục cha.
- Bấm `Commit changes` vào `main`. GitHub ghi đè các file **trùng tên và cùng đường dẫn**, file mới tự thêm; file cũ không tự xóa.
- Cloudflare Pages tự build (`npm run build`, output `dist`). Vào Deployments và xác nhận bản Production mới **Success**.
- Không cần thay Bindings hay Secret hiện có, trừ khi bạn tự sửa cấu hình về sau.

**Nên lưu lại commit V1.2 trước khi cập nhật** để có đường quay lại. GitHub giữ lịch sử commit.

## D. Sử dụng CMS

1. Đăng nhập `/admin/` bằng mật khẩu ADMIN hiện có.
2. Ở menu trái chọn **Nội dung website**.
3. Chọn từng nhóm: Nhận diện thương hiệu, Menu, Banner trang chủ, Điểm nổi bật, Danh mục hoa, Khu vực sản phẩm, Câu chuyện thương hiệu, Đăng ký, Liên hệ, Ẩn/hiện khu vực, Chân trang.
4. Chỉnh nội dung. Ảnh có thể nhập URL `https://` hoặc bấm **Tải ảnh lên R2** (JPG/PNG/WebP, tối đa 5 MB).
5. Bấm **Lưu bản nháp**. Việc này KHÔNG thay đổi website khách hàng.
6. Bấm **Xem trước** để mở tab riêng, trên cùng domain với ADMIN. Có dòng nhãn “BẢN XEM TRƯỚC NỘI DUNG — CHƯA XUẤT BẢN”. Link xem trước yêu cầu đang đăng nhập ADMIN; người ngoài không xem được nội dung bản nháp.
7. Nếu đã ưng ý, quay lại ADMIN và bấm **Xuất bản website**; xác nhận. Website khách hàng lấy nội dung mới khi họ tải lại trang.
8. Nếu không muốn giữ bản nháp, bấm **Hủy bản nháp**. Nội dung chính thức không bị mất.

Có thể chỉnh nhiều nhóm lần lượt, lưu từng nhóm rồi **xuất bản tất cả cùng lúc**. Cảnh báo “Có thay đổi chưa lưu” nghĩa là bạn cần bấm Lưu bản nháp trước khi Xem trước / Xuất bản.

## E. Phân biệt CMS và sản phẩm

- Quản lý sản phẩm vẫn hoạt động như V1.2: sửa sản phẩm là **áp dụng ngay**, không đi qua quy trình bản nháp của CMS.
- CMS chỉ điều khiển nội dung, ảnh trang chủ, tên menu, tông màu chủ đạo và ẩn/hiện các khối. CMS chưa phải trình dựng trang kéo thả; không thêm khối giao diện hoàn toàn mới.
- CMS KHÔNG tự bật nhận đơn, đăng ký hay Meta Pixel. Quy tắc `previewMode` và `pixelId` trong `config.js` giữ nguyên. **Bản xem trước CMS** luôn tắt sự kiện Pixel và không nhận đơn, kể cả khi tương lai bật chế độ bán hàng.
- Ảnh tải lên R2 trong quá trình chỉnh sửa nhưng chưa dùng có thể còn trong bucket; hiện chưa có tính năng dọn ảnh không dùng.
- Lịch sử lần xuất bản được ghi trong `site_publication_history` làm dữ liệu sao lưu; chưa có nút khôi phục tự động trong ADMIN.

## F. Kiểm tra sau triển khai

1. `https://hoa-lua-thu-hien.pages.dev/api/site` trả về `ok:true` và nội dung mặc định/đã xuất bản.
2. Không đăng nhập: `GET /api/admin/site/preview` phải trả HTTP `401`.
3. Đăng nhập: mở Nội dung website, sửa 1 câu banner, **Lưu bản nháp**.
4. Tab website bình thường KHÔNG được đổi câu banner; tab **Xem trước** PHẢI hiển thị câu mới.
5. Bấm **Xuất bản website**, mở lại website khách hàng và làm mới; câu banner PHẢI đổi.
6. Thử sửa và hủy nháp; website khách hàng phải giữ nội dung đã xuất bản.
7. Kiểm tra trên điện thoại, cửa hàng, giỏ hàng và trang ADMIN sản phẩm vẫn hoạt động bình thường.

Nếu tab CMS hiện “Chưa chạy migration 0003” thì chỉ sửa D1. Nếu API hoạt động nhưng khách vẫn thấy bản cũ, mở trang mới bằng Ctrl+Shift+R và kiểm tra Cache Rules tùy chỉnh của domain; API đã đặt Cache-Control no-store.

## G. Bảo mật và triển khai an toàn

- Bản nháp chỉ có API thuộc `/api/admin/site/*` và sử dụng cookie phiên ADMIN + CSRF cho lệnh ghi.
- Phần website công khai gọi riêng `/api/site` và chỉ nhận `published_json`.
- Dữ liệu CMS được đặt trong D1, không dùng GitHub cho thay đổi nội dung hằng ngày.
- Không ghi password, hash hoặc Cloudflare API Token vào `config.js`, GitHub, ảnh chụp màn hình.
- Nên ưu tiên thử trên URL `.pages.dev` trước khi quảng cáo tới tên miền chính.
