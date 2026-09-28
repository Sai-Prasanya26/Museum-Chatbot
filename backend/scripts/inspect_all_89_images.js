const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function inspectAll() {
  const [rows] = await pool.query('SELECT id, name, state, city, image FROM museums ORDER BY id ASC');
  console.log(`Auditing all ${rows.length} museums in current database...`);

  const issues = [];
  const valid = [];

  for (const r of rows) {
    const fullPath = path.join(__dirname, '..', '..', 'frontend', r.image);
    const exists = fs.existsSync(fullPath);
    let size = 0;
    let isJpeg = false;

    if (exists) {
      size = fs.statSync(fullPath).size;
      // Check magic numbers for JPEG (FF D8 FF)
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(fullPath, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        isJpeg = true;
      }
    }

    const item = {
      id: r.id,
      name: r.name,
      state: r.state,
      city: r.city,
      image: r.image,
      exists,
      size,
      isJpeg
    };

    if (!exists || size < 2000 || !isJpeg) {
      issues.push(item);
    } else {
      valid.push(item);
    }
  }

  console.log(`Valid images count: ${valid.length}`);
  console.log(`Issues count: ${issues.length}`);
  if (issues.length > 0) {
    console.log("Issues details:", JSON.stringify(issues, null, 2));
  }

  await pool.end();
}

inspectAll().catch(console.error);
