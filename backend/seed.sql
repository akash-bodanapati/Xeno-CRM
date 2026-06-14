-- ============================================================
--  Xeno-CRM  •  Seed Data — Indian Coffee Chain "Brew & Bean"
--  50 customers with realistic Indian names, cities, and orders
--  Run AFTER schema.sql
-- ============================================================

-- ─── Truncate existing data (safe to re-run) ─────────────────────────────────
truncate table communications, campaign_stats, campaigns, segment_members, segments, orders, customers restart identity cascade;

-- ─── Insert Customers ────────────────────────────────────────────────────────
-- total_orders and total_spent will be updated after inserting orders

insert into customers (id, name, email, phone, city, total_orders, total_spent, last_order_date, tags, created_at) values

-- VIP customers (total_spent ≥ ₹10,000)
('00000001-0000-0000-0000-000000000001', 'Arjun Mehta',       'arjun.mehta@gmail.com',     '+919820001001', 'Mumbai',    5, 14500, now() - interval '3 days',   '["vip"]',     now() - interval '180 days'),
('00000001-0000-0000-0000-000000000002', 'Priya Sharma',      'priya.sharma@outlook.com',  '+919810002002', 'Delhi',     5, 13200, now() - interval '5 days',   '["vip"]',     now() - interval '200 days'),
('00000001-0000-0000-0000-000000000003', 'Rohit Nair',        'rohit.nair@gmail.com',      '+919876003003', 'Bangalore', 5, 12800, now() - interval '1 day',    '["vip"]',     now() - interval '150 days'),
('00000001-0000-0000-0000-000000000004', 'Deepika Iyer',      'deepika.iyer@yahoo.com',    '+919845004004', 'Chennai',   5, 11700, now() - interval '7 days',   '["vip"]',     now() - interval '170 days'),
('00000001-0000-0000-0000-000000000005', 'Vikram Reddy',      'vikram.reddy@gmail.com',    '+919703005005', 'Hyderabad', 5, 15900, now() - interval '2 days',   '["vip"]',     now() - interval '220 days'),
('00000001-0000-0000-0000-000000000006', 'Sneha Kulkarni',    'sneha.kulkarni@gmail.com',  '+919922006006', 'Pune',      5, 10500, now() - interval '4 days',   '["vip"]',     now() - interval '190 days'),
('00000001-0000-0000-0000-000000000007', 'Aditya Bose',       'aditya.bose@gmail.com',     '+919433007007', 'Bangalore', 5, 13400, now() - interval '6 days',   '["vip"]',     now() - interval '210 days'),
('00000001-0000-0000-0000-000000000008', 'Kavitha Pillai',    'kavitha.pillai@gmail.com',  '+919847008008', 'Chennai',   5, 11200, now() - interval '8 days',   '["vip"]',     now() - interval '160 days'),
('00000001-0000-0000-0000-000000000009', 'Suresh Joshi',      'suresh.joshi@hotmail.com',  '+919921009009', 'Pune',      5, 16200, now() - interval '1 day',    '["vip"]',     now() - interval '240 days'),
('00000001-0000-0000-0000-000000000010', 'Ananya Gupta',      'ananya.gupta@gmail.com',    '+919990010010', 'Delhi',     5, 10800, now() - interval '9 days',   '["vip"]',     now() - interval '180 days'),

