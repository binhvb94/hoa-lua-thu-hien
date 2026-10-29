# HOA LỤA THU HIỀN – V1.3.9.5 · Phân loại sản phẩm như Shopee

Nâng cấp từ **V1.3.9.4**. Giữ Gallery, ADMIN, CMS, danh mục, SEO, Pixel, đơn hàng, khách hàng và đánh giá hiện có.

## 1. SAO LƯU VÀ CHẠY SQL SỐ 11 – TRƯỚC KHI UPLOAD GITHUB

- Sao lưu mã nguồn từ GitHub (Code → Download ZIP) và dữ liệu Cloudflare D1 (Export Data) trước.
- Cloudflare → D1 SQL Database → `hoa-lua-thu-hien-db` → Console.
- Mở `migrations/0011_console_copy.sql` trong bản vá, copy toàn bộ và bấm Execute.
- Kết quả thành công có thể hiện “This query returned no data”: đây là bình thường đối với CREATE TRIGGER / ALTER TABLE.
- **Chỉ chạy SQL số 11 MỘT LẦN.** Nếu đã chạy rồi, không chạy lại.
- Kiểm tra bằng `SELECT variant_config FROM products LIMIT 3;`. Sản phẩm cũ sẽ có `{"axes":[],"items":[]}`.

## 2. CẬP NHẬT GITHUB (BẢN VÁ DƯỚI 100 FILE)

- Giải nén ZIP bản vá. Upload **nội dung bên trong** (không upload file ZIP) lên thư mục gốc của repo `binhvb94/hoa-lua-thu-hien`.
- Giữ nguyên cấu trúc `admin/`, `functions/`, `lib/`, `migrations/`, `dist/`, ...
- GitHub → Add file → Upload files → Commit changes vào nhánh `main`.
- Cloudflare Pages sẽ build tự động (`npm run build`, output `dist`). Chờ mục Deployments báo Success.
- Vào https://hoaluathuhien.shop/admin/ → Ctrl+Shift+R.

## 3. SỬ DỤNG PHÂN LOẠI

1. ADMIN → Sản phẩm → Thêm hoặc Sửa → khu vực “Phân loại sản phẩm”.
2. Bật “Sản phẩm có phân loại”. Điền “Phân loại 1” (vd: Màu sắc), các lựa chọn **mỗi dòng một giá trị** (Đỏ, Xanh).
3. Có thể bấm thêm “Phân loại 2” (vd: Chiều cao), các lựa chọn 50cm, 70cm.
4. Hệ thống tạo tự động bảng 2×2 = 4 tổ hợp.
5. Mỗi hàng đặt **giá bán**, **tồn kho**, **SKU (tùy chọn)**, **ảnh biến thể** (chọn Gallery hoặc tải ảnh trực tiếp lên R2).
6. Giá mặc định sản phẩm sẽ được tính từ **giá thấp nhất trong tổ hợp**, hiện dạng khoảng giá trên trang SEO nếu các biến thể có giá khác nhau.
7. Bấm “Lưu sản phẩm”. Khách hàng truy cập trang chi tiết, chọn đủ Màu và Chiều cao rồi mới thêm giỏ.

**Giới hạn:** 2 nhóm; tối đa 12 giá trị mỗi nhóm; tối đa 60 tổ hợp. Giá 1.000–100.000.000đ; tồn kho nguyên 0–1.000.000. Sản phẩm không dùng phân loại vẫn chạy như trước.

## 4. GIỎ HÀNG / ĐƠN HÀNG / TỒN KHO

- Đặt nhiều tổ hợp trong cùng một đơn: mỗi tổ hợp là một dòng khác nhau, có tên biến thể, SKU và đơn giá cụ thể.
- Phía máy chủ đối chiếu lại giá từ D1, không tin giá trình duyệt.
- Tạo đơn COD thành công: tự giảm tồn kho của từng tổ hợp một cách giao dịch (`D1.batch`); đơn trùng idempotency không trừ kho lần hai.
- Từ trạng thái chưa hủy sang Đơn hủy: trả lại kho. Chuyển Đơn hủy sang trạng thái khác: trừ kho lại và từ chối khi kho không đủ.
- Khi ADMIN thay đổi hoặc xóa tổ hợp đã được đặt, đơn hàng cũ vẫn giữ bản chụp tên và giá; dữ liệu tồn kho cần được kiểm tra lại khi hủy đơn rất cũ có tổ hợp đã bị xóa.
- Không tự động sửa tồn kho nếu đơn chưa từng có biến thể hoặc được tạo trước V1.3.9.5.

## 5. KIỂM TRA SAU TRIỂN KHAI

- Tạo thử sản phẩm 2 màu × 2 chiều cao; mỗi biến thể giá khác nhau, tồn kho 1, SKU khác nhau.
- Thử chọn một biến thể trên trang SEO; giá và ảnh thay đổi, thêm vào giỏ, xem giỏ đúng mô tả biến thể.
- Đặt COD thử một lần, kiểm tra ADMIN → Đơn hàng → Xem chi tiết hiển thị đúng biến thể và số tiền.
- Kiểm tra tồn kho giảm một đơn vị, rồi hủy đơn thử để kiểm tra tồn kho phục hồi.
- Thử biến thể tồn kho 0; nút Thêm giỏ phải bị khóa. Thử sản phẩm cũ không biến thể vẫn đặt COD bình thường.
- Kiểm tra SEO trang chi tiết, Gallery, sitemap, Pixel, CMS, đơn hàng và danh sách khách vẫn hoạt động.

## 6. KHÔI PHỤC

Nếu lỗi sau khi triển khai: hoàn tác commit mã nguồn V1.3.9.5 về V1.3.9.4 trong GitHub. **Không chạy SQL đảo ngược bằng cách DROP COLUMN** trên Production; cột variant_config có thể giữ nguyên để tương thích với dữ liệu cũ. Kiểm tra các đơn phát sinh giữa thời điểm triển khai trước khi rollback.

Đã chạy 45/45 bài kiểm thử tự động và build Cloudflare Pages thành công. Chưa triển khai trực tiếp lên tài khoản Production của bạn.
