# Hoa Lụa Thu Hiền V1.3.6 – URL sản phẩm sạch và mua hàng từ trang SEO

## Lỗi V1.3.5 được sửa

- Trên trang chủ: click ảnh sản phẩm và nút Xem chi tiết bây giờ chuyển hẳn tới `/san-pham/ten-san-pham/` (không còn `#san-pham/...`).
- Trên trang sản phẩm SEO: thêm giỏ hàng ngay tại đây, dùng chung giỏ hàng của trang chủ; bấm **Xem giỏ hàng và đặt hàng COD** để trở về trang chủ và mở giỏ tự động bằng `/?mo_gio=1`.
- Meta Pixel PageView, ViewContent và AddToCart trên trang sản phẩm SEO tuân thủ lựa chọn đồng ý theo dõi của người dùng.
- Liên kết cũ có `/#san-pham/slug` tự chuyển về URL SEO sạch.
- Các điều hướng cuộn trong trang chủ dùng anchor nội bộ nhưng tự dọn `#` khỏi thanh địa chỉ để URL vẫn là `/`.
- Không thay đổi bảng D1, dữ liệu sản phẩm, đơn hàng, CMS, Pixel, hoặc cấu hình Cloudflare.

## Cách triển khai

1. Sao lưu repository hiện tại `binhvb94/hoa-lua-thu-hien` (GitHub → Code → Download ZIP).
2. Giải nén bộ FULL và kéo **nội dung bên trong** (không kéo thư mục bao ngoài) vào GitHub → Add file → Upload files. Giữ cấu trúc thư mục, chọn commit vào `main`.
3. Cloudflare Pages sẽ tự build. Kiểm tra Deployments = Success, rồi bấm Ctrl+Shift+R.
4. Kiểm tra một sản phẩm thật: click ảnh → URL `/san-pham/.../` → Thêm vào giỏ → Xem giỏ hàng và đặt hàng COD → ADMIN Đơn hàng.
5. Kiểm tra sitemap.xml đã gửi ở Google Search Console. Không cần gửi lại nếu đường dẫn giữ nguyên.

**Không chạy SQL mới.** **Không đổi biến ENABLE_ORDERS/ENABLE_REGISTRATION hoặc ADMIN_PASSWORD_HASH**. Bộ FULL đã đặt `previewMode: false` để giữ nhận đơn/đăng ký như Production của bạn; không ghi ngược về `true`.

## Lưu ý

Các anchor `#bo-suu-tap` và `#cau-chuyen` vốn chỉ là cuộn tới vùng trang chủ, không phải URL sản phẩm. Bản này vẫn giữ khả năng cuộn đúng vị trí, nhưng dọn dấu # sau khi click.

Bản này đã qua kiểm tra cục bộ, chưa triển khai hoặc xác nhận trên Cloudflare thực tế của bạn.
