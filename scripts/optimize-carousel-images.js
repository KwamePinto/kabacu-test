/**
 * One-time script: resize + compress carousel hero images.
 * Run: node scripts/optimize-carousel-images.js
 */
const sharp = require('sharp');
const path  = require('path');

const imgDir = path.join(__dirname, '..', 'public', 'assets', 'images');

const tasks = [
  {
    src: '3d-render-money-transfer-mobile-banking-online.jpg',
    out: 'hero-slide-1.jpg',
  },
  {
    src: 'black-lady-texting-her-phone-park.jpg',
    out: 'hero-slide-2.jpg',
  },
  {
    src: 'happy-joyous-man-clenches-fist-with-triumph-watches-football-match-online-focused-smartphone-device-wears-round-spectacles.jpg',
    out: 'hero-slide-3.jpg',
  },
];

(async () => {
  for (const t of tasks) {
    const srcPath = path.join(imgDir, t.src);
    const outPath = path.join(imgDir, t.out);

    const info = await sharp(srcPath)
      .resize({
        width:  1400,
        height: 700,
        fit:    'cover',
        position: 'centre',
      })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(outPath);

    const { size } = require('fs').statSync(outPath);
    const srcSize  = require('fs').statSync(srcPath).size;
    const pct      = Math.round((1 - size / srcSize) * 100);

    console.log(`✓  ${t.out}  ${Math.round(srcSize/1024)}KB → ${Math.round(size/1024)}KB  (${pct}% smaller)`);
  }

  console.log('\nDone. Update index.ejs to use the new filenames.');
})();
