async function getCategoryFiles(category) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmtype=file&cmlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MuseumExplorer/1.0' } });
  const data = await res.json();
  if (!data.query || !data.query.categorymembers) {
    console.log(category, "none");
    return;
  }
  console.log(`\n=== Category: ${category} ===`);
  for (const m of data.query.categorymembers.slice(0, 5)) {
    console.log(m.title);
  }
}

async function test() {
  await getCategoryFiles("Category:Hazarduari_Palace");
  await getCategoryFiles("Category:National_Gallery_of_Modern_Art,_New_Delhi");
  await getCategoryFiles("Category:State_Museum_Lucknow");
  await getCategoryFiles("Category:K._Kamaraj");
}
test();
