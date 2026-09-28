-- ==========================================================
-- Official Ticket Prices and Hours Update Migration
-- Exactly 89 verified museums
-- ==========================================================

USE museum_booking;

START TRANSACTION;

-- #1: Chhatrapati Shivaji Maharaj Vastu Sangrahalaya
UPDATE museums
SET
    opening_time = '10:15 AM',
    closing_time = '06:00 PM',
    adult_price = 200.00,
    child_price = 40.00,
    senior_price = 100.00
WHERE id = 1;

-- #2: Nehru Science Centre
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '06:00 PM',
    adult_price = 70.00,
    child_price = 20.00,
    senior_price = 100.00
WHERE id = 2;

-- #3: Raja Dinkar Kelkar Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:30 PM',
    adult_price = 100.00,
    child_price = 30.00,
    senior_price = 75.00
WHERE id = 3;

-- #4: Dr. Bhau Daji Lad Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 10.00
WHERE id = 4;

-- #5: National Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '06:00 PM',
    adult_price = 20.00,
    child_price = 0.00,
    senior_price = 100.00
WHERE id = 5;

-- #6: National Gallery of Modern Art
UPDATE museums
SET
    opening_time = '11:00 AM',
    closing_time = '06:30 PM',
    adult_price = 20.00,
    child_price = 0.00,
    senior_price = 75.00
WHERE id = 6;

-- #7: Gandhi Smriti
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 7;

-- #8: Government Museum, Chennai
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 75.00
WHERE id = 8;

-- #9: Vivekananda House
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '07:15 PM',
    adult_price = 40.00,
    child_price = 20.00,
    senior_price = 50.00
WHERE id = 9;

-- #10: The Periyar Science and Technology Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:45 PM',
    adult_price = 30.00,
    child_price = 15.00,
    senior_price = 100.00
WHERE id = 10;

-- #11: Kamaraj Memorial House
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '06:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 11;

-- #12: Indian Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '06:00 PM',
    adult_price = 75.00,
    child_price = 20.00,
    senior_price = 200.00
WHERE id = 12;

-- #13: Birla Industrial & Technological Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '06:00 PM',
    adult_price = 50.00,
    child_price = 20.00,
    senior_price = 75.00
WHERE id = 13;

-- #14: Netaji Bhawan
UPDATE museums
SET
    opening_time = '11:00 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 30.00
WHERE id = 14;

-- #15: Karnataka Chitrakala Parishath
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:30 PM',
    adult_price = 50.00,
    child_price = 25.00,
    senior_price = 100.00
WHERE id = 15;

-- #16: Visvesvaraya Industrial and Technological Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '06:00 PM',
    adult_price = 85.00,
    child_price = 25.00,
    senior_price = 75.00
WHERE id = 16;

-- #17: Government Museum, Bengaluru
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 150.00
WHERE id = 17;

-- #18: HAL Aerospace Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 50.00,
    child_price = 30.00,
    senior_price = 75.00
WHERE id = 18;

-- #19: Albert Hall Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 40.00,
    child_price = 20.00,
    senior_price = 75.00
WHERE id = 19;

-- #20: City Palace Museum, Jaipur
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:00 PM',
    adult_price = 300.00,
    child_price = 200.00,
    senior_price = 200.00
WHERE id = 20;

-- #21: Rajasthan State Museum
UPDATE museums
SET
    opening_time = '09:45 AM',
    closing_time = '05:15 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 75.00
WHERE id = 21;

-- #22: Calico Museum of Textiles
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '01:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 22;

-- #23: Vikram Sarabhai Space Exhibition
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 23;

-- #24: Varanasi Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 75.00
WHERE id = 24;

-- #25: Allahabad Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 50.00,
    child_price = 20.00,
    senior_price = 100.00
WHERE id = 25;

-- #26: Lucknow Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 26;

-- #27: Kanpur Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '04:30 PM',
    adult_price = 15.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 27;

-- #28: Amaravati Archaeological Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 30.00
WHERE id = 28;

-- #29: Victoria Jubilee Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 50.00,
    child_price = 30.00,
    senior_price = 50.00
WHERE id = 29;

-- #30: Visakha Museum
UPDATE museums
SET
    opening_time = '11:00 AM',
    closing_time = '07:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 10.00
WHERE id = 30;

-- #31: Archaeological Site Museum, Nagarjunakonda
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '04:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 50.00
WHERE id = 31;

-- #32: Jawaharlal Nehru Museum, Itanagar
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 80.00
WHERE id = 32;

-- #33: Craft Museum and Emporium
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 33;

-- #34: Assam State Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 40.00
WHERE id = 34;

-- #35: Srimanta Sankardeva Sangrahalaya
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '07:00 PM',
    adult_price = 30.00,
    child_price = 15.00,
    senior_price = 35.00
WHERE id = 35;

-- #36: Kaziranga Forest Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 150.00
WHERE id = 36;

-- #37: Patna Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 105.00
WHERE id = 37;

-- #38: Bihar Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 100.00,
    child_price = 50.00,
    senior_price = 50.00
WHERE id = 38;

-- #39: Nalanda Archaeological Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 40.00
WHERE id = 39;

-- #40: Mahant Ghasidas Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 10.00,
    child_price = 5.00,
    senior_price = 80.00
WHERE id = 40;

-- #41: Tribal Museum Raipur
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 10.00,
    child_price = 5.00,
    senior_price = 40.00
WHERE id = 41;

-- #42: Archaeological Museum and Portrait Gallery
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 50.00
WHERE id = 42;

-- #43: Naval Aviation Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:30 PM',
    adult_price = 30.00,
    child_price = 15.00,
    senior_price = 50.00
WHERE id = 43;

