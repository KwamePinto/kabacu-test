/**
 * One-time script: resize + compress site imagery with sharp.
 * Run: node scripts/optimize-carousel-images.js
 *
 * Batches:
 *   - carousel : 1400×700 landscape hero slides (JPEG)
 *   - category : 900×900 square cards — WebP + progressive JPEG fallback
 *                (one file covers both the tall desktop bento cards and the
 *                 small mobile banner thumbs via object-fit: cover)
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const imgDir = path.join(__dirname, '..', 'public', 'assets', 'images');

const batches = [
  {
    name: 'carousel',
    resize: { width: 1400, height: 700, fit: 'cover', position: 'centre' },
    formats: [{ ext: 'jpg', opts: { quality: 82, progressive: true, mozjpeg: true } }],
    tasks: [
      { src: '3d-render-money-transfer-mobile-banking-online.jpg', out: 'hero-slide-1' },
      { src: 'black-lady-texting-her-phone-park.jpg',              out: 'hero-slide-2' },
      { src: 'happy-joyous-man-clenches-fist-with-triumph-watches-football-match-online-focused-smartphone-device-wears-round-spectacles.jpg', out: 'hero-slide-3' },
    ],
  },
  {
    name: 'category',
    resize: { width: 900, height: 900, fit: 'cover', position: 'centre' },
    formats: [
      { ext: 'webp', opts: { quality: 78, effort: 5 } },
      { ext: 'jpg',  opts: { quality: 80, progressive: true, mozjpeg: true } },
    ],
    tasks: [
      // databundles is a busy landscape graphic on white with content edge-to-
      // edge. Rather than cover-crop it, render it onto a canvas shaped like the
      // target container (contain on white) so the FULL graphic fills the box.
      //   - tall  → desktop bento card (~425×574, portrait 3:4)
      //   - wide  → mobile category banner (140×120, ~7:6 landscape)
      // background matches the graphic's own faint cool-white tint (#f7f8fb)
      // so the contain padding blends instead of reading as blank white space.
      { src: 'databundles.jpeg', out: 'cat-databundles-tall', canvas: { w: 850, h: 1148 }, background: '#f7f8fb' },
      { src: 'databundles.jpeg', out: 'cat-databundles',      canvas: { w: 840, h: 720  }, background: '#f7f8fb' },
      { src: 'electronics.jpeg', out: 'cat-electronics' },
      { src: 'courses.jpeg',     out: 'cat-courses'     },
    ],
  },
];

(async () => {
  for (const batch of batches) {
    console.log(`\n# ${batch.name}`);

    for (const t of batch.tasks) {
      const srcPath = path.join(imgDir, t.src);

      if (!fs.existsSync(srcPath)) {
        console.warn(`!  skipped — source not found: ${t.src}`);
        continue;
      }

      const srcSize = fs.statSync(srcPath).size;
      const outputs = [];

      for (const fmt of batch.formats) {
        const outPath = path.join(imgDir, `${t.out}.${fmt.ext}`);

        let pipe;
        if (t.canvas) {
          // Contain the whole graphic onto a container-shaped canvas (no content
          // crop). object-fit:cover then fills the box, trimming only the white.
          pipe = sharp(srcPath)
            .flatten({ background: t.background })
            .resize({ width: t.canvas.w, height: t.canvas.h, fit: 'contain', background: t.background });
        } else {
          pipe = sharp(srcPath).resize(batch.resize);
        }

        await pipe[fmt.ext === 'webp' ? 'webp' : 'jpeg'](fmt.opts).toFile(outPath);
        outputs.push(`${t.out}.${fmt.ext} ${Math.round(fs.statSync(outPath).size / 1024)}KB`);
      }

      console.log(`✓  ${t.src}  ${Math.round(srcSize / 1024)}KB  →  ${outputs.join(' · ')}`);
    }
  }

  console.log('\nDone.');
})().catch(err => { console.error(err); process.exit(1); });
