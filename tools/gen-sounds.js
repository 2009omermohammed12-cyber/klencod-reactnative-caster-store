// يولّد ملفات أصوات الإشعارات (WAV). تشغيل: node tools/gen-sounds.js
const fs = require('fs');
const path = require('path');
const SR = 22050;

function render(seq) {
  const out = [];
  for (const [f, d, g = 0.6] of seq) {
    const n = Math.floor(SR * d);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const attack = Math.min(1, i / (SR * 0.01));
      const env = attack * Math.exp((-4 * i) / n);
      const v = f === 0 ? 0 : g * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) / 1.3;
      out.push(Math.max(-1, Math.min(1, v)));
    }
  }
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(s * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const SOUNDS = {
  chime: [[880, 0.25], [1320, 0.55]],
  bell: [[1046, 0.9, 0.7]],
  pop: [[600, 0.08], [900, 0.14]],
  ding: [[1568, 0.8]],
  alert: [[880, 0.15], [0, 0.05], [880, 0.15], [0, 0.05], [880, 0.3]],
  melody: [[523, 0.15], [659, 0.15], [784, 0.15], [1046, 0.45]],
  soft: [[440, 0.3, 0.45], [554, 0.6, 0.45]],
  horn: [[330, 0.35, 0.7], [0, 0.05], [330, 0.55, 0.7]],
};

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
for (const [name, seq] of Object.entries(SOUNDS)) {
  fs.writeFileSync(path.join(dir, `${name}.wav`), wav(render(seq)));
  console.log('wrote', name);
}
