# Hoa Lụa Thu Hiền V1.3.3 – Quản lý Meta Pixel trong ADMIN

## Cách dùng

1. Vào **/admin/** và đăng nhập.
2. Chọn **Nội dung website → Marketing & Meta Pixel**.
3. Chọn **Hiển thị** ở ô Đo lường Meta Pixel để bật, hoặc **Tạm ẩn** để tắt.
4. Dán **Pixel ID** (dãy 8–20 chữ số), mỗi dòng **một ID**, tối đa 5; không dán script.
5. Bấm **Lưu bản nháp**, sau đó **Xem trước** để kiểm tra thiết lập và giao diện (bản xem trước KHÔNG gửi sự kiện Meta).
6. Bấm **Xuất bản website**. Các lần truy cập mới sẽ áp dụng Pixel đã xuất bản sau khi khách chấp thuận cookie.
7. Kiểm tra Events Manager → Test events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, CompleteRegistration.

## Xóa và thay Pixel

- **Xóa**: xóa dòng ID hoặc xóa toàn bộ danh sách, lưu nháp và xuất bản.
- **Thay**: ghi đè ID cũ bằng ID mới, lưu nháp và xuất bản.
- **Tạm ngừng**: chuyển Đo lường Meta Pixel sang **Tạm ẩn**; không cần xóa danh sách ID.
- Chỉ những lần tải trang mới sau khi xuất bản mới áp dụng danh sách mới; trang khách đang mở không được ép cập nhật.

## Triển khai lên GitHub & Cloudflare Pages

- Đây là bộ mã nguồn **đầy đủ**, không phải file patch. Upload nội dung bên trong ZIP lên **gốc** repository `binhvb94/hoa-lua-thu-hien`, commit vào `main`; kiểm tra các file có tên trùng được cập nhật. Không upload riêng thư mục `dist` vào gốc.
- Không cần thêm SQL migration, không cần chỉnh D1/R2/ADMIN_PASSWORD_HASH. Sử dụng bảng `site_cms` sẵn có từ migration 0003.
- Sau khi Cloudflare báo Deployments → **Success**, refresh ADMIN bằng Ctrl+Shift+R.
- Sao lưu repository trước khi ghi đè; đặc biệt nếu bạn đã sửa code trực tiếp trên GitHub sau V1.3.2 thì cần so sánh trước khi thay toàn bộ.

## An toàn và giới hạn

- Chỉ hỗ trợ Meta Pixel chạy trên **trình duyệt** sau khi khách đồng ý; không phải Conversions API (CAPI).
- **Pixel ID không phải bí mật**, nhưng không chèn access token/CAPI token vào CMS.
- Website chỉ tải `fbevents.js` của Meta; không thực thi script nhập trong ADMIN.
- Khi có nhiều Pixel, các sự kiện gửi riêng đến từng ID với `trackSingle` để không phụ thuộc `track` chung. Các hệ thống khác tự gắn Pixel vào website có thể gây trùng đo lường; hãy kiểm tra Events Manager.
- Bản Xem trước CMS cố ý không phát sự kiện Meta Pixel; kiểm thử bằng website công khai, sau khi đã xuất bản và đã đồng ý theo dõi.
- Trình duyệt chặn theo dõi hoặc khách không chấp thuận thì Meta có thể không nhận sự kiện.
- `Purchase` ở website này là **đơn COD được API lưu thành công**, không phải đơn đã thu tiền; cần đối chiếu với đơn thực tế.
- **Để kết thúc nhận đơn mẫu**, cần đổi `previewMode` trong `config.js` thành `false` sau khi hoàn tất thay sản phẩm thật và kiểm thử nghiệp vụ.