-- Regular customers (total_spent ₹2,000–₹5,000)
('00000001-0000-0000-0000-000000000011', 'Rahul Verma',       'rahul.verma@gmail.com',     '+919811011011', 'Mumbai',    4, 4200,  now() - interval '12 days',  '["regular"]', now() - interval '120 days'),
('00000001-0000-0000-0000-000000000012', 'Pooja Mishra',      'pooja.mishra@gmail.com',    '+919930012012', 'Delhi',     4, 3800,  now() - interval '15 days',  '["regular"]', now() - interval '100 days'),
('00000001-0000-0000-0000-000000000013', 'Kiran Kumar',       'kiran.kumar@gmail.com',     '+919876013013', 'Bangalore', 4, 4500,  now() - interval '10 days',  '["regular"]', now() - interval '130 days'),
('00000001-0000-0000-0000-000000000014', 'Meera Krishnan',    'meera.krishnan@gmail.com',  '+919844014014', 'Chennai',   3, 2900,  now() - interval '20 days',  '["regular"]', now() - interval '110 days'),
('00000001-0000-0000-0000-000000000015', 'Sanjay Patil',      'sanjay.patil@gmail.com',    '+919970015015', 'Pune',      4, 3500,  now() - interval '18 days',  '["regular"]', now() - interval '140 days'),
('00000001-0000-0000-0000-000000000016', 'Neha Agarwal',      'neha.agarwal@gmail.com',    '+919999016016', 'Hyderabad', 3, 2700,  now() - interval '25 days',  '["regular"]', now() - interval '90 days'),
('00000001-0000-0000-0000-000000000017', 'Amit Singh',        'amit.singh@gmail.com',      '+919871017017', 'Delhi',     4, 4100,  now() - interval '14 days',  '["regular"]', now() - interval '105 days'),
('00000001-0000-0000-0000-000000000018', 'Divya Ramesh',      'divya.ramesh@gmail.com',    '+919942018018', 'Bangalore', 3, 3200,  now() - interval '22 days',  '["regular"]', now() - interval '115 days'),
('00000001-0000-0000-0000-000000000019', 'Manoj Tiwari',      'manoj.tiwari@gmail.com',    '+919902019019', 'Mumbai',    4, 4700,  now() - interval '11 days',  '["regular"]', now() - interval '135 days'),
('00000001-0000-0000-0000-000000000020', 'Lakshmi Venkat',    'lakshmi.venkat@gmail.com',  '+919843020020', 'Chennai',   3, 2500,  now() - interval '28 days',  '["regular"]', now() - interval '95 days'),
('00000001-0000-0000-0000-000000000021', 'Ravi Shankar',      'ravi.shankar@gmail.com',    '+919835021021', 'Hyderabad', 4, 4900,  now() - interval '13 days',  '["regular"]', now() - interval '125 days'),
('00000001-0000-0000-0000-000000000022', 'Sunita Deshpande',  'sunita.deshpande@gmail.com','+919822022022', 'Pune',      3, 3100,  now() - interval '17 days',  '["regular"]', now() - interval '108 days'),
('00000001-0000-0000-0000-000000000023', 'Gaurav Khanna',     'gaurav.khanna@gmail.com',   '+919987023023', 'Delhi',     4, 3700,  now() - interval '16 days',  '["regular"]', now() - interval '118 days'),
('00000001-0000-0000-0000-000000000024', 'Anjali Patel',      'anjali.patel@gmail.com',    '+919913024024', 'Bangalore', 3, 2800,  now() - interval '30 days',  '["regular"]', now() - interval '98 days'),
('00000001-0000-0000-0000-000000000025', 'Vijay Narayan',     'vijay.narayan@gmail.com',   '+919805025025', 'Mumbai',    4, 4300,  now() - interval '19 days',  '["regular"]', now() - interval '128 days'),

-- New customers (recent signups, few orders)
('00000001-0000-0000-0000-000000000026', 'Ishaan Malhotra',   'ishaan.malhotra@gmail.com', '+919876026026', 'Delhi',     1, 350,   now() - interval '5 days',   '["new"]',     now() - interval '6 days'),
('00000001-0000-0000-0000-000000000027', 'Tanya Menon',       'tanya.menon@gmail.com',     '+919847027027', 'Bangalore', 1, 480,   now() - interval '3 days',   '["new"]',     now() - interval '4 days'),
('00000001-0000-0000-0000-000000000028', 'Rohan Chatterjee',  'rohan.chatterjee@gmail.com','+919433028028', 'Kolkata',   2, 720,   now() - interval '7 days',   '["new"]',     now() - interval '10 days'),
('00000001-0000-0000-0000-000000000029', 'Nisha Kapoor',      'nisha.kapoor@gmail.com',    '+919990029029', 'Mumbai',    1, 280,   now() - interval '2 days',   '["new"]',     now() - interval '3 days'),
('00000001-0000-0000-0000-000000000030', 'Aryan Saxena',      'aryan.saxena@gmail.com',    '+919820030030', 'Pune',      2, 650,   now() - interval '8 days',   '["new"]',     now() - interval '12 days'),
('00000001-0000-0000-0000-000000000031', 'Preethi Naidu',     'preethi.naidu@gmail.com',   '+919843031031', 'Hyderabad', 1, 420,   now() - interval '4 days',   '["new"]',     now() - interval '5 days'),
('00000001-0000-0000-0000-000000000032', 'Kartik Bajaj',      'kartik.bajaj@gmail.com',    '+919921032032', 'Delhi',     2, 810,   now() - interval '6 days',   '["new"]',     now() - interval '9 days'),
('00000001-0000-0000-0000-000000000033', 'Shreya Ghosh',      'shreya.ghosh@gmail.com',    '+919930033033', 'Bangalore', 1, 390,   now() - interval '1 day',    '["new"]',     now() - interval '2 days'),
('00000001-0000-0000-0000-000000000034', 'Dev Mathur',        'dev.mathur@gmail.com',      '+919811034034', 'Chennai',   2, 760,   now() - interval '9 days',   '["new"]',     now() - interval '11 days'),
('00000001-0000-0000-0000-000000000035', 'Simran Oberoi',     'simran.oberoi@gmail.com',   '+919999035035', 'Mumbai',    1, 310,   now() - interval '3 days',   '["new"]',     now() - interval '4 days'),

