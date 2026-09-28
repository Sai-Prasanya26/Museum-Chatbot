const fs = require('fs');
const files = [
  "national-gallery-of-modern-art.jpg",
  "neutral-museum-heritage-2.jpg",
  "lucknow-museum.jpg",
  "state-museum-lucknow.jpg",
  "buddhist-sites-nagarjunakonda.jpg",
  "firoz-shah-palace-complex.jpg",
  "hazarduari-temple.jpg",
  "maritime-museum-monuments.jpg"
];

files.forEach(f => {
  const p = "frontend/assets/images/museums/" + f;
  if (fs.existsSync(p)) {
    const b = fs.readFileSync(p).slice(0, 32);
    console.log(`${f} (${fs.statSync(p).size} bytes):`);
    console.log(`  Hex: ${b.toString('hex')}`);
    console.log(`  Ascii: ${b.toString('utf8').replace(/[^\x20-\x7E]/g, '.')}`);
  } else {
    console.log(`${f}: NOT FOUND`);
  }
});
