const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const { pool, testConnection } = require('../config/db');

// State to city & asset image mapping
const STATE_DEFAULTS = {
    'Andhra Pradesh': { city: 'Visakhapatnam', image: 'assets/images/VISAKHA IMAGES.JPG' },
    'Arunachal Pradesh': { city: 'Itanagar', image: 'assets/images/ARUNACHAL.JPG' },
    'Assam': { city: 'Guwahati', image: 'assets/images/ASSAM.JPG' },
    'Bihar': { city: 'Patna', image: 'assets/images/BIHAR.JPG' },
    'Chattisgarh': { city: 'Raipur', image: 'assets/images/bhopal.jpg' },
    'Delhi': { city: 'New Delhi', image: 'assets/images/mumbai.jpg' },
    'Goa': { city: 'Panaji', image: 'assets/images/GOA.JPG' },
    'Gujarat': { city: 'Ahmedabad', image: 'assets/images/GUJARAT.JPG' },
    'Haryana': { city: 'Kurukshetra', image: 'assets/images/punjab.jpg' },
    'Himachal Pradesh': { city: 'Shimla', image: 'assets/images/HIMACHAL.JPG' },
    'Jammu & Kashmir': { city: 'Srinagar', image: 'assets/images/SRINAGAR.JPG' },
    'Jharkhand': { city: 'Ranchi', image: 'assets/images/JHARKHAND.JPG' },
    'Karnataka': { city: 'Bengaluru', image: 'assets/images/bangalore.jpg' },
    'Kerela': { city: 'Thiruvananthapuram', image: 'assets/images/kerala.jpg' },
    'Kerala': { city: 'Thiruvananthapuram', image: 'assets/images/kerala.jpg' },
    'Madhya Pradesh': { city: 'Bhopal', image: 'assets/images/bhopal.jpg' },
    'Maharashtra': { city: 'Mumbai', image: 'assets/images/mumbai.jpg' },
    'Manipur': { city: 'Imphal', image: 'assets/images/manipur.jpg' },
    'Mizoram': { city: 'Aizawl', image: 'assets/images/ARUNACHAL.JPG' },
    'Nagaland': { city: 'Kohima', image: 'assets/images/ASSAM.JPG' },
    'Odisha': { city: 'Bhubaneswar', image: 'assets/images/odisha.jpg' },
    'Punjab': { city: 'Amritsar', image: 'assets/images/punjab.jpg' },
    'Rajasthan': { city: 'Jaipur', image: 'assets/images/rajasthan.jpg' },
    'Sikkim': { city: 'Gangtok', image: 'assets/images/HIMACHAL.JPG' },
    'Tamil Nadu': { city: 'Chennai', image: 'assets/images/tamilnadu.jpg' },
    'Telangana': { city: 'Hyderabad', image: 'assets/images/telangana.jpg' },
    'Tripura': { city: 'Agartala', image: 'assets/images/ASSAM.JPG' },
    'Uttar Pradesh': { city: 'Agra', image: 'assets/images/rajasthan.jpg' },
    'Uttarakhand': { city: 'Dehradun', image: 'assets/images/HIMACHAL.JPG' },
    'West Bengal': { city: 'Kolkata', image: 'assets/images/BIHAR.JPG' }
};