-- Churned customers (last order 90+ days ago)
('00000001-0000-0000-0000-000000000036', 'Manish Dubey',      'manish.dubey@gmail.com',    '+919871036036', 'Delhi',     3, 2200,  now() - interval '120 days', '["regular"]', now() - interval '300 days'),
('00000001-0000-0000-0000-000000000037', 'Rekha Nambiar',     'rekha.nambiar@gmail.com',   '+919942037037', 'Bangalore', 3, 1900,  now() - interval '95 days',  '["regular"]', now() - interval '280 days'),
('00000001-0000-0000-0000-000000000038', 'Praveen Rao',       'praveen.rao@gmail.com',     '+919902038038', 'Hyderabad', 3, 2600,  now() - interval '150 days', '["regular"]', now() - interval '320 days'),
('00000001-0000-0000-0000-000000000039', 'Madhuri Jain',      'madhuri.jain@gmail.com',    '+919835039039', 'Pune',      3, 1700,  now() - interval '110 days', '["regular"]', now() - interval '290 days'),
('00000001-0000-0000-0000-000000000040', 'Sunil Pillai',      'sunil.pillai@gmail.com',    '+919805040040', 'Chennai',   4, 3000,  now() - interval '180 days', '["regular"]', now() - interval '350 days'),
('00000001-0000-0000-0000-000000000041', 'Geeta Srivastava',  'geeta.srivastava@gmail.com','+919810041041', 'Mumbai',    3, 1800,  now() - interval '100 days', '["regular"]', now() - interval '260 days'),
('00000001-0000-0000-0000-000000000042', 'Nikhil Deshpande',  'nikhil.deshpande@gmail.com','+919970042042', 'Pune',      3, 2400,  now() - interval '130 days', '["regular"]', now() - interval '310 days'),
('00000001-0000-0000-0000-000000000043', 'Pallavi Iyer',      'pallavi.iyer@gmail.com',    '+919844043043', 'Bangalore', 3, 2100,  now() - interval '140 days', '["regular"]', now() - interval '330 days'),
('00000001-0000-0000-0000-000000000044', 'Siddharth Mukherjee','sid.mukherjee@gmail.com',  '+919913044044', 'Delhi',     4, 2800,  now() - interval '92 days',  '["regular"]', now() - interval '270 days'),
('00000001-0000-0000-0000-000000000045', 'Vandana Choudhary', 'vandana.ch@gmail.com',      '+919987045045', 'Hyderabad', 3, 1600,  now() - interval '160 days', '["regular"]', now() - interval '340 days'),

-- Mixed segment customers
('00000001-0000-0000-0000-000000000046', 'Abhishek Pandey',   'abhishek.pandey@gmail.com', '+919876046046', 'Mumbai',    4, 5500,  now() - interval '35 days',  '["regular"]', now() - interval '145 days'),
('00000001-0000-0000-0000-000000000047', 'Ritu Khare',        'ritu.khare@gmail.com',      '+919820047047', 'Delhi',     4, 6200,  now() - interval '40 days',  '["regular"]', now() - interval '155 days'),
('00000001-0000-0000-0000-000000000048', 'Mohit Anand',       'mohit.anand@gmail.com',     '+919921048048', 'Bangalore', 5, 8900,  now() - interval '25 days',  '["regular"]', now() - interval '165 days'),
('00000001-0000-0000-0000-000000000049', 'Swati Bhatnagar',   'swati.bhatnagar@gmail.com', '+919843049049', 'Pune',      4, 7100,  now() - interval '45 days',  '["regular"]', now() - interval '175 days'),
('00000001-0000-0000-0000-000000000050', 'Harish Menon',      'harish.menon@gmail.com',    '+919847050050', 'Chennai',   5, 9600,  now() - interval '20 days',  '["regular"]', now() - interval '185 days');

