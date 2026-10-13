const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * 只做一件事：把 logo.png 解出来看 alpha。
 * 首页/关于页在深色底上放这个图，如果它是「白底方图」，四角就会糊出一块白——
 * 这是用户明确指出的问题，所以这里直接断「方形透明圆」，防止有人把方图换回来。
 */
function decodeRGBA(buf) {
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`logo.png 必须是 8bit RGBA，实际 bitDepth=${bitDepth} colorType=${colorType}`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const cur = raw[p++];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v;
      if (filter === 0) v = cur;
      else if (filter === 1) v = cur + a;
      else if (filter === 2) v = cur + b;
      else if (filter === 3) v = cur + ((a + b) >> 1);
      else {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v = cur + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, data: out, alphaAt: (x, y) => out[y * stride + x * bpp + 3] };
}

describe('logo 资源', () => {
  const img = decodeRGBA(fs.readFileSync(path.join(__dirname, '..', 'miniprogram', 'assets', 'logo.png')));

  test('是正方形、带 alpha 的图', () => {
    expect(img.width).toBe(img.height);
    expect(img.width).toBeGreaterThanOrEqual(120);
  });

  test('四角透明、圆心实心、圆内切到边框（是圆不是方）', () => {
    const { width: w, height: h, alphaAt } = img;
    const c = Math.floor((w - 1) / 2);
    // 1) 四角必须完全透明：深色底上不该再出现白方块
    expect([alphaAt(0, 0), alphaAt(w - 1, 0), alphaAt(0, h - 1), alphaAt(w - 1, h - 1)]).toEqual([0, 0, 0, 0]);
    // 2) 圆心实心
    expect(alphaAt(c, c)).toBe(255);
    // 3) 圆几乎内切：离四条边 3px 的点必须是实心
    for (const a of [alphaAt(c, 3), alphaAt(c, h - 4), alphaAt(3, c), alphaAt(w - 4, c)]) expect(a).toBe(255);
    // 4) 对角线 75% 半宽处已出圆：证明是圆不是方
    const d = Math.round(0.75 * (w / 2));
    expect(alphaAt(c - d, c - d)).toBe(0);
    expect(alphaAt(c + d, c + d)).toBe(0);
  });
});