// Rich details for key cultural heritage sites
const MONUMENT_DETAILS = {
    'taj mahal': {
        city: 'Agra',
        state: 'Uttar Pradesh',
        description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna, commissioned in 1631 by Mughal emperor Shah Jahan. UNESCO World Heritage Site and one of the New 7 Wonders of the World.',
        opening_time: '06:00 AM',
        closing_time: '06:30 PM',
        image: 'https://media.istockphoto.com/id/519330110/photo/taj-mahal-agra-india-monument-of-love-in-blue-sky.jpg?s=612x612&w=0&k=20&c=Uma6Q7KduznA6jUKcSquFP1iHHiw8UXcZEYVLONrmaQ='
    },
    'charminar': {
        city: 'Hyderabad',
        state: 'Telangana',
        description: 'A monument and mosque constructed in 1591 by Muhammad Quli Qutb Shah. A global icon of Hyderabad featuring four grand arches and 56-meter high minarets.',
        opening_time: '09:30 AM',
        closing_time: '05:30 PM',
        image: 'assets/images/telangana.jpg'
    },
    'salar jung museum': {
        city: 'Hyderabad',
        state: 'Telangana',
        description: 'One of the three National Museums of India, housed on the southern bank of the Musi River. Features an extraordinary collection of sculptures, paintings, manuscripts, and the famous 19th-century Musical Clock.',
        opening_time: '10:00 AM',
        closing_time: '05:00 PM',
        image: 'assets/images/telangana.jpg'
    },
    'golconda fort': {
        city: 'Hyderabad',
        state: 'Telangana',
        description: 'A fortified citadel built by the Kakatiya dynasty and later expanded by the Qutb Shahi kings. Renowned for its acoustic architecture, royal palaces, and the historic diamond trade.',
        opening_time: '09:00 AM',
        closing_time: '05:30 PM',
        image: 'assets/images/telangana.jpg'
    },
    'hawa mahal': {
        city: 'Jaipur',
        state: 'Rajasthan',
        description: 'The Palace of Winds, built in 1799 by Maharaja Sawai Pratap Singh. Features a five-story honeycomb facade with 953 intricately carved jharokhas (small windows) made of red and pink sandstone.',
        opening_time: '09:00 AM',
        closing_time: '04:30 PM',
        image: 'assets/images/rajasthan.jpg'
    },
    'khajuraho temple': {
        city: 'Chhatarpur',
        state: 'Madhya Pradesh',
        description: 'A magnificent group of Hindu and Jain temples built between 950 and 1050 AD by the Chandela dynasty. UNESCO World Heritage Site famous for its nagara-style architectural symbolism and erotic sculptures.',
        opening_time: '06:00 AM',
        closing_time: '06:00 PM',
        image: 'assets/images/bhopal.jpg'
    },
    'konark sun temple': {
        city: 'Puri',
        state: 'Odisha',
        description: 'A 13th-century CE Sun Temple attributed to king Narasimhadeva I. Designed in the shape of a colossal chariot with 24 carved stone wheels pulled by seven horses. UNESCO World Heritage Site.',
        opening_time: '06:00 AM',
        closing_time: '08:00 PM',
        image: 'assets/images/odisha.jpg'
    },
    'qutub minar': {
        city: 'New Delhi',
        state: 'Delhi',
        description: 'A 72.5-meter tall minaret built of red sandstone and marble, founded in 1192 by Qutb-ud-din Aibak. A UNESCO World Heritage Site surrounded by several historically significant monuments in the Qutb complex.',
        opening_time: '07:00 AM',
        closing_time: '05:00 PM',
        image: 'assets/images/mumbai.jpg'
    },
    'statue of unity': {
        city: 'Kevadia',
        state: 'Gujarat',
        description: 'The world\'s tallest statue with a height of 182 meters (597 feet), depicting Indian statesman and independence activist Sardar Vallabhbhai Patel on the Narmada River facing the Sardar Sarovar Dam.',
        opening_time: '08:00 AM',
        closing_time: '06:00 PM',
        image: 'assets/images/GUJARAT.JPG'
    }
};