-- ─── Insert Orders ────────────────────────────────────────────────────────────
-- VIP customers — 5 orders each

insert into orders (customer_id, amount, items, status, ordered_at) values
-- Arjun Mehta (c01)
('00000001-0000-0000-0000-000000000001', 750, '{"items":["Cold Brew","Blueberry Muffin"]}', 'completed', now() - interval '3 days'),
('00000001-0000-0000-0000-000000000001', 680, '{"items":["Cappuccino","Croissant","Sandwich"]}', 'completed', now() - interval '20 days'),
('00000001-0000-0000-0000-000000000001', 620, '{"items":["Flat White","Cheesecake"]}', 'completed', now() - interval '45 days'),
('00000001-0000-0000-0000-000000000001', 580, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '75 days'),
('00000001-0000-0000-0000-000000000001', 550, '{"items":["Espresso","Cookie"]}', 'completed', now() - interval '110 days'),

-- Priya Sharma (c02)
('00000001-0000-0000-0000-000000000002', 800, '{"items":["Signature Latte","Belgian Waffle"]}', 'completed', now() - interval '5 days'),
('00000001-0000-0000-0000-000000000002', 720, '{"items":["Cold Brew","Almond Croissant"]}', 'completed', now() - interval '22 days'),
('00000001-0000-0000-0000-000000000002', 650, '{"items":["Cappuccino","Tiramisu"]}', 'completed', now() - interval '50 days'),
('00000001-0000-0000-0000-000000000002', 600, '{"items":["Flat White","Banana Bread"]}', 'completed', now() - interval '80 days'),
('00000001-0000-0000-0000-000000000002', 430, '{"items":["Masala Chai","Cookies"]}', 'completed', now() - interval '120 days'),

-- Rohit Nair (c03)
('00000001-0000-0000-0000-000000000003', 780, '{"items":["Filter Coffee","Ekam Waffle"]}', 'completed', now() - interval '1 day'),
('00000001-0000-0000-0000-000000000003', 700, '{"items":["Cold Brew","Croissant"]}', 'completed', now() - interval '18 days'),
('00000001-0000-0000-0000-000000000003', 620, '{"items":["Cappuccino","Brownie"]}', 'completed', now() - interval '40 days'),
('00000001-0000-0000-0000-000000000003', 560, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '70 days'),
('00000001-0000-0000-0000-000000000003', 500, '{"items":["Espresso"]}', 'completed', now() - interval '100 days'),

-- Deepika Iyer (c04)
('00000001-0000-0000-0000-000000000004', 700, '{"items":["South Indian Filter Coffee","Idli"]}', 'completed', now() - interval '7 days'),
('00000001-0000-0000-0000-000000000004', 650, '{"items":["Cappuccino","Sandesh"]}', 'completed', now() - interval '28 days'),
('00000001-0000-0000-0000-000000000004', 580, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '55 days'),
('00000001-0000-0000-0000-000000000004', 520, '{"items":["Flat White"]}', 'completed', now() - interval '85 days'),
('00000001-0000-0000-0000-000000000004', 450, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '115 days'),

-- Vikram Reddy (c05)
('00000001-0000-0000-0000-000000000005', 800, '{"items":["Cold Brew","Chocolate Cake"]}', 'completed', now() - interval '2 days'),
('00000001-0000-0000-0000-000000000005', 780, '{"items":["Signature Latte","Croissant","Cookie"]}', 'completed', now() - interval '15 days'),
('00000001-0000-0000-0000-000000000005', 750, '{"items":["Cappuccino","Tiramisu"]}', 'completed', now() - interval '38 days'),
('00000001-0000-0000-0000-000000000005', 700, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '65 days'),
('00000001-0000-0000-0000-000000000005', 620, '{"items":["Americano"]}', 'completed', now() - interval '95 days'),

-- Sneha Kulkarni (c06)
('00000001-0000-0000-0000-000000000006', 680, '{"items":["Cold Brew","Banana Bread"]}', 'completed', now() - interval '4 days'),
('00000001-0000-0000-0000-000000000006', 620, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '25 days'),
('00000001-0000-0000-0000-000000000006', 550, '{"items":["Flat White","Cookie"]}', 'completed', now() - interval '52 days'),
('00000001-0000-0000-0000-000000000006', 490, '{"items":["Americano"]}', 'completed', now() - interval '82 days'),
('00000001-0000-0000-0000-000000000006', 450, '{"items":["Espresso","Muffin"]}', 'completed', now() - interval '112 days'),

