# Hoa Lụa Thu Hiền — khắc phục đăng nhập ADMIN (V1.2.1)

Nguyên nhân đã xác nhận trong log: Cloudflare Workers WebCrypto chỉ chấp nhận PBKDF2 tối đa 100.000 vòng; mật khẩu cũ được tạo ở 310.000 vòng. Không liên quan đến cấu trúc D1.

## Khắc phục ngay (KHÔNG cần thay đổi mã đang chạy)

1. Dùng `scripts/hash-password.mjs` bản V1.2.1 ở máy cá nhân, hoặc trong bộ V1.2 cũ đổi `rounds=310000` thành `rounds=100000`.
2. Mở PowerShell tại thư mục mã nguồn: `node .\scripts\hash-password.mjs`. Nhập mật khẩu ADMIN của bạn (có thể dùng lại mật khẩu dài hiện có) để tạo hash **mới**; hash sẽ bắt đầu bằng `pbkdf2_sha256$100000$`.
3. Cloudflare Account `Hoa Lua Thu Hien` → Workers & Pages → `hoa-lua-thu-hien` → Settings → Production → Variables and secrets → sửa `ADMIN_PASSWORD_HASH` để thay bằng toàn bộ hash **mới**. Vẫn chọn loại **Secret**. Không dán mật khẩu gốc.
4. Save rồi redeploy Production mới nhất, kiểm tra `/admin/` và đăng nhập bằng mật khẩu vừa dùng tạo hash.
5. Để tránh tái diễn khi đặt lại mật khẩu, cập nhật file `scripts/hash-password.mjs` trong GitHub bằng file bản V1.2.1. Không bắt buộc làm trước bước 2–4: trình kiểm tra mật khẩu hiện tại đã đọc số vòng từ chuỗi hash.

**Chú ý:** 100.000 vòng PBKDF2-SHA256 là giải pháp tương thích tạm thời, có độ chống dò mật khẩu ngoại tuyến thấp hơn cấu hình 310.000 vòng; cần dùng mật khẩu dài, ngẫu nhiên và duy nhất. Giới hạn 5 lần đăng nhập sai/15 phút của V1.2 giúp giảm nguy cơ dò trực tuyến nhưng không thay thế phương án hash mạnh hơn. Về lâu dài nên cân nhắc nâng cấp thuật toán xác thực phù hợp giới hạn Workers hoặc dùng dịch vụ xác thực quản lý chuyên biệt. Không đưa mật khẩu gốc hoặc hash lên GitHub hoặc vào chat.

D1, R2 và SQL không cần thay đổi.