async function seedMuseums() {
    console.log('[Seed] Starting database migration & museum seeding...');

    const connected = await testConnection();
    if (!connected) {
        console.error('[Seed] Database connection failed. Aborting seed.');
        process.exit(1);
    }

    // 1. Seed Default Admin & Test Users
    console.log('[Seed] Checking default administrative & test user accounts...');
    const defaultUsers = [
        {
            username: 'Administrator',
            email: 'admin@museum.com',
            password: 'Admin@1234',
            role: 'admin'
        },
        {
            username: 'Travel Explorer',
            email: 'test@museum.com',
            password: 'Test@1234',
            role: 'user'
        }
    ];

    for (const u of defaultUsers) {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
        if (existing.length === 0) {
            const hash = await bcrypt.hash(u.password, 10);
            await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [u.username, u.email, hash, u.role]
            );
            console.log(`[Seed] Created user: ${u.email} (Role: ${u.role})`);
        }
    }

    // 2. Read Museums_Ticket_Prices.xlsx
    const excelPath = path.join(__dirname, '..', 'data', 'Museums_Ticket_Prices.xlsx');
    if (!fs.existsSync(excelPath)) {
        console.error(`[Seed] Excel file not found at: ${excelPath}`);
        process.exit(1);
    }

    console.log(`[Seed] Reading museum records from: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    console.log(`[Seed] Found ${rawRows.length} rows in Excel worksheet.`);

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rawRows) {
        const state = (row['State'] || row['state'] || '').toString().trim();
        const name = (row['Museum'] || row['museum'] || row['name'] || '').toString().trim();

        if (!name || !state) {
            skippedCount++;
            continue;
        }

        const adultPrice = parseFloat(row['Adult Ticket Price'] || row['Adult_Ticket_Price'] || 150) || 150.00;
        const childPrice = parseFloat(row['Child Ticket Price'] || row['Child_Ticket_Price'] || 75) || 75.00;
        const seniorPrice = parseFloat(row['Senior Ticket Price'] || row['Senior_Ticket_Price'] || 100) || 100.00;

        // Check if enriched details exist
        const key = name.toLowerCase();
        let city = STATE_DEFAULTS[state]?.city || 'Capital City';
        let image = STATE_DEFAULTS[state]?.image || 'assets/images/default.jpg';
        let description = `A premier museum located in ${state}, showcasing rich regional art, historical relics, and cultural heritage.`;
        let openingTime = '09:30 AM';
        let closingTime = '05:30 PM';

        for (const [monumentKey, details] of Object.entries(MONUMENT_DETAILS)) {
            if (key.includes(monumentKey)) {
                city = details.city;
                description = details.description;
                image = details.image;
                openingTime = details.opening_time;
                closingTime = details.closing_time;
                break;
            }
        }

        // Check for existing museum in DB
        const [existing] = await pool.query(
            'SELECT id FROM museums WHERE LOWER(name) = LOWER(?)',
            [name]
        );

        if (existing.length === 0) {
            await pool.query(
                `INSERT INTO museums 
                (name, state, city, description, opening_time, closing_time, adult_price, child_price, senior_price, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, state, city, description, openingTime, closingTime, adultPrice, childPrice, seniorPrice, image]
            );
            insertedCount++;
        } else {
            // Update prices and ensure city/image/descriptions are accurate
            await pool.query(
                `UPDATE museums 
                SET state = ?, city = ?, description = ?, opening_time = ?, closing_time = ?, adult_price = ?, child_price = ?, senior_price = ?, image = ?
                WHERE id = ?`,
                [state, city, description, openingTime, closingTime, adultPrice, childPrice, seniorPrice, image, existing[0].id]
            );
            updatedCount++;
        }
    }

    // 3. Ensure all iconic monuments are present in database even if missing in Excel
    for (const [monumentKey, details] of Object.entries(MONUMENT_DETAILS)) {
        const titleCaseName = monumentKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const [existing] = await pool.query(
            'SELECT id FROM museums WHERE LOWER(name) LIKE LOWER(?)',
            [`%${monumentKey}%`]
        );

        if (existing.length === 0) {
            await pool.query(
                `INSERT INTO museums 
                (name, state, city, description, opening_time, closing_time, adult_price, child_price, senior_price, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [titleCaseName, details.state, details.city, details.description, details.opening_time, details.closing_time, 200.00, 100.00, 150.00, details.image]
            );
            insertedCount++;
            console.log(`[Seed] Added iconic monument: ${titleCaseName}`);
        }
    }

    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM museums');
    console.log(`\n==========================================================`);
    console.log(`[Seed] SUCCESS! Migration & Seeding Complete.`);
    console.log(`  • Records Inserted : ${insertedCount}`);
    console.log(`  • Records Updated  : ${updatedCount}`);
    console.log(`  • Total in Database: ${totalRows[0].total}`);
    console.log(`==========================================================\n`);

    process.exit(0);
}

seedMuseums().catch(err => {
    console.error('[Seed] Unhandled error during seeding:', err);
    process.exit(1);
});
