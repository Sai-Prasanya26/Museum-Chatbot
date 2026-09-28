const fs = require('fs');
const path = require('path');
const https = require('https');

async function getCommonsDirectUrl(fileTitle) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MuseumExplorerProject/1.0' } });
  const data = await res.json();
  const pages = Object.values(data.query.pages);
  if (pages.length > 0 && pages[0].imageinfo && pages[0].imageinfo[0]) {
    return pages[0].imageinfo[0].url;
  }
  return null;
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MuseumExplorerProject/1.0 (educational research)' } }, (res) => {
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
  const titles = [
    "File:Entrance Kaziranga.JPG",
    "File:Kaziranga Orchid and Biodiversity Park Museum, Kaziranga, Assam.jpg",
    "File:Kamarajar House at Virudhunagar.JPG",
    "File:Hazarduari Palace, Murshidabad illuminated at night.jpg",
    "File:National Gallery of Modern Art (NGMA), New Delhi (1).jpg"
  ];

  for (const t of titles) {
    const directUrl = await getCommonsDirectUrl(t);
    console.log(`${t} -> ${directUrl}`);
  }

  // Let's download Kaziranga
  const kazirangaUrl = await getCommonsDirectUrl("File:Entrance Kaziranga.JPG");
  if (kazirangaUrl) {
    const dest1 = path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'museums', 'kaziranga-forest-museum.jpg');
    const dest2 = path.join(__dirname, '..', '..', 'frontend', 'images', 'museums', 'kaziranga-forest-museum.jpg');
    await downloadFile(kazirangaUrl, dest1);
    fs.copyFileSync(dest1, dest2);
    console.log("Downloaded kaziranga-forest-museum.jpg:", fs.statSync(dest1).size, "bytes");
  }
}

run();
