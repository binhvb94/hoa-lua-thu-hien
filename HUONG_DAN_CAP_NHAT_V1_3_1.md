# HOA LỤA THU HIỀN V1.3.1 — SỬA CỠ CHỮ BANNER TRONG ADMIN

## Thay đổi
- Trong ADMIN → Nội dung website → Banner trang chủ có thêm 2 trường: **Cỡ chữ tối đa – máy tính (px)** (40–80) và **Cỡ chữ tiêu đề – điện thoại (px)** (30–56).
- Mặc định: **56px máy tính**, **38px điện thoại**. Máy tính có màn hình trung bình tự giảm font theo độ rộng màn hình, không tăng quá mức bạn đặt.
- Cụm tiêu đề **in nghiêng** (ví dụ `dịu dàng`) được giữ liền nhau, không bị tách giữa hai dòng.
- Giữ nguyên quy trình **Lưu bản nháp → Xem trước → Xuất bản**.
- Không tạo bảng mới, không đổi schema D1, không ảnh hưởng các sản phẩm / ảnh R2 / đơn hàng / Pixel / tên miền.

## Cài bản cập nhật nhỏ qua GitHub (khuyến nghị)
1. Sao lưu repository hiện tại hoặc ghi lại mã commit gần nhất để có thể quay lại nếu cần.
2. Giải nén file `Hoa_Lua_Thu_Hien_V1_3_1_Chi_Sua_Font.zip`.
3. Mở repository `binhvb94/hoa-lua-thu-hien` → Add file → Upload files.
4. Kéo thả **nội dung bên trong thư mục** đã giải nén, giữ nguyên đường dẫn thư mục con `admin/`, `data/`, `lib/`.
5. GitHub sẽ thay thế file trùng đường dẫn khi bạn bấm Commit changes, file khác không bị xóa.
6. Chờ Cloudflare Pages → Deployments báo Success (Production/main).
7. Vào `https://hoa-lua-thu-hien.pages.dev/admin/` → Nội dung website → Banner trang chủ.
8. Đặt ví dụ **56** cho màn hình lớn, **38** cho điện thoại, bấm **Lưu bản nháp → Xem trước → Xuất bản**.
9. Mở trang khách bằng cửa sổ ẩn danh hoặc Ctrl+Shift+R để xem nội dung mới.

**Lưu ý:** Nếu bản nháp hiện đang có dữ liệu, bản cập nhật chỉ bổ sung 2 giá trị mặc định cho các trường mới; không xóa bản nháp cũ. Nếu bạn muốn kiểm tra kiểu chữ/độ rộng, xem trước trên cả máy tính và điện thoại trước khi bấm Xuất bản.

## Kiểm thử
- `node --test tests/*.test.mjs`: pass.
- `npm run build`: pass.
- Mô phỏng CSS trong Chromium các chiều rộng 1640, 1440, 1280, 980, 760, 390, 320: cụm nhấn mạnh không tách dòng, không tràn ngang.
