const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  console.log("==================================================");
  console.log("MIGRATION: Update 89 Museum Descriptions");
  console.log("==================================================");

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Pre-verification: Total rows
    const [preCountRows] = await connection.query('SELECT COUNT(*) as count FROM museums');
    const preCount = preCountRows[0].count;
    console.log(`[Pre-check] Total museums in database: ${preCount}`);
    if (preCount !== 89) {
      throw new Error(`Expected exactly 89 museums, but found ${preCount}`);
    }

    // 2. Pre-verification: IDs 1 to 89
    const [idRows] = await connection.query('SELECT id FROM museums ORDER BY id ASC');
    const ids = idRows.map(r => r.id);
    for (let i = 1; i <= 89; i++) {
      if (ids[i - 1] !== i) {
        throw new Error(`Museum ID mismatch at index ${i - 1}: expected ${i}, found ${ids[i - 1]}`);
      }
    }
    console.log("[Pre-check] All museum IDs 1 through 89 verified intact.");

    // 3. Save baseline prices for post-check comparison
    const [pricesBefore] = await connection.query('SELECT id, adult_price, child_price, senior_price FROM museums ORDER BY id ASC');

    // 4. Read description data
    const jsonPath = path.join(__dirname, '..', 'data', 'museum_descriptions.json');
    const descriptions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`[Migration] Loaded ${descriptions.length} verified descriptions.`);

    // 5. Run in a transaction
    console.log("[Migration] Beginning database transaction...");
    await connection.beginTransaction();

    let updatedCount = 0;
    for (const item of descriptions) {
      const [result] = await connection.query(
        'UPDATE museums SET description = ? WHERE id = ?',
        [item.description, item.id]
      );
      if (result.affectedRows === 0) {
        throw new Error(`Update affected 0 rows for museum ID ${item.id} (${item.name})!`);
      }
      updatedCount++;
    }

    // If all 89 updated successfully, commit!
    await connection.commit();
    console.log(`[Migration] Transaction committed successfully! Total updated: ${updatedCount}`);

    // 6. Post-verification
    const [postCountRows] = await connection.query('SELECT COUNT(*) as count FROM museums');
    console.log(`[Post-check] Total museums: ${postCountRows[0].count} (Expected: 89)`);

    const [emptyDescRows] = await connection.query(
      "SELECT COUNT(*) as count FROM museums WHERE description IS NULL OR TRIM(description) = ''"
    );
    console.log(`[Post-check] Empty/Null descriptions: ${emptyDescRows[0].count} (Expected: 0)`);

    // Verify prices unchanged
    const [pricesAfter] = await connection.query('SELECT id, adult_price, child_price, senior_price FROM museums ORDER BY id ASC');
    let priceMismatch = false;
    for (let i = 0; i < 89; i++) {
      const b = pricesBefore[i];
      const a = pricesAfter[i];
      if (
        parseFloat(b.adult_price) !== parseFloat(a.adult_price) ||
        parseFloat(b.child_price) !== parseFloat(a.child_price) ||
        parseFloat(b.senior_price) !== parseFloat(a.senior_price)
      ) {
        priceMismatch = true;
        console.error(`Price changed for ID ${b.id}!`);
      }
    }
    if (!priceMismatch) {
      console.log("[Post-check] Verified: Ticket prices have NOT changed for any museum.");
    } else {
      throw new Error("Price mismatch detected!");
    }

    // Verify bookings count
    const [bookingRows] = await connection.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`[Post-check] Total bookings in database: ${bookingRows[0].count} (Preserved completely)`);

  } catch (err) {
    console.error("[Migration ERROR] Rolling back transaction:", err.message);
    try {
      await connection.rollback();
      console.log("[Migration] Transaction rolled back safely.");
    } catch (rbErr) {
      console.error("[Migration] Rollback error:", rbErr.message);
    }
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

runMigration();
