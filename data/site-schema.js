// Dữ liệu và trường biên tập công khai. Không chứa secrets / token.
// Backend xác thực độc lập các trường theo schema này.
export const SECTIONS = {
  branding: {label:'Nhận diện thương hiệu',description:'Logo, tên cửa hàng, thanh thông báo, màu chủ đạo.',fields:{
    logo:{label:'Logo (ảnh SVG/PNG/WebP)',kind:'image',max:900},
    name:{label:'Tên thương hiệu',max:70}, accent:{label:'Dòng tên nhấn mạnh',max:60}, tagline:{label:'Khẩu hiệu dưới logo',max:90},
    announcement:{label:'Thông báo đầu trang',max:170}, announcementLink:{label:'Chữ nút trong thông báo',max:60},
    primaryColor:{label:'Màu chủ đạo',kind:'color'},
  }},
  navigation:{label:'Menu điều hướng',description:'Đổi tên 4 mục menu, giữ nguyên điểm đến và chức năng.',fields:{home:{label:'Menu Trang chủ',max:40},products:{label:'Menu Sản phẩm',max:40},story:{label:'Menu Giới thiệu',max:40},contact:{label:'Menu Liên hệ',max:40}}},
  hero: {label:'Banner trang chủ',description:'Ảnh lớn, tiêu đề, mô tả, cỡ chữ riêng cho máy tính/điện thoại và nút kêu gọi.',fields:{
    eyebrow:{label:'Dòng chữ nhỏ phía trên',max:90},titleStart:{label:'Tiêu đề – phần đầu',max:110},titleEm:{label:'Tiêu đề – phần in nghiêng',max:90},titleEnd:{label:'Tiêu đề – phần cuối',max:110},
    fontSizeDesktop:{label:'Cỡ chữ tối đa – máy tính (px)',kind:'number',max:3,minValue:40,maxValue:80},
    fontSizeMobile:{label:'Cỡ chữ tiêu đề – điện thoại (px)',kind:'number',max:3,minValue:30,maxValue:56},
    description:{label:'Mô tả banner',kind:'textarea',max:500}, image:{label:'Ảnh banner chính',kind:'image',max:900},imageAlt:{label:'Mô tả ảnh (SEO)',max:160},
    primaryLabel:{label:'Nút chính',max:70}, secondaryLabel:{label:'Nút phụ',max:70}, badge:{label:'Nhãn nhỏ trên ảnh',max:80},
  }},
  benefits: {label:'Điểm nổi bật',description:'Bốn lý do khách nên lựa chọn cửa hàng.',fields:{
    title1:{label:'Lợi ích 1 – tiêu đề',max:70},desc1:{label:'Lợi ích 1 – mô tả',max:140},
    title2:{label:'Lợi ích 2 – tiêu đề',max:70},desc2:{label:'Lợi ích 2 – mô tả',max:140},
    title3:{label:'Lợi ích 3 – tiêu đề',max:70},desc3:{label:'Lợi ích 3 – mô tả',max:140},
    title4:{label:'Lợi ích 4 – tiêu đề',max:70},desc4:{label:'Lợi ích 4 – mô tả',max:140},
  }},
  categories: {label:'Danh mục hoa',description:'Tiêu đề danh mục và ba hình đại diện. Lọc sản phẩm vẫn giữ nguyên.',fields:{
    heading:{label:'Tiêu đề – phần đầu',max:90},emphasis:{label:'Tiêu đề – phần nhấn',max:70},description:{label:'Mô tả ngắn',max:240},
    image1:{label:'Ảnh Hoa lụa',kind:'image',max:900},image2:{label:'Ảnh Hoa cao su',kind:'image',max:900},image3:{label:'Ảnh Hoa decor',kind:'image',max:900},
  }},
  collection: {label:'Khu vực sản phẩm',description:'Tên và mô tả phần danh sách sản phẩm.',fields:{
    eyebrow:{label:'Nhãn nhỏ',max:80},heading:{label:'Tiêu đề – phần đầu',max:90},emphasis:{label:'Tiêu đề – phần nhấn',max:70},description:{label:'Mô tả sản phẩm',max:240},
  }},
  story: {label:'Câu chuyện thương hiệu',description:'Nội dung giới thiệu, hai ảnh và nút liên hệ.',fields:{
    eyebrow:{label:'Nhãn nhỏ',max:90},heading:{label:'Tiêu đề – phần đầu',max:140},emphasis:{label:'Tiêu đề – phần nhấn',max:90},
    paragraph1:{label:'Đoạn giới thiệu 1',kind:'textarea',max:1000},paragraph2:{label:'Đoạn giới thiệu 2',kind:'textarea',max:1000},
    image1:{label:'Ảnh lớn',kind:'image',max:900},image2:{label:'Ảnh nhỏ',kind:'image',max:900},cta:{label:'Chữ nút liên hệ',max:70},
  }},
  membership: {label:'Khu vực đăng ký',description:'Chỉnh chữ quảng bá; chức năng đăng ký vẫn chịu kiểm soát của hệ thống.',fields:{
    eyebrow:{label:'Nhãn nhỏ',max:90},heading:{label:'Tiêu đề – phần đầu',max:100},emphasis:{label:'Tiêu đề – phần nhấn',max:100},description:{label:'Đoạn mô tả',kind:'textarea',max:500},
  }},
  contact: {label:'Liên hệ và mạng xã hội',description:'Thông tin để khách liên hệ qua Facebook/Zalo.',fields:{
    eyebrow:{label:'Nhãn nhỏ',max:90},heading:{label:'Tiêu đề – phần đầu',max:100},emphasis:{label:'Tiêu đề – phần nhấn',max:100},description:{label:'Lời mời liên hệ',kind:'textarea',max:500},
    facebookUrl:{label:'Đường dẫn Facebook (https://)',kind:'url',max:900},zaloPhone:{label:'Số điện thoại Zalo',kind:'phone',max:11},
    facebookLabel:{label:'Chú thích Facebook',max:100},
  }},
  marketing:{label:'Marketing & Meta Pixel',description:'Quản lý Pixel ID (mỗi dòng một ID gồm 8–20 chữ số, tối đa 5). Không dán mã JavaScript. Pixel chỉ tải khi khách đồng ý; trong bản Xem trước, Pixel luôn tắt. Thay đổi chỉ có hiệu lực sau Xuất bản.',fields:{
    enabled:{label:'Đo lường Meta Pixel',kind:'select'},
    pixelIds:{label:'Danh sách Pixel ID – mỗi dòng một ID',kind:'pixel-ids',max:250},
  }},
  visibility:{label:'Ẩn / hiện từng khu vực',description:'Ẩn phần không cần thiết mà không xóa dữ liệu.',fields:{benefits:{label:'Dải lợi ích',kind:'select'},categories:{label:'Danh mục hoa',kind:'select'},story:{label:'Câu chuyện thương hiệu',kind:'select'},membership:{label:'Khu vực đăng ký',kind:'select'},contact:{label:'Khối liên hệ',kind:'select'}}},
  footer: {label:'Chân trang',description:'Mô tả cửa hàng và dòng ký tên cuối trang.',fields:{
    summary:{label:'Giới thiệu ngắn ở chân trang',kind:'textarea',max:400},signature:{label:'Dòng chữ cuối trang',max:150},
  }},
};
export const DEFAULT_SITE = {
  branding:{logo:'/assets/logo.svg',name:'Hoa Lụa',accent:'Thu Hiền',tagline:'VẺ ĐẸP THEO NĂM THÁNG',announcement:'Một nhành hoa nhỏ, một góc nhà xinh',announcementLink:'Khám phá bộ sưu tập',primaryColor:'#8d4157'},
  navigation:{home:'Trang chủ',products:'Sản phẩm',story:'Về chúng tôi',contact:'Liên hệ'},
  hero:{eyebrow:'HOA LỤA THU HIỀN',titleStart:'Gửi một chút',titleEm:'dịu dàng',titleEnd:'vào không gian sống.',fontSizeDesktop:'56',fontSizeMobile:'38',description:'Những nhành hoa bền đẹp theo thời gian, mang sự tinh tế và cảm hứng đến từng góc nhà thân thương.',image:'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1250&q=88',imageAlt:'Những nhành hoa tông hồng nhẹ nhàng',primaryLabel:'Khám phá sản phẩm',secondaryLabel:'Câu chuyện Thu Hiền',badge:'ĐẸP TỪ NHỮNG ĐIỀU BÌNH DỊ'},
  benefits:{title1:'Vẻ đẹp bền lâu',desc1:'Không lo hoa tàn theo mùa',title2:'Đa dạng phong cách',desc2:'Từ nhẹ nhàng đến sang trọng',title3:'Tư vấn tận tâm',desc3:'Chọn hoa hợp với không gian',title4:'Mua hàng thuận tiện',desc4:'Đặt hàng trực tiếp trên website'},
  categories:{heading:'Mỗi loài hoa,',emphasis:'một nét riêng',description:'Một chút ngọt ngào cho những ngày bình thường.',image1:'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=850&q=80',image2:'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=850&q=80',image3:'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=850&q=80'},
  collection:{eyebrow:'THE FLOWER EDIT',heading:'Góc hoa',emphasis:'Thu Hiền',description:'Khám phá những mẫu hoa được chọn lọc theo cảm hứng.'},
  story:{eyebrow:'CHÚT TÂM TÌNH',heading:'Giữ lại vẻ đẹp của',emphasis:'những ngày thường.',paragraph1:'Ở Hoa Lụa Thu Hiền, chúng tôi tin rằng không cần một dịp đặc biệt để dành tặng bản thân và những người thương một đóa hoa.',paragraph2:'Từ những cành hoa mềm mại đến các kiểu hoa trang trí hiện đại, mỗi lựa chọn đều là cách bạn kể câu chuyện riêng cho tổ ấm của mình.',image1:'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=1000&q=85',image2:'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=600&q=80',cta:'Kết nối với Thu Hiền'},
  membership:{eyebrow:'GÓC NHỎ DÀNH RIÊNG CHO BẠN',heading:'Đăng ký nhận',emphasis:'tin hoa xinh.',description:'Trở thành thành viên để nhận thông tin về mẫu hoa mới và những ưu đãi từ Thu Hiền.'},
  contact:{eyebrow:'LUÔN SẴN SÀNG LẮNG NGHE',heading:'Cần một chút',emphasis:'cảm hứng?',description:'Nhắn cho Thu Hiền để được tư vấn lựa chọn loại hoa, màu sắc và phong cách phù hợp với không gian của bạn.',facebookUrl:'https://www.facebook.com/profile.php?id=61595872285947',zaloPhone:'',facebookLabel:'Fanpage Hoa Lụa Thu Hiền'},
  marketing:{enabled:'no',pixelIds:''},
  visibility:{benefits:'yes',categories:'yes',story:'yes',membership:'yes',contact:'yes'},
  footer:{summary:'Những nhành hoa mang nét tinh tế, dịu dàng và cảm hứng cho không gian sống.',signature:'Made for little moments of beauty ✳'},
};
export function mergedSite(source={}) {
  const result={};
  for(const k of Object.keys(DEFAULT_SITE)) result[k]={...DEFAULT_SITE[k],...(source?.[k]&&typeof source[k]==='object'&&!Array.isArray(source[k])?source[k]:{})};
  return result;
}