-- Aditya Bose (c07)
('00000001-0000-0000-0000-000000000007', 750, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '6 days'),
('00000001-0000-0000-0000-000000000007', 690, '{"items":["Cappuccino","Brownie"]}', 'completed', now() - interval '26 days'),
('00000001-0000-0000-0000-000000000007', 610, '{"items":["Flat White","Croissant"]}', 'completed', now() - interval '53 days'),
('00000001-0000-0000-0000-000000000007', 560, '{"items":["Americano"]}', 'completed', now() - interval '83 days'),
('00000001-0000-0000-0000-000000000007', 490, '{"items":["Espresso","Cookie"]}', 'completed', now() - interval '113 days'),

-- Kavitha Pillai (c08)
('00000001-0000-0000-0000-000000000008', 720, '{"items":["Filter Coffee","Cake"]}', 'completed', now() - interval '8 days'),
('00000001-0000-0000-0000-000000000008', 650, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '30 days'),
('00000001-0000-0000-0000-000000000008', 580, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '58 days'),
('00000001-0000-0000-0000-000000000008', 510, '{"items":["Flat White"]}', 'completed', now() - interval '88 days'),
('00000001-0000-0000-0000-000000000008', 440, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '118 days'),

-- Suresh Joshi (c09)
('00000001-0000-0000-0000-000000000009', 800, '{"items":["Cold Brew","Chocolate Cake","Croissant"]}', 'completed', now() - interval '1 day'),
('00000001-0000-0000-0000-000000000009', 790, '{"items":["Signature Latte","Brownie"]}', 'completed', now() - interval '14 days'),
('00000001-0000-0000-0000-000000000009', 720, '{"items":["Cappuccino","Tiramisu"]}', 'completed', now() - interval '35 days'),
('00000001-0000-0000-0000-000000000009', 670, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '62 days'),
('00000001-0000-0000-0000-000000000009', 600, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '92 days'),

-- Ananya Gupta (c10)
('00000001-0000-0000-0000-000000000010', 700, '{"items":["Cold Brew","Belgian Waffle"]}', 'completed', now() - interval '9 days'),
('00000001-0000-0000-0000-000000000010', 640, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '32 days'),
('00000001-0000-0000-0000-000000000010', 570, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '60 days'),
('00000001-0000-0000-0000-000000000010', 510, '{"items":["Americano"]}', 'completed', now() - interval '90 days'),
('00000001-0000-0000-0000-000000000010', 460, '{"items":["Espresso","Cookie"]}', 'completed', now() - interval '120 days'),

-- Regular customers — 3–4 orders each

-- Rahul Verma (c11)
('00000001-0000-0000-0000-000000000011', 650, '{"items":["Cold Brew","Muffin"]}', 'completed', now() - interval '12 days'),
('00000001-0000-0000-0000-000000000011', 580, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '40 days'),
('00000001-0000-0000-0000-000000000011', 510, '{"items":["Flat White"]}', 'completed', now() - interval '75 days'),
('00000001-0000-0000-0000-000000000011', 460, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '110 days'),

-- Pooja Mishra (c12)
('00000001-0000-0000-0000-000000000012', 600, '{"items":["Signature Latte","Brownie"]}', 'completed', now() - interval '15 days'),
('00000001-0000-0000-0000-000000000012', 540, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '42 days'),
('00000001-0000-0000-0000-000000000012', 470, '{"items":["Cold Brew"]}', 'completed', now() - interval '78 days'),
('00000001-0000-0000-0000-000000000012', 430, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '115 days'),

-- Kiran Kumar (c13)
('00000001-0000-0000-0000-000000000013', 700, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '10 days'),
('00000001-0000-0000-0000-000000000013', 620, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '38 days'),
('00000001-0000-0000-0000-000000000013', 550, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '72 days'),
('00000001-0000-0000-0000-000000000013', 480, '{"items":["Americano"]}', 'completed', now() - interval '105 days'),

-- Meera Krishnan (c14)
('00000001-0000-0000-0000-000000000014', 580, '{"items":["Filter Coffee","Idli"]}', 'completed', now() - interval '20 days'),
('00000001-0000-0000-0000-000000000014', 520, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '55 days'),
('00000001-0000-0000-0000-000000000014', 450, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '90 days'),

-- Sanjay Patil (c15)
('00000001-0000-0000-0000-000000000015', 560, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '18 days'),
('00000001-0000-0000-0000-000000000015', 490, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '48 days'),
('00000001-0000-0000-0000-000000000015', 430, '{"items":["Flat White"]}', 'completed', now() - interval '80 days'),
('00000001-0000-0000-0000-000000000015', 380, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '115 days'),

