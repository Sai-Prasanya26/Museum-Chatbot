const fs = require('fs');

async function searchCommons(q) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MuseumExplorer/1.0' } });
    const data = await res.json();
    if (!data.query || !data.query.pages) {
      console.log(q, "-> NONE");
      return;
    }
    const results = Object.values(data.query.pages).map(p => ({
      title: p.title,
      url: p.imageinfo && p.imageinfo[0] ? p.imageinfo[0].url : null,
      size: p.imageinfo && p.imageinfo[0] ? p.imageinfo[0].size : 0
    })).filter(x => x.url && x.url.match(/\.(jpg|jpeg|png)$/i));
    console.log(`\n=== Query: "${q}" ===`);
    results.forEach(r => console.log(`- ${r.title}\n  ${r.url} (${r.size} bytes)`));
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  await searchCommons("Kamaraj Memorial");
  await searchCommons("Kamarajar Mani Mandapam");
  await searchCommons("Kaziranga National Park museum");
  await searchCommons("Kaziranga National Park");
  await searchCommons("Jahaj Kothi");
  await searchCommons("Jaipur House NGMA");
  await searchCommons("State Museum Lucknow");
}

run();
