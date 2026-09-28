const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MuseumExplorerProject/1.0 (educational research; mailto:admin@museumexplorer.in)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
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

async function fetchWikiImage(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MuseumExplorerProject/1.0' } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.originalimage ? json.originalimage.source : (json.thumbnail ? json.thumbnail.source : null);
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log("Checking and downloading authentic images...");

  const targets = [
    {
      id: 6,
      name: "National Gallery of Modern Art",
      wikiTitle: "National_Gallery_of_Modern_Art",
      filename: "national-gallery-of-modern-art.jpg",
      directUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/National_Gallery_of_Modern_Art_%28NGMA%29%2C_New_Delhi_%281%29.jpg/1280px-National_Gallery_of_Modern_Art_%28NGMA%29%2C_New_Delhi_%281%29.jpg"
    },
    {
      id: 11,
      name: "Kamaraj Memorial House",
      wikiTitle: "K._Kamaraj",
      filename: "kamaraj-memorial-house.jpg",
      directUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Kamarajar_House_at_Virudhunagar.JPG/1280px-Kamarajar_House_at_Virudhunagar.JPG"
    },
    {
      id: 26,
      name: "Lucknow Museum",
      wikiTitle: "State_Museum,_Lucknow",
      filename: "lucknow-museum.jpg",
      directUrl: null
    },
    {
      id: 36,
      name: "Kaziranga Forest Museum",
      wikiTitle: "Kaziranga_National_Park",
      filename: "kaziranga-forest-museum.jpg",
      directUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kaziranga_Orchid_and_Biodiversity_Park_Museum%2C_Kaziranga%2C_Assam.jpg/1280px-Kaziranga_Orchid_and_Biodiversity_Park_Museum%2C_Kaziranga%2C_Assam.jpg"
    },
    {
      id: 49,
      name: "Jahaj Kothi Museum",
      wikiTitle: "Jahaj_Kothi_Zonal_Museum",
      filename: "jahaj-kothi-museum.jpg",
      directUrl: null
    },
    {
      id: 84,
      name: "State Museum Lucknow",
      wikiTitle: "State_Museum,_Lucknow",
      filename: "state-museum-lucknow.jpg",
      directUrl: null
    },
    {
      id: 88,
      name: "Hazarduari Palace Museum",
      wikiTitle: "Hazarduari_Palace",
      filename: "hazarduari-palace-museum.jpg",
      directUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Hazarduari_Palace%2C_Murshidabad_illuminated_at_night.jpg/1280px-Hazarduari_Palace%2C_Murshidabad_illuminated_at_night.jpg"
    }
  ];

  for (const t of targets) {
    let url = t.directUrl;
    if (!url && t.wikiTitle) {
      url = await fetchWikiImage(t.wikiTitle);
    }
    console.log(`\nTarget #${t.id} (${t.name}): URL = ${url}`);

    if (url) {
      const destAssets = path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'museums', t.filename);
      const destImages = path.join(__dirname, '..', '..', 'frontend', 'images', 'museums', t.filename);
      try {
        await downloadFile(url, destAssets);
        fs.copyFileSync(destAssets, destImages);
        const sz = fs.statSync(destAssets).size;
        console.log(`  -> Successfully downloaded to ${t.filename} (${sz} bytes)`);
      } catch (err) {
        console.error(`  -> Download error for #${t.id}:`, err.message);
      }
    } else {
      console.log(`  -> No URL found for #${t.id}`);
    }
  }
}

run();