-- Neha Agarwal (c16)
('00000001-0000-0000-0000-000000000016', 520, '{"items":["Signature Latte"]}', 'completed', now() - interval '25 days'),
('00000001-0000-0000-0000-000000000016', 460, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '58 days'),
('00000001-0000-0000-0000-000000000016', 400, '{"items":["Cold Brew"]}', 'completed', now() - interval '88 days'),

-- Amit Singh (c17)
('00000001-0000-0000-0000-000000000017', 640, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '14 days'),
('00000001-0000-0000-0000-000000000017', 570, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '44 days'),
('00000001-0000-0000-0000-000000000017', 500, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '76 days'),
('00000001-0000-0000-0000-000000000017', 440, '{"items":["Americano"]}', 'completed', now() - interval '108 days'),

-- Divya Ramesh (c18)
('00000001-0000-0000-0000-000000000018', 600, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '22 days'),
('00000001-0000-0000-0000-000000000018', 530, '{"items":["Cappuccino","Cookie"]}', 'completed', now() - interval '55 days'),
('00000001-0000-0000-0000-000000000018', 460, '{"items":["Flat White"]}', 'completed', now() - interval '88 days'),

-- Manoj Tiwari (c19)
('00000001-0000-0000-0000-000000000019', 720, '{"items":["Cold Brew","Belgian Waffle"]}', 'completed', now() - interval '11 days'),
('00000001-0000-0000-0000-000000000019', 650, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '35 days'),
('00000001-0000-0000-0000-000000000019', 570, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '65 days'),
('00000001-0000-0000-0000-000000000019', 490, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '95 days'),

-- Lakshmi Venkat (c20)
('00000001-0000-0000-0000-000000000020', 500, '{"items":["Filter Coffee","Vada"]}', 'completed', now() - interval '28 days'),
('00000001-0000-0000-0000-000000000020', 440, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '62 days'),
('00000001-0000-0000-0000-000000000020', 380, '{"items":["Cappuccino"]}', 'completed', now() - interval '95 days'),

-- Ravi Shankar (c21)
('00000001-0000-0000-0000-000000000021', 760, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '13 days'),
('00000001-0000-0000-0000-000000000021', 680, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '40 days'),
('00000001-0000-0000-0000-000000000021', 600, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '70 days'),
('00000001-0000-0000-0000-000000000021', 530, '{"items":["Americano"]}', 'completed', now() - interval '100 days'),

-- Sunita Deshpande (c22)
('00000001-0000-0000-0000-000000000022', 580, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '17 days'),
('00000001-0000-0000-0000-000000000022', 510, '{"items":["Cappuccino","Cookie"]}', 'completed', now() - interval '50 days'),
('00000001-0000-0000-0000-000000000022', 440, '{"items":["Flat White"]}', 'completed', now() - interval '85 days'),

-- Gaurav Khanna (c23)
('00000001-0000-0000-0000-000000000023', 620, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '16 days'),
('00000001-0000-0000-0000-000000000023', 550, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '46 days'),
('00000001-0000-0000-0000-000000000023', 480, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '80 days'),
('00000001-0000-0000-0000-000000000023', 410, '{"items":["Americano"]}', 'completed', now() - interval '112 days'),

-- Anjali Patel (c24)
('00000001-0000-0000-0000-000000000024', 540, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '30 days'),
('00000001-0000-0000-0000-000000000024', 470, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '65 days'),
('00000001-0000-0000-0000-000000000024', 400, '{"items":["Flat White"]}', 'completed', now() - interval '98 days'),

-- Vijay Narayan (c25)
('00000001-0000-0000-0000-000000000025', 670, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '19 days'),
('00000001-0000-0000-0000-000000000025', 600, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '52 days'),
('00000001-0000-0000-0000-000000000025', 520, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '85 days'),
('00000001-0000-0000-0000-000000000025', 450, '{"items":["Americano"]}', 'completed', now() - interval '118 days'),

-- New customers — 1–2 orders

-- Ishaan Malhotra (c26)
('00000001-0000-0000-0000-000000000026', 350, '{"items":["Cappuccino"]}', 'completed', now() - interval '5 days'),

-- Tanya Menon (c27)
('00000001-0000-0000-0000-000000000027', 480, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '3 days'),

-- Rohan Chatterjee (c28)
('00000001-0000-0000-0000-000000000028', 380, '{"items":["Cappuccino"]}', 'completed', now() - interval '7 days'),
('00000001-0000-0000-0000-000000000028', 340, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '10 days'),

