const http = require('http');

const BASE_URL = 'http://localhost:5000';

function post(urlPath, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE_URL);
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, text: resBody });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(urlPath) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE_URL);
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'GET'
        }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, text: resBody });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log('====================================================');
    console.log('STARTING PAYMENT & BOOKING SYSTEM VERIFICATION TESTS');
    console.log('====================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(testName, condition, message) {
        if (condition) {
            console.log(`[PASS] ${testName}: ${message}`);
            passedCount++;
        } else {
            console.error(`[FAIL] ${testName}: ${message}`);
            failedCount++;
        }
    }

    try {
        // PRE-CHECK: Payment Configuration Endpoint
        const configRes = await get('/api/payments/config');
        assert('CONFIG', configRes.status === 200 && configRes.data.data.upi_id,
            `UPI Config loaded successfully: UPI ID = "${configRes.data?.data?.upi_id}"`);

        // Get count of bookings before tests
        const { pool } = require('../config/db');
        const [initialRows] = await pool.query('SELECT count(*) as cnt FROM bookings');
        const initialBookingCount = initialRows[0].cnt;
        console.log(`Initial confirmed bookings in MySQL: ${initialBookingCount}\n`);

        // TEST 1: User clicks Confirm without payment.
        // EXPECTED: Booking must NOT be created.
        console.log('--- RUNNING TEST 1: Confirm without payment ---');
        const test1Res = await post('/api/bookings', {
            museum_id: 1,
            visit_date: '2026-09-30',
            adult_count: 1,
            child_count: 0,
            senior_count: 0,
            visitor_email: 'tester1@example.com',
            visitor_name: 'Test Visitor 1'
            // transaction_id omitted
        });
        const [afterTest1Rows] = await pool.query('SELECT count(*) as cnt FROM bookings');
        assert('TEST 1',
            (test1Res.status === 400 && afterTest1Rows[0].cnt === initialBookingCount),
            `Rejection status ${test1Res.status}, message: "${test1Res.data?.message}". No booking created in DB (count still ${afterTest1Rows[0].cnt}).`);

        // Also test /api/payments/verify without transaction_id
        const test1bRes = await post('/api/payments/verify', {
            museum_id: 1,
            visit_date: '2026-09-30',
            adult_count: 1,
            child_count: 0,
            senior_count: 0,
            visitor_email: 'tester1b@example.com',
            transaction_id: ''
        });
        assert('TEST 1b',
            test1bRes.status === 400 && test1bRes.data.payment_status === 'PENDING',
            `Verify without UTR returns 400, message: "${test1bRes.data?.message}"`);

        // TEST 2: Payment fails.
        // EXPECTED: Booking must NOT be confirmed.
        console.log('\n--- RUNNING TEST 2: Payment fails ---');
        const test2Res = await post('/api/payments/verify', {
            museum_id: 1,
            visit_date: '2026-09-30',
            adult_count: 1,
            child_count: 0,
            senior_count: 0,
            visitor_email: 'tester2@example.com',
            visitor_name: 'Test Visitor 2',
            transaction_id: 'UTR_FAIL_TEST_999'
        });
        const [afterTest2Rows] = await pool.query('SELECT count(*) as cnt FROM bookings');
        assert('TEST 2',
            (test2Res.status === 400 && test2Res.data.payment_status === 'FAILED' && afterTest2Rows[0].cnt === initialBookingCount),
            `Rejection status ${test2Res.status}, payment_status: FAILED, message: "${test2Res.data?.message}". Booking NOT confirmed.`);

        // TEST 3: Payment remains pending.
        // EXPECTED: Booking must NOT be confirmed.
        console.log('\n--- RUNNING TEST 3: Payment remains pending ---');
        const test3Res = await post('/api/payments/verify', {
            museum_id: 1,
            visit_date: '2026-09-30',
            adult_count: 1,
            child_count: 0,
            senior_count: 0,
            visitor_email: 'tester3@example.com',
            visitor_name: 'Test Visitor 3',
            transaction_id: 'UTR_PENDING_TEST_123'
        });
        const [afterTest3Rows] = await pool.query('SELECT count(*) as cnt FROM bookings');
        assert('TEST 3',
            (test3Res.status === 400 && test3Res.data.payment_status === 'PENDING' && afterTest3Rows[0].cnt === initialBookingCount),
            `Rejection status ${test3Res.status}, payment_status: PENDING, message: "${test3Res.data?.message}". Booking NOT confirmed.`);

        // TEST 4 & 5: Payment is successfully verified.
        // EXPECTED: Booking is created and confirmed, receipt is generated and email is dispatched.
        console.log('\n--- RUNNING TEST 4 & 5: Payment successfully verified ---');
        const validUtr = `UTR${Date.now()}A1`;
        
        // Initiate payment first
        const initRes = await post('/api/payments/initiate', {
            museum_id: 1,
            visit_date: '2026-10-05',
            adult_count: 2,
            child_count: 1,
            senior_count: 0,
            visitor_name: 'Rahul Sharma',
            visitor_email: 'rahul.sharma@example.com',
            visitor_phone: '9876543210'
        });
        assert('INITIATE', initRes.status === 200 && initRes.data.data.payment_intent_id,
            `Payment intent generated: ${initRes.data?.data?.payment_intent_id}, Total Amount calculated by server: ₹${initRes.data?.data?.total_amount}`);

        // Verify payment
        const test4Res = await post('/api/payments/verify', {
            payment_intent_id: initRes.data.data.payment_intent_id,
            transaction_id: validUtr,
            museum_id: 1,
            visit_date: '2026-10-05',
            adult_count: 2,
            child_count: 1,
            senior_count: 0,
            visitor_name: 'Rahul Sharma',
            visitor_email: 'rahul.sharma@example.com',
            visitor_phone: '9876543210'
        });

        const [afterTest4Rows] = await pool.query('SELECT count(*) as cnt FROM bookings');
        const confirmedBooking = test4Res.data?.data;
        assert('TEST 4',
            (test4Res.status === 200 &&
             test4Res.data.success === true &&
             confirmedBooking &&
             confirmedBooking.booking_status === 'CONFIRMED' &&
             confirmedBooking.payment_status === 'SUCCESS' &&
             afterTest4Rows[0].cnt === initialBookingCount + 1),
            `Booking created with reference ${confirmedBooking?.booking_reference}, Status: CONFIRMED, Payment: SUCCESS, DB count incremented.`);

        // TEST 5: Verify receipt generation & PDF ticket download
        console.log('\n--- RUNNING TEST 5: Receipt generation & PDF endpoint ---');
        assert('TEST 5a',
            confirmedBooking &&
            confirmedBooking.museum_name &&
            confirmedBooking.visitor_name === 'Rahul Sharma' &&
            confirmedBooking.visitor_email === 'rahul.sharma@example.com' &&
            confirmedBooking.transaction_id === validUtr,
            `Receipt contains museum, visitor name, email, visit date, and transaction reference.`);

        // Test PDF ticket generation endpoint
        const pdfRes = await get(`/api/bookings/reference/${encodeURIComponent(confirmedBooking.booking_reference)}/pdf`);
        assert('TEST 5b',
            pdfRes.status === 200 && (typeof pdfRes.text === 'string' && pdfRes.text.startsWith('%PDF')),
            `PDF Ticket receipt generated and streamable (Starts with %PDF).`);

        // TEST 6: Successful booking but WhatsApp is not configured.
        // EXPECTED: Booking and email work normally without error or crash.
        console.log('\n--- RUNNING TEST 6: WhatsApp not configured ---');
        const validUtr6 = `UTR${Date.now()}B2`;
        const test6Res = await post('/api/payments/verify', {
            museum_id: 2,
            visit_date: '2026-10-06',
            adult_count: 1,
            child_count: 0,
            senior_count: 0,
            visitor_name: 'Priya Patel',
            visitor_email: 'priya.patel@example.com',
            visitor_phone: '9123456780', // Phone provided while WhatsApp not configured in .env
            transaction_id: validUtr6
        });
        assert('TEST 6',
            test6Res.status === 200 && test6Res.data.success && test6Res.data.data.booking_status === 'CONFIRMED',
            `Booking ${test6Res.data?.data?.booking_reference} confirmed smoothly despite unconfigured WhatsApp.`);

        // TEST 7: Refresh the payment page / resubmission idempotency.
        // EXPECTED: Do not accidentally create a duplicate booking.
        console.log('\n--- RUNNING TEST 7: Refresh payment page / replay ---');
        const [countBeforeTest7] = await pool.query('SELECT count(*) as cnt FROM bookings');
        const test7Res = await post('/api/payments/verify', {
            transaction_id: validUtr, // Re-submitting the same UTR from Test 4
            museum_id: 1,
            visit_date: '2026-10-05',
            adult_count: 2,
            child_count: 1,
            senior_count: 0,
            visitor_name: 'Rahul Sharma',
            visitor_email: 'rahul.sharma@example.com'
        });
        const [countAfterTest7] = await pool.query('SELECT count(*) as cnt FROM bookings');
        assert('TEST 7',
            (countAfterTest7[0].cnt === countBeforeTest7[0].cnt && test7Res.data?.data?.booking_reference === confirmedBooking.booking_reference),
            `Page refresh / replay returns existing booking without creating duplicate record (DB count unchanged).`);

        // TEST 8: User clicks confirmation button multiple times concurrently.
        // EXPECTED: Do not create duplicate bookings or duplicate payments.
        console.log('\n--- RUNNING TEST 8: Multiple concurrent verification clicks ---');
        const concurrentUtr = `UTR${Date.now()}C3`;
        const [countBeforeTest8] = await pool.query('SELECT count(*) as cnt FROM bookings');

        const concurrentReqs = [
            post('/api/payments/verify', {
                transaction_id: concurrentUtr,
                museum_id: 1,
                visit_date: '2026-10-10',
                adult_count: 1,
                child_count: 0,
                senior_count: 0,
                visitor_name: 'Fast Clicker',
                visitor_email: 'fast@example.com'
            }),
            post('/api/payments/verify', {
                transaction_id: concurrentUtr,
                museum_id: 1,
                visit_date: '2026-10-10',
                adult_count: 1,
                child_count: 0,
                senior_count: 0,
                visitor_name: 'Fast Clicker',
                visitor_email: 'fast@example.com'
            }),
            post('/api/payments/verify', {
                transaction_id: concurrentUtr,
                museum_id: 1,
                visit_date: '2026-10-10',
                adult_count: 1,
                child_count: 0,
                senior_count: 0,
                visitor_name: 'Fast Clicker',
                visitor_email: 'fast@example.com'
            })
        ];

        const concurrentResults = await Promise.all(concurrentReqs);
        const [countAfterTest8] = await pool.query('SELECT count(*) as cnt FROM bookings');

        const successCount = concurrentResults.filter(r => r.status === 200 && r.data.success).length;
        assert('TEST 8',
            (countAfterTest8[0].cnt === countBeforeTest8[0].cnt + 1 && successCount >= 1),
            `Concurrent clicks yielded exactly 1 new booking record in MySQL (count went from ${countBeforeTest8[0].cnt} to ${countAfterTest8[0].cnt}). No duplicate bookings.`);

        console.log('\n====================================================');
        console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
        console.log('====================================================');

        process.exit(failedCount > 0 ? 1 : 0);
    } catch (err) {
        console.error('Fatal test execution error:', err);
        process.exit(1);
    }
}

runTests();
