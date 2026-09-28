const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MuseumExplorerProject/1.0 (educational research; mailto:admin@museumexplorer.in)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });
    }).on('error', reject);
  });
}

async function run() {
  const url = "https://upload.wikimedia.org/wikipedia/commons/4/4e/Kaziranga_Orchid_and_Biodiversity_Park_Museum%2C_Kaziranga%2C_Assam.jpg";
  const filename = "kaziranga-forest-museum.jpg";
  const destAssets = path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'museums', filename);
  const destImages = path.join(__dirname, '..', '..', 'frontend', 'images', 'museums', filename);

  try {
    await downloadFile(url, destAssets);
    fs.copyFileSync(destAssets, destImages);
    console.log("Successfully downloaded Kaziranga image:", fs.statSync(destAssets).size, "bytes");
  } catch (err) {
    console.error("Kaziranga download failed:", err.message);
    // Try fallback entrance
    const url2 = "https://upload.wikimedia.org/wikipedia/commons/d/d4/Entrance_Kaziranga.JPG";
    try {
      await downloadFile(url2, destAssets);
      fs.copyFileSync(destAssets, destImages);
      console.log("Successfully downloaded Kaziranga Entrance image:", fs.statSync(destAssets).size, "bytes");
    } catch (err2) {
      console.error("Kaziranga fallback download failed:", err2.message);
    }
  }
}

run();