-- Nisha Kapoor (c29)
('00000001-0000-0000-0000-000000000029', 280, '{"items":["Espresso"]}', 'completed', now() - interval '2 days'),

-- Aryan Saxena (c30)
('00000001-0000-0000-0000-000000000030', 330, '{"items":["Cold Brew"]}', 'completed', now() - interval '8 days'),
('00000001-0000-0000-0000-000000000030', 320, '{"items":["Cappuccino"]}', 'completed', now() - interval '12 days'),

-- Preethi Naidu (c31)
('00000001-0000-0000-0000-000000000031', 420, '{"items":["Filter Coffee","Vada"]}', 'completed', now() - interval '4 days'),

-- Kartik Bajaj (c32)
('00000001-0000-0000-0000-000000000032', 430, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '6 days'),
('00000001-0000-0000-0000-000000000032', 380, '{"items":["Cappuccino"]}', 'completed', now() - interval '9 days'),

-- Shreya Ghosh (c33)
('00000001-0000-0000-0000-000000000033', 390, '{"items":["Signature Latte"]}', 'completed', now() - interval '1 day'),

-- Dev Mathur (c34)
('00000001-0000-0000-0000-000000000034', 400, '{"items":["Cold Brew"]}', 'completed', now() - interval '9 days'),
('00000001-0000-0000-0000-000000000034', 360, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '11 days'),

-- Simran Oberoi (c35)
('00000001-0000-0000-0000-000000000035', 310, '{"items":["Americano"]}', 'completed', now() - interval '3 days'),

-- Churned customers — 3–4 orders (all 90+ days old)

-- Manish Dubey (c36)
('00000001-0000-0000-0000-000000000036', 520, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '120 days'),
('00000001-0000-0000-0000-000000000036', 480, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '150 days'),
('00000001-0000-0000-0000-000000000036', 420, '{"items":["Flat White"]}', 'completed', now() - interval '200 days'),

-- Rekha Nambiar (c37)
('00000001-0000-0000-0000-000000000037', 440, '{"items":["Filter Coffee","Cookie"]}', 'completed', now() - interval '95 days'),
('00000001-0000-0000-0000-000000000037', 390, '{"items":["Cold Brew"]}', 'completed', now() - interval '140 days'),
('00000001-0000-0000-0000-000000000037', 340, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '200 days'),

-- Praveen Rao (c38)
('00000001-0000-0000-0000-000000000038', 580, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '150 days'),
('00000001-0000-0000-0000-000000000038', 520, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '185 days'),
('00000001-0000-0000-0000-000000000038', 460, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '230 days'),

-- Madhuri Jain (c39)
('00000001-0000-0000-0000-000000000039', 400, '{"items":["Cold Brew"]}', 'completed', now() - interval '110 days'),
('00000001-0000-0000-0000-000000000039', 360, '{"items":["Cappuccino","Cookie"]}', 'completed', now() - interval '160 days'),
('00000001-0000-0000-0000-000000000039', 310, '{"items":["Americano"]}', 'completed', now() - interval '210 days'),

-- Sunil Pillai (c40)
('00000001-0000-0000-0000-000000000040', 550, '{"items":["Filter Coffee","Vada"]}', 'completed', now() - interval '180 days'),
('00000001-0000-0000-0000-000000000040', 490, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '220 days'),
('00000001-0000-0000-0000-000000000040', 430, '{"items":["Cappuccino","Muffin"]}', 'completed', now() - interval '270 days'),
('00000001-0000-0000-0000-000000000040', 380, '{"items":["Flat White"]}', 'completed', now() - interval '310 days'),

-- Geeta Srivastava (c41)
('00000001-0000-0000-0000-000000000041', 420, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '100 days'),
('00000001-0000-0000-0000-000000000041', 380, '{"items":["Cappuccino"]}', 'completed', now() - interval '145 days'),
('00000001-0000-0000-0000-000000000041', 340, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '195 days'),

-- Nikhil Deshpande (c42)
('00000001-0000-0000-0000-000000000042', 540, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '130 days'),
('00000001-0000-0000-0000-000000000042', 480, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '175 days'),
('00000001-0000-0000-0000-000000000042', 420, '{"items":["Flat White"]}', 'completed', now() - interval '225 days'),