-- #44: State Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 110.00
WHERE id = 44;

-- #45: Gandhi Memorial Museum
UPDATE museums
SET
    opening_time = '08:30 AM',
    closing_time = '06:30 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 45;

-- #46: Baroda Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 100.00
WHERE id = 46;

-- #47: Kurukshetra Panorama Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:30 PM',
    adult_price = 30.00,
    child_price = 15.00,
    senior_price = 70.00
WHERE id = 47;

-- #48: Dharohar Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 48;

-- #49: Jahaj Kothi Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 10.00,
    child_price = 5.00,
    senior_price = 40.00
WHERE id = 49;

-- #50: State Museum, Shimla
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 50;

-- #51: Kangra Art Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 60.00
WHERE id = 51;

-- #52: SPS Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 90.00
WHERE id = 52;

-- #53: Stok Palace Museum
UPDATE museums
SET
    opening_time = '08:00 AM',
    closing_time = '07:00 PM',
    adult_price = 50.00,
    child_price = 25.00,
    senior_price = 100.00
WHERE id = 53;

-- #54: State Museum Hotwar
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 100.00
WHERE id = 54;

-- #55: Tribal Research Institute Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 55;

-- #56: Mysore Sand Sculpture Museum
UPDATE museums
SET
    opening_time = '08:30 AM',
    closing_time = '06:30 PM',
    adult_price = 50.00,
    child_price = 25.00,
    senior_price = 50.00
WHERE id = 56;

-- #57: Railway Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:30 PM',
    adult_price = 50.00,
    child_price = 20.00,
    senior_price = 60.00
WHERE id = 57;

-- #58: Mysore Palace Residential Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:30 PM',
    adult_price = 70.00,
    child_price = 30.00,
    senior_price = 70.00
WHERE id = 58;

-- #59: Hill Palace Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '04:30 PM',
    adult_price = 30.00,
    child_price = 10.00,
    senior_price = 80.00
WHERE id = 59;

-- #60: Kerela State Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:45 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 80.00
WHERE id = 60;

-- #61: Indo-Portuguese Museums
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 61;

-- #62: Mattancherry Palace and Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 5.00,
    child_price = 0.00,
    senior_price = 70.00
WHERE id = 62;

-- #63: State Museum Bhopal
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 70.00
WHERE id = 63;

-- #64: Tribal Museum Bhopal
UPDATE museums
SET
    opening_time = '11:30 AM',
    closing_time = '06:30 PM',
    adult_price = 20.00,
    child_price = 0.00,
    senior_price = 150.00
WHERE id = 64;

-- #65: Archaeological Museum Khajuraho
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 150.00
WHERE id = 65;

-- #66: Don Bosco Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:30 PM',
    adult_price = 100.00,
    child_price = 50.00,
    senior_price = 70.00
WHERE id = 66;

-- #67: Wankhar Entomology Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:00 PM',
    adult_price = 50.00,
    child_price = 25.00,
    senior_price = 150.00
WHERE id = 67;

-- #68: Mizoram State Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '04:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 70.00
WHERE id = 68;

-- #69: State Museum Kohima
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '04:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 60.00
WHERE id = 69;

-- #70: World War II Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 70;

-- #71: State Museum Bhubaneswar
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 35.00
WHERE id = 71;

-- #72: Tribal Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 0.00,
    child_price = 0.00,
    senior_price = 0.00
WHERE id = 72;

-- #73: Odisha State Maritime Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 40.00,
    child_price = 20.00,
    senior_price = 60.00
WHERE id = 73;

-- #74: Government Museum Chandigarh
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 200.00
WHERE id = 74;

-- #75: Partition Museum Amritsar
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '06:00 PM',
    adult_price = 10.00,
    child_price = 0.00,
    senior_price = 150.00
WHERE id = 75;

-- #76: Maharaja Ranjit Singh Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 120.00
WHERE id = 76;

-- #77: Mehrangarh Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 100.00,
    child_price = 50.00,
    senior_price = 50.00
WHERE id = 77;

-- #78: Namgyal Institute of Tibetology
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '04:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 55.00
WHERE id = 78;

-- #79: Government Museum
UPDATE museums
SET
    opening_time = '09:30 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 55.00
WHERE id = 79;

-- #80: Salar Jung Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 50.00,
    child_price = 20.00,
    senior_price = 150.00
WHERE id = 80;

-- #81: State Archaeological Museum
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 200.00
WHERE id = 81;

-- #82: City Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 30.00,
    child_price = 15.00,
    senior_price = 50.00
WHERE id = 82;

-- #83: Tripura State Museum
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 70.00
WHERE id = 83;

-- #84: State Museum Lucknow
UPDATE museums
SET
    opening_time = '10:30 AM',
    closing_time = '04:30 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 100.00
WHERE id = 84;

-- #85: Sarnath Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 180.00
WHERE id = 85;

-- #86: State Museum Dehradun
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 180.00
WHERE id = 86;

-- #87: Jim Corbett Museum
UPDATE museums
SET
    opening_time = '08:00 AM',
    closing_time = '05:00 PM',
    adult_price = 20.00,
    child_price = 10.00,
    senior_price = 50.00
WHERE id = 87;

-- #88: Hazarduari Palace Museum
UPDATE museums
SET
    opening_time = '09:00 AM',
    closing_time = '05:00 PM',
    adult_price = 25.00,
    child_price = 0.00,
    senior_price = 80.00
WHERE id = 88;

-- #89: Victoria Memorial
UPDATE museums
SET
    opening_time = '10:00 AM',
    closing_time = '06:00 PM',
    adult_price = 50.00,
    child_price = 0.00,
    senior_price = 100.00
WHERE id = 89;

COMMIT;
