async function verifyMuseums() {
  const ids = [1, 2, 5, 12, 80, 89, 8, 16, 19, 22, 28, 34, 38, 62, 73];
  console.log("==================================================================");
  console.log("FINAL VERIFICATION: Live API and Database Check");
  console.log("==================================================================");

  for (const id of ids) {
    const res = await fetch(`http://localhost:5000/api/museums/${id}`);
    const json = await res.json();
    const m = json.data;
    const words = m.description.trim().split(/\s+/).length;
    console.log(`[ID ${m.id}] ${m.name}`);
    console.log(`  Location: ${m.city}, ${m.state}`);
    console.log(`  Hours: ${m.opening_time} - ${m.closing_time}`);
    console.log(`  Prices: Adult ₹${m.adult_price}, Child ₹${m.child_price}, Senior ₹${m.senior_price}`);
    console.log(`  Image: ${m.image}`);
    console.log(`  Words: ${words} words`);
    console.log(`  Snippet: ${m.description.slice(0, 110)}...`);
    console.log("------------------------------------------------------------------");
  }
}

verifyMuseums().catch(console.error);
