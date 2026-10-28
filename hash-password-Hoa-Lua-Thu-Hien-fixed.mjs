// Sử dụng trên Windows PowerShell / VS Code. KHÔNG lưu mật khẩu/chuỗi hash vào GitHub.
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
 const password=await rl.question('Nhap mat khau ADMIN moi (toi thieu 14 ky tu): ');
 if(password.length<14||password.length>128)throw new Error('Mat khau phai co tu 14 den 128 ky tu.');
 // Cloudflare Workers WebCrypto PBKDF2 rejects > 100000 iterations.
 const salt=randomBytes(16).toString('hex'),rounds=100000;
 const hash=pbkdf2Sync(password,Buffer.from(salt,'hex'),rounds,32,'sha256').toString('hex');
 console.log('\nSao chep CHI gia tri ben duoi vao Cloudflare secret ADMIN_PASSWORD_HASH:');
 console.log(`pbkdf2_sha256$${rounds}$${salt}$${hash}`);
 console.log('KHONG ghi gia tri nay vao config.js / GitHub.');
}finally{rl.close()}
