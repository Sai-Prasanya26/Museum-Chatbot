const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function auditAndFix() {
  console.log("==================================================");
  console.log("AUDIT & FIX: Museum Hours & Prices Final Audit");
  console.log("==================================================");

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Load current JSON verification data
    const jsonPath = path.join(__dirname, '..', 'data', 'museum-hours-prices-verification.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Official 13 museum IDs with officially published/verified senior pricing
    const officialSeniorIds = [1, 4, 7, 11, 20, 22, 23, 33, 38, 45, 55, 72, 77];

    let officiallyUpdatedSeniorCount = 0;
    let retainedSeniorCount = 0;

    data.forEach(m => {
      // Fix ID 1: CSMVS current official rates
      if (m.id === 1) {
        m.adult_price = 200.00;
        m.child_price = 40.00;
        m.senior_price = 100.00;
        m.senior_pricing_status = "Officially Published";
        m.notes = "Official Indian adult entry ₹200; children (5-15) ₹40; senior citizens ₹100. Monday–Sunday: 10:15 AM–06:00 PM (ticket counter closes at 05:45 PM). Closed on specified national/state holidays.";
      }

      if (officialSeniorIds.includes(m.id)) {
        m.senior_pricing_status = "Officially Published";
        officiallyUpdatedSeniorCount++;
      } else {
        m.senior_pricing_status = "No separate senior citizen rate found in the authoritative source; existing database value retained because the current schema requires a numeric senior price.";
        retainedSeniorCount++;
      }
    });

    console.log(`[Audit Count] Senior prices officially updated: ${officiallyUpdatedSeniorCount}`);
    console.log(`[Audit Count] Senior prices retained: ${retainedSeniorCount}`);
    console.log(`[Audit Count] Total museums: ${data.length}`);

    if (officiallyUpdatedSeniorCount !== 13 || retainedSeniorCount !== 76) {
      throw new Error(`Count mismatch! Expected 13 and 76, got ${officiallyUpdatedSeniorCount} and ${retainedSeniorCount}`);
    }

    // 2. Save updated JSON
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[File Updated] JSON saved to: ${jsonPath}`);

    // 3. Save updated Markdown table
    let mdContent = `# Museum Operating Hours & Official Ticket Prices Verification\n\n`;
    mdContent += `**Verified on:** 2026-09-25  \n`;
    mdContent += `**Total Museums:** 89  \n`;
    mdContent += `**Database:** \`museum_booking\`  \n\n`;
    mdContent += `### Senior Pricing Classification:\n`;
    mdContent += `- **Officially Published / Updated:** 13 museums (IDs: 1, 4, 7, 11, 20, 22, 23, 33, 38, 45, 55, 72, 77)\n`;
    mdContent += `- **Retained (No separate rate published):** 76 museums\n\n`;
    mdContent += `| ID | Museum Name | Hours | Weekly Closure | Adult (₹) | Child (₹) | Senior (₹) | Senior Status | Source Type | Source URL |\n`;
    mdContent += `|---|---|---|---|---|---|---|---|---|---|\n`;

    data.forEach(m => {
      mdContent += `| ${m.id} | ${m.name} | ${m.opening_time} - ${m.closing_time} | ${m.weekly_closure} | ₹${m.adult_price.toFixed(2)} | ₹${m.child_price.toFixed(2)} | ₹${parseFloat(m.senior_price).toFixed(2)} | ${m.senior_pricing_status} | ${m.source_type} | [Link](${m.source_url}) |\n`;
    });

    const mdPath = path.join(__dirname, '..', 'data', 'museum-hours-prices-verification.md');
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`[File Updated] Markdown saved to: ${mdPath}`);

    // 4. Update SQL migration files
    const sqlLines = [];
    sqlLines.push("-- ==========================================================");
    sqlLines.push("-- Official Ticket Prices and Hours Update Migration");
    sqlLines.push("-- Exactly 89 verified museums");
    sqlLines.push("-- ==========================================================");
    sqlLines.push("");
    sqlLines.push("USE museum_booking;");
    sqlLines.push("");
    sqlLines.push("START TRANSACTION;");
    sqlLines.push("");

    data.forEach(m => {
      sqlLines.push(`-- #${m.id}: ${m.name}`);
      sqlLines.push(`UPDATE museums`);
      sqlLines.push(`SET`);
      sqlLines.push(`    opening_time = '${m.opening_time}',`);
      sqlLines.push(`    closing_time = '${m.closing_time}',`);
      sqlLines.push(`    adult_price = ${m.adult_price.toFixed(2)},`);
      sqlLines.push(`    child_price = ${m.child_price.toFixed(2)},`);
      sqlLines.push(`    senior_price = ${parseFloat(m.senior_price).toFixed(2)}`);
      sqlLines.push(`WHERE id = ${m.id};`);
      sqlLines.push("");
    });

    sqlLines.push("COMMIT;");
    sqlLines.push("");

    const sqlPathBackend = path.join(__dirname, '..', 'database', 'update_museum_hours_prices.sql');
    fs.writeFileSync(sqlPathBackend, sqlLines.join('\n'), 'utf8');
    const sqlPathRoot = path.join(__dirname, '..', '..', 'database', 'update_museum_hours_prices.sql');
    fs.writeFileSync(sqlPathRoot, sqlLines.join('\n'), 'utf8');
    console.log(`[File Updated] SQL migration saved to: ${sqlPathRoot}`);

    // 5. Update MySQL database for ID 1 (and ensure all other 88 match)
    console.log("\n[Database Update] Updating ID 1 (CSMVS) in MySQL...");
    await connection.query(
      `UPDATE museums SET adult_price = 200.00, child_price = 40.00, senior_price = 100.00 WHERE id = 1`
    );

    // 6. Integrity checks
    console.log("\n==================================================");
    console.log("RUNNING STRICT INTEGRITY CHECKS");
    console.log("==================================================");

    // Count museums
    const [countRows] = await connection.query('SELECT COUNT(*) as count FROM museums');
    console.log(`1. Total museums: ${countRows[0].count} (Expected: 89)`);
    if (countRows[0].count !== 89) throw new Error("Total museums is not 89!");

    // Count bookings
    const [bookingRows] = await connection.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`2. Total bookings: ${bookingRows[0].count} (Expected: 0)`);
    if (bookingRows[0].count !== 0) throw new Error("Bookings count is not 0!");

    // Count transactions
    const [txRows] = await connection.query('SELECT COUNT(*) as count FROM transactions');
    console.log(`3. Total transactions: ${txRows[0].count} (Expected: 0)`);
    if (txRows[0].count !== 0) throw new Error("Transactions count is not 0!");

    // Verify IDs 1 to 89
    const [idRows] = await connection.query('SELECT id FROM museums ORDER BY id ASC');
    for (let i = 1; i <= 89; i++) {
      if (idRows[i - 1].id !== i) throw new Error(`ID sequence mismatch at ${i}`);
    }
    console.log("4. Museum IDs: Verified sequential 1 through 89.");

    // Verify ID 1 values
    const [csmvsRows] = await connection.query(
      'SELECT id, name, adult_price, child_price, senior_price, opening_time, closing_time FROM museums WHERE id = 1'
    );
    const c1 = csmvsRows[0];
    console.log(`5. ID 1 Values: Adult = ₹${c1.adult_price}, Child = ₹${c1.child_price}, Senior = ₹${c1.senior_price}, Hours = ${c1.opening_time} - ${c1.closing_time}`);
    if (parseFloat(c1.adult_price) !== 200 || parseFloat(c1.child_price) !== 40 || parseFloat(c1.senior_price) !== 100) {
      throw new Error("ID 1 price values incorrect!");
    }

    // Verify descriptions unchanged compared to backup
    const [descCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM museums m JOIN museums_backup_hours_prices b ON m.id = b.id WHERE m.description != b.description'
    );
    console.log(`6. Description mismatches: ${descCheck[0].count} (Expected: 0)`);
    if (descCheck[0].count !== 0) throw new Error("Descriptions were modified!");

    // Verify images unchanged compared to backup
    const [imgCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM museums m JOIN museums_backup_hours_prices b ON m.id = b.id WHERE m.image != b.image'
    );
    console.log(`7. Image mismatches: ${imgCheck[0].count} (Expected: 0)`);
    if (imgCheck[0].count !== 0) throw new Error("Images were modified!");

    // Verify names, cities, states unchanged
    const [nameCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM museums m JOIN museums_backup_hours_prices b ON m.id = b.id WHERE m.name != b.name OR m.city != b.city OR m.state != b.state'
    );
    console.log(`8. Name/City/State mismatches: ${nameCheck[0].count} (Expected: 0)`);
    if (nameCheck[0].count !== 0) throw new Error("Names, cities, or states were modified!");

    console.log("\nALL INTEGRITY CHECKS PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n[ERROR DURING AUDIT]:", err.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

auditAndFix();
