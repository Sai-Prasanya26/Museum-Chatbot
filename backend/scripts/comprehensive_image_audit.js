const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function comprehensiveAudit() {
  const [museums] = await pool.query('SELECT id, name, state, city, image FROM museums ORDER BY id ASC');
  console.log(`Auditing all ${museums.length} museums...`);

  const report = [];

  for (const m of museums) {
    const fullPath = path.join(__dirname, '..', '..', 'frontend', m.image);
    const exists = fs.existsSync(fullPath);
    let size = 0;
    let format = 'UNKNOWN';

    if (exists) {
      size = fs.statSync(fullPath).size;
      const buf = Buffer.alloc(16);
      const fd = fs.openSync(fullPath, 'r');
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);

      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
        format = 'JPEG';
      } else if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
        format = 'PNG';
      } else if (buf.slice(0, 14).toString('utf8').includes('<!DOCTYPE')) {
        format = 'HTML_ERROR';
      }
    }

    report.push({
      id: m.id,
      name: m.name,
      state: m.state,
      city: m.city,
      image: m.image,
      exists,
      size,
      format
    });
  }

  // Count by format
  const formats = {};
  report.forEach(r => formats[r.format] = (formats[r.format] || 0) + 1);
  console.log("Format distribution:", formats);

  const missing = report.filter(r => !r.exists);
  console.log(`Missing count: ${missing.length}`, missing);

  const htmlErrors = report.filter(r => r.format === 'HTML_ERROR');
  console.log(`HTML error files count: ${htmlErrors.length}`, htmlErrors);

  const pngFiles = report.filter(r => r.format === 'PNG');
  console.log(`PNG disguised as JPG count: ${pngFiles.length}`, pngFiles.map(p => ({ id: p.id, name: p.name, image: p.image })));

  // Write full raw audit output to json for inspection
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'raw_image_audit.json'), JSON.stringify(report, null, 2), 'utf8');

  await pool.end();
}

comprehensiveAudit().catch(console.error);
