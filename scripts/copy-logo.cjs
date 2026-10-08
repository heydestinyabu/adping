const fs = require('fs');
const path = require('path');

const src = '/Users/elite/Desktop/Projects/Laiki-pay/mobile-app/assets/splash/laikipay_logo.png';
const dest = path.join(__dirname, '../client/public/laikipay_logo.png');

try {
  if (fs.existsSync(src)) {
    const data = fs.readFileSync(src);
    fs.writeFileSync(dest, data);
    console.log('SUCCESS_COPIED_LOGO_BYTES:', data.length);
    console.log('BASE64_PREVIEW:', data.toString('base64').slice(0, 100));
  } else {
    console.log('SRC_NOT_FOUND');
  }
} catch (e) {
  console.error('ERROR:', e.message);
}
