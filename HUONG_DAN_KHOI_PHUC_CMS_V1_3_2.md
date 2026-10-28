# HOA LỤA THU HIỀN V1.3.2 — KHÔI PHỤC ĐẦY ĐỦ ADMIN + CMS + CHỈNH CỠ CHỮ

## Vì sao mục Nội dung website biến mất?
Ảnh chụp ADMIN của bạn cho thấy menu chỉ còn “Sản phẩm” và “Xem website” — giao diện giống bản cũ. Gói cập nhật cỡ chữ trước chỉ có một số file và không bao gồm `admin/index.html`, `admin/admin.js`. Nếu mã nguồn ở GitHub đang lẫn file cũ và mới, CMS có thể biến mất mặc dù Cloudflare báo build thành công. Chưa xác định được thao tác nào gây ra việc lệch phiên bản.

**Đây là gói ĐẦY ĐỦ** (không phải bản vá từng file), có: menu “Nội dung website”; phần chỉnh sửa sản phẩm; nút Lưu bản nháp, Xem trước, Xuất bản; 2 ô cỡ chữ banner (máy tính và điện thoại); xử lý giữ liền cụm chữ nhấn mạnh.

## Chuẩn bị
- Sao lưu ZIP repository hiện tại: GitHub `binhvb94/hoa-lua-thu-hien` → **Code → Download ZIP**. GitHub vẫn lưu lịch sử commit nhưng tải ZIP giúp bạn có bản đối chiếu.
- KHÔNG xóa Cloudflare D1, KHÔNG chạy lại SQL 0001/0002/0003, KHÔNG xóa R2 hoặc Secret.
- Giữ nguyên Account **Hoa Lua Thu Hien**, Pages `hoa-lua-thu-hien`, binding `DB`, `PRODUCT_IMAGES`, Secret `ADMIN_PASSWORD_HASH` đã chạy.

## Cách cập nhật trên GitHub
1. Giải nén `Hoa_Lua_Thu_Hien_V1_3_2_FULL_Restore_CMS.zip` vào một thư mục riêng.
2. Mở https://github.com/binhvb94/hoa-lua-thu-hien → đảm bảo đang ở nhánh **main** → **Add file → Upload files**.
3. Chọn/kéo **toàn bộ nội dung BÊN TRONG thư mục vừa giải nén** vào GitHub, không kéo ZIP hoặc thư mục bao ngoài. Những tệp như `index.html`, `package.json`, `scripts/build.mjs` phải ở cấp gốc. Tệp `admin/index.html` phải nằm bên trong thư mục `admin`.
4. Trước khi commit, kiểm tra danh sách có **admin/index.html**, **admin/admin.js**, **admin/site-cms.js**, **data/site-schema.js**, **site-frontend.js**, **scripts/build.mjs**, **scripts/check-integrity.mjs**.
5. Bấm **Commit changes** với lời nhắn `Hoa Lua Thu Hien V1.3.2 - Restore full CMS and font settings`.
6. Cloudflare Pages tự build trên nhánh `main`. Mở **Workers & Pages → hoa-lua-thu-hien → Deployments**, chờ bản mới báo Success. Bộ kiểm tra khi build sẽ chủ động báo lỗi nếu mất bất kỳ thành phần CMS bắt buộc nào.
7. Mở https://hoa-lua-thu-hien.pages.dev/admin/ bằng Ctrl+Shift+R (hoặc cửa sổ ẩn danh) và đăng nhập. Menu trái phải có “Sản phẩm”, **“Nội dung website”**, “Xem website”.
8. Vào “Nội dung website → Banner trang chủ”, xác nhận có **Cỡ chữ tối đa – máy tính (px)** và **Cỡ chữ tiêu đề – điện thoại (px)**. Thử chỉnh và **Lưu bản nháp → Xem trước → Xuất bản**.

## Nếu GitHub không ghi đè đúng
Mở trực tiếp GitHub `admin/index.html` trên nhánh main, xác nhận có cụm `id="nav-cms"`. Nếu chưa có, upload lại riêng 2 file `admin/index.html` và `admin/admin.js` đúng đường dẫn. Đối với việc khôi phục hoàn chỉnh, vẫn nên đưa lên toàn bộ ZIP.

**Quan trọng:** `Add file → Upload files` thêm hoặc ghi đè các tệp có cùng đường dẫn; nó KHÔNG tự xóa tệp cũ. Vì thế không thể dùng thao tác này để dọn tệp thừa. Bản hiện tại đã được xây dựng để tự build lại thư mục `dist/`, nên tệp build cũ không quyết định giao diện sau deploy.

## Không làm mất nội dung đã xuất bản
Banner/giới thiệu/menu bạn đã lưu trong ADMIN được lưu tại D1 (`site_cms`); sản phẩm nằm tại bảng `products`, ảnh nằm tại R2. Việc upload source này không xóa bảng hoặc ảnh đó. Chỉ trường hợp bạn đổi tên binding, thay database hoặc xóa database thì dữ liệu mới bị ảnh hưởng.

## Kiểm tra kỹ thuật đã thực hiện
- `npm run test` — kiểm tra API nháp/xem trước/xuất bản và chống xuất bản trái phép.
- `npm run build` — build lại toàn bộ website và xác nhận CMS bắt buộc có đủ.
- `npm run check:cms` — kiểm tra chỉ dấu CMS trong nguồn, giúp ngăn triển khai bản thiếu menu.

**Lưu ý:** Gói này sửa lỗi mất CMS trong mã nguồn, chưa trực tiếp triển khai trong Cloudflare/GitHub của bạn. Nếu Cloudflare báo lỗi, hãy kiểm tra log phiên deploy mới.
