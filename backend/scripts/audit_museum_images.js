const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function createSnapshot() {
  const [rows] = await pool.query('SELECT id, name, state, city, image FROM museums ORDER BY id ASC');
  const targetPath = path.join(__dirname, '..', 'data', 'museums_before_image_mapping.json');
  fs.writeFileSync(targetPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Saved snapshot of ${rows.length} museums to: ${targetPath}`);
}

async function auditImages() {
  await createSnapshot();
  const [museums] = await pool.query('SELECT id, name, state, city, image FROM museums ORDER BY id ASC');
  console.log(`Auditing ${museums.length} museums...`);

  const results = [];
  const missingFiles = [];

  for (const m of museums) {
    // Check path
    let relPath = m.image;
    let fullPathFrontend = path.join(__dirname, '..', '..', 'frontend', relPath);
    let exists = fs.existsSync(fullPathFrontend);
    let size = 0;
    if (exists) {
      size = fs.statSync(fullPathFrontend).size;
    } else {
      missingFiles.push({ id: m.id, name: m.name, image: m.image });
    }

    results.push({
      id: m.id,
      name: m.name,
      state: m.state,
      city: m.city,
      image: m.image,
      exists,
      fileSize: size
    });
  }

  console.log(`Missing image files count: ${missingFiles.length}`);
  if (missingFiles.length > 0) {
    console.log("Missing files:", missingFiles);
  }

  // Let's check duplicates
  const imageCounts = {};
  results.forEach(r => {
    imageCounts[r.image] = (imageCounts[r.image] || 0) + 1;
  });

  const duplicates = Object.entries(imageCounts).filter(([img, count]) => count > 1);
  console.log(`Duplicate image paths count: ${duplicates.length}`);
  duplicates.forEach(([img, count]) => {
    console.log(`Duplicate: ${img} (${count} museums)`);
  });

  await pool.end();
}

auditImages().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
