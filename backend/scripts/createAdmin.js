/* ==========================================================
   Museum Booking System - Admin Creation Script
   Secure script to create or promote an administrator account
   Usage:
     node backend/scripts/createAdmin.js <email> <username> <password>
     or with environment variables:
     ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... node backend/scripts/createAdmin.js
   ========================================================== */

const bcrypt = require('bcrypt');
const readline = require('readline');
const { pool } = require('../config/db');

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('==========================================================');
    console.log('   Travel Explorer / Museum Project - Admin Account Setup  ');
    console.log('==========================================================\n');

    let email = process.argv[2] || process.env.ADMIN_EMAIL;
    let username = process.argv[3] || process.env.ADMIN_USERNAME;
    let password = process.argv[4] || process.env.ADMIN_PASSWORD;

    if (!email) {
        email = await prompt('Enter Admin Email: ');
    }
    if (!username) {
        username = await prompt('Enter Admin Username: ');
    }
    if (!password) {
        password = await prompt('Enter Admin Password (min 6 characters): ');
    }

    if (!email || !username || !password) {
        console.error('Error: Email, Username, and Password are all required.');
        process.exit(1);
    }

    if (password.length < 6) {
        console.error('Error: Admin password must be at least 6 characters long.');
        process.exit(1);
    }

    email = email.toLowerCase().trim();
    username = username.trim();

    try {
        // 1. Check if user already exists
        const [existing] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            const user = existing[0];
            if (user.role === 'admin') {
                console.log(`\nNotice: Administrator account already exists for "${email}" (ID: ${user.id}, Username: "${user.username}").`);
                // Ask if password should be updated
                const shouldUpdate = await prompt('Do you want to update the password for this admin account? (y/N): ');
                if (shouldUpdate.toLowerCase() === 'y') {
                    const password_hash = await bcrypt.hash(password, 10);
                    await pool.query(
                        'UPDATE users SET password_hash = ?, username = ? WHERE id = ?',
                        [password_hash, username, user.id]
                    );
                    console.log(`Success: Password updated for administrator "${email}".`);
                } else {
                    console.log('No changes made.');
                }
            } else {
                // Promote existing normal user to admin
                console.log(`Existing user found with role "${user.role}". Promoting to "admin"...`);
                const password_hash = await bcrypt.hash(password, 10);
                await pool.query(
                    'UPDATE users SET role = "admin", password_hash = ?, username = ? WHERE id = ?',
                    [password_hash, username, user.id]
                );
                console.log(`Success: User "${email}" promoted to "admin" with updated credentials.`);
            }
        } else {
            // 2. Create new administrator record
            const password_hash = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, password_hash, 'admin']
            );
            console.log(`\nSuccess: Administrator account created successfully!`);
            console.log(`ID: ${result.insertId}`);
            console.log(`Username: ${username}`);
            console.log(`Email: ${email}`);
            console.log(`Role: admin`);
        }

        console.log('\n==========================================================');
        process.exit(0);
    } catch (err) {
        console.error('\nDatabase error while creating admin:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