-- Pallavi Iyer (c43)
('00000001-0000-0000-0000-000000000043', 490, '{"items":["Filter Coffee","Muffin"]}', 'completed', now() - interval '140 days'),
('00000001-0000-0000-0000-000000000043', 430, '{"items":["Cold Brew","Cookie"]}', 'completed', now() - interval '190 days'),
('00000001-0000-0000-0000-000000000043', 370, '{"items":["Cappuccino"]}', 'completed', now() - interval '240 days'),

-- Siddharth Mukherjee (c44)
('00000001-0000-0000-0000-000000000044', 520, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '92 days'),
('00000001-0000-0000-0000-000000000044', 460, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '135 days'),
('00000001-0000-0000-0000-000000000044', 400, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '185 days'),
('00000001-0000-0000-0000-000000000044', 350, '{"items":["Americano"]}', 'completed', now() - interval '230 days'),

-- Vandana Choudhary (c45)
('00000001-0000-0000-0000-000000000045', 380, '{"items":["Cold Brew"]}', 'completed', now() - interval '160 days'),
('00000001-0000-0000-0000-000000000045', 340, '{"items":["Cappuccino","Cookie"]}', 'completed', now() - interval '210 days'),
('00000001-0000-0000-0000-000000000045', 300, '{"items":["Americano"]}', 'completed', now() - interval '265 days'),

-- Mixed segment customers (c46–c50)

-- Abhishek Pandey (c46)
('00000001-0000-0000-0000-000000000046', 800, '{"items":["Cold Brew","Belgian Waffle"]}', 'completed', now() - interval '35 days'),
('00000001-0000-0000-0000-000000000046', 720, '{"items":["Cappuccino","Cheesecake"]}', 'completed', now() - interval '65 days'),
('00000001-0000-0000-0000-000000000046', 640, '{"items":["Flat White","Brownie"]}', 'completed', now() - interval '95 days'),
('00000001-0000-0000-0000-000000000046', 560, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '128 days'),

-- Ritu Khare (c47)
('00000001-0000-0000-0000-000000000047', 790, '{"items":["Signature Latte","Tiramisu"]}', 'completed', now() - interval '40 days'),
('00000001-0000-0000-0000-000000000047', 710, '{"items":["Cold Brew","Croissant"]}', 'completed', now() - interval '70 days'),
('00000001-0000-0000-0000-000000000047', 630, '{"items":["Cappuccino","Brownie"]}', 'completed', now() - interval '100 days'),
('00000001-0000-0000-0000-000000000047', 550, '{"items":["Flat White","Cookie"]}', 'completed', now() - interval '135 days'),

-- Mohit Anand (c48)
('00000001-0000-0000-0000-000000000048', 750, '{"items":["Cold Brew","Chocolate Cake"]}', 'completed', now() - interval '25 days'),
('00000001-0000-0000-0000-000000000048', 680, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '50 days'),
('00000001-0000-0000-0000-000000000048', 610, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '80 days'),
('00000001-0000-0000-0000-000000000048', 540, '{"items":["Americano"]}', 'completed', now() - interval '110 days'),
('00000001-0000-0000-0000-000000000048', 480, '{"items":["Espresso","Cookie"]}', 'completed', now() - interval '140 days'),

-- Swati Bhatnagar (c49)
('00000001-0000-0000-0000-000000000049', 730, '{"items":["Cold Brew","Cheesecake"]}', 'completed', now() - interval '45 days'),
('00000001-0000-0000-0000-000000000049', 660, '{"items":["Cappuccino","Brownie"]}', 'completed', now() - interval '78 days'),
('00000001-0000-0000-0000-000000000049', 580, '{"items":["Flat White","Croissant"]}', 'completed', now() - interval '108 days'),
('00000001-0000-0000-0000-000000000049', 510, '{"items":["Americano","Muffin"]}', 'completed', now() - interval '140 days'),

-- Harish Menon (c50)
('00000001-0000-0000-0000-000000000050', 760, '{"items":["Filter Coffee","Cake"]}', 'completed', now() - interval '20 days'),
('00000001-0000-0000-0000-000000000050', 690, '{"items":["Cold Brew","Brownie"]}', 'completed', now() - interval '48 days'),
('00000001-0000-0000-0000-000000000050', 620, '{"items":["Cappuccino","Croissant"]}', 'completed', now() - interval '78 days'),
('00000001-0000-0000-0000-000000000050', 550, '{"items":["Flat White","Muffin"]}', 'completed', now() - interval '108 days'),
('00000001-0000-0000-0000-000000000050', 490, '{"items":["Americano","Cookie"]}', 'completed', now() - interval '140 days');

