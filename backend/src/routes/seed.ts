import { Router } from 'express';
import { supabase } from '../services/supabase';
import { syncCampaignStats } from '../utils/stats';

const router = Router();

type SeedCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  total_orders: number;
  total_spent: number;
  last_order_date: Date;
  tags: string[];
  created_at: Date;
};

type SeedOrder = {
  customer_id: string;
  amount: number;
  items: { items: string[] };
  status: string;
  ordered_at: Date;
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function clearAllData() {
  const sentinel = '00000000-0000-0000-0000-000000000000';
  const operations = [
    { table: 'communications', column: 'id' },
    { table: 'orders', column: 'id' },
    { table: 'campaign_stats', column: 'campaign_id' },
    { table: 'campaigns', column: 'id' },
    { table: 'segment_members', column: 'segment_id' },
    { table: 'segments', column: 'id' },
    { table: 'customers', column: 'id' },
  ] as const;

  for (const operation of operations) {
    const { error } = await supabase.from(operation.table).delete().neq(operation.column, sentinel);
    if (error) throw error;
  }
}

export const seedCustomers: SeedCustomer[] = [
  {
    id: '00000001-0000-0000-0000-000000000001',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    phone: '+919820001001',
    city: 'Mumbai',
    total_orders: 5,
    total_spent: 14500,
    last_order_date: daysAgo(3),
    tags: ['vip'],
    created_at: daysAgo(180),
  },
  {
    id: '00000001-0000-0000-0000-000000000002',
    name: 'Priya Sharma',
    email: 'priya.sharma@outlook.com',
    phone: '+919810002002',
    city: 'Delhi',
    total_orders: 5,
    total_spent: 13200,
    last_order_date: daysAgo(5),
    tags: ['vip'],
    created_at: daysAgo(200),
  },
  {
    id: '00000001-0000-0000-0000-000000000003',
    name: 'Rohit Nair',
    email: 'rohit.nair@gmail.com',
    phone: '+919876003003',
    city: 'Bangalore',
    total_orders: 5,
    total_spent: 12800,
    last_order_date: daysAgo(1),
    tags: ['vip'],
    created_at: daysAgo(150),
  },
  {
    id: '00000001-0000-0000-0000-000000000004',
    name: 'Deepika Iyer',
    email: 'deepika.iyer@yahoo.com',
    phone: '+919845004004',
    city: 'Chennai',
    total_orders: 5,
    total_spent: 11700,
    last_order_date: daysAgo(7),
    tags: ['vip'],
    created_at: daysAgo(170),
  },
  {
    id: '00000001-0000-0000-0000-000000000005',
    name: 'Vikram Reddy',
    email: 'vikram.reddy@gmail.com',
    phone: '+919703005005',
    city: 'Hyderabad',
    total_orders: 5,
    total_spent: 15900,
    last_order_date: daysAgo(2),
    tags: ['vip'],
    created_at: daysAgo(220),
  },
  {
    id: '00000001-0000-0000-0000-000000000006',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@gmail.com',
    phone: '+919922006006',
    city: 'Pune',
    total_orders: 5,
    total_spent: 10500,
    last_order_date: daysAgo(4),
    tags: ['vip'],
    created_at: daysAgo(190),
  },
  {
    id: '00000001-0000-0000-0000-000000000007',
    name: 'Aditya Bose',
    email: 'aditya.bose@gmail.com',
    phone: '+919433007007',
    city: 'Bangalore',
    total_orders: 5,
    total_spent: 13400,
    last_order_date: daysAgo(6),
    tags: ['vip'],
    created_at: daysAgo(210),
  },
  {
    id: '00000001-0000-0000-0000-000000000008',
    name: 'Kavitha Pillai',
    email: 'kavitha.pillai@gmail.com',
    phone: '+919847008008',
    city: 'Chennai',
    total_orders: 5,
    total_spent: 11200,
    last_order_date: daysAgo(8),
    tags: ['vip'],
    created_at: daysAgo(160),
  },
  {
    id: '00000001-0000-0000-0000-000000000009',
    name: 'Suresh Joshi',
    email: 'suresh.joshi@hotmail.com',
    phone: '+919921009009',
    city: 'Pune',
    total_orders: 5,
    total_spent: 16200,
    last_order_date: daysAgo(1),
    tags: ['vip'],
    created_at: daysAgo(240),
  },
  {
    id: '00000001-0000-0000-0000-000000000010',
    name: 'Ananya Gupta',
    email: 'ananya.gupta@gmail.com',
    phone: '+919990010010',
    city: 'Delhi',
    total_orders: 5,
    total_spent: 10800,
    last_order_date: daysAgo(9),
    tags: ['vip'],
    created_at: daysAgo(180),
  },
  {
    id: '00000001-0000-0000-0000-000000000011',
    name: 'Rahul Verma',
    email: 'rahul.verma@gmail.com',
    phone: '+919811011011',
    city: 'Mumbai',
    total_orders: 4,
    total_spent: 4200,
    last_order_date: daysAgo(12),
    tags: ['regular'],
    created_at: daysAgo(120),
  },
  {
    id: '00000001-0000-0000-0000-000000000012',
    name: 'Pooja Mishra',
    email: 'pooja.mishra@gmail.com',
    phone: '+919930012012',
    city: 'Delhi',
    total_orders: 4,
    total_spent: 3800,
    last_order_date: daysAgo(15),
    tags: ['regular'],
    created_at: daysAgo(100),
  },
  {
    id: '00000001-0000-0000-0000-000000000013',
    name: 'Kiran Kumar',
    email: 'kiran.kumar@gmail.com',
    phone: '+919876013013',
    city: 'Bangalore',
    total_orders: 4,
    total_spent: 4500,
    last_order_date: daysAgo(10),
    tags: ['regular'],
    created_at: daysAgo(130),
  },
  {
    id: '00000001-0000-0000-0000-000000000014',
    name: 'Meera Krishnan',
    email: 'meera.krishnan@gmail.com',
    phone: '+919844014014',
    city: 'Chennai',
    total_orders: 3,
    total_spent: 2900,
    last_order_date: daysAgo(20),
    tags: ['regular'],
    created_at: daysAgo(110),
  },
  {
    id: '00000001-0000-0000-0000-000000000015',
    name: 'Sanjay Patil',
    email: 'sanjay.patil@gmail.com',
    phone: '+919970015015',
    city: 'Pune',
    total_orders: 4,
    total_spent: 3500,
    last_order_date: daysAgo(18),
    tags: ['regular'],
    created_at: daysAgo(140),
  },
  {
    id: '00000001-0000-0000-0000-000000000016',
    name: 'Neha Agarwal',
    email: 'neha.agarwal@gmail.com',
    phone: '+919999016016',
    city: 'Hyderabad',
    total_orders: 3,
    total_spent: 2700,
    last_order_date: daysAgo(25),
    tags: ['regular'],
    created_at: daysAgo(90),
  },
  {
    id: '00000001-0000-0000-0000-000000000017',
    name: 'Amit Singh',
    email: 'amit.singh@gmail.com',
    phone: '+919871017017',
    city: 'Delhi',
    total_orders: 4,
    total_spent: 4100,
    last_order_date: daysAgo(14),
    tags: ['regular'],
    created_at: daysAgo(105),
  },
  {
    id: '00000001-0000-0000-0000-000000000018',
    name: 'Divya Ramesh',
    email: 'divya.ramesh@gmail.com',
    phone: '+919942018018',
    city: 'Bangalore',
    total_orders: 3,
    total_spent: 3200,
    last_order_date: daysAgo(22),
    tags: ['regular'],
    created_at: daysAgo(115),
  },
  {
    id: '00000001-0000-0000-0000-000000000019',
    name: 'Manoj Tiwari',
    email: 'manoj.tiwari@gmail.com',
    phone: '+919902019019',
    city: 'Mumbai',
    total_orders: 4,
    total_spent: 4700,
    last_order_date: daysAgo(11),
    tags: ['regular'],
    created_at: daysAgo(135),
  },
  {
    id: '00000001-0000-0000-0000-000000000020',
    name: 'Lakshmi Venkat',
    email: 'lakshmi.venkat@gmail.com',
    phone: '+919843020020',
    city: 'Chennai',
    total_orders: 3,
    total_spent: 2500,
    last_order_date: daysAgo(28),
    tags: ['regular'],
    created_at: daysAgo(95),
  },
  {
    id: '00000001-0000-0000-0000-000000000021',
    name: 'Ravi Shankar',
    email: 'ravi.shankar@gmail.com',
    phone: '+919835021021',
    city: 'Hyderabad',
    total_orders: 4,
    total_spent: 4900,
    last_order_date: daysAgo(13),
    tags: ['regular'],
    created_at: daysAgo(125),
  },
  {
    id: '00000001-0000-0000-0000-000000000022',
    name: 'Sunita Deshpande',
    email: 'sunita.deshpande@gmail.com',
    phone: '+919822022022',
    city: 'Pune',
    total_orders: 3,
    total_spent: 3100,
    last_order_date: daysAgo(17),
    tags: ['regular'],
    created_at: daysAgo(108),
  },
  {
    id: '00000001-0000-0000-0000-000000000023',
    name: 'Gaurav Khanna',
    email: 'gaurav.khanna@gmail.com',
    phone: '+919987023023',
    city: 'Delhi',
    total_orders: 4,
    total_spent: 3700,
    last_order_date: daysAgo(16),
    tags: ['regular'],
    created_at: daysAgo(118),
  },
  {
    id: '00000001-0000-0000-0000-000000000024',
    name: 'Anjali Patel',
    email: 'anjali.patel@gmail.com',
    phone: '+919913024024',
    city: 'Bangalore',
    total_orders: 3,
    total_spent: 2800,
    last_order_date: daysAgo(30),
    tags: ['regular'],
    created_at: daysAgo(98),
  },
  {
    id: '00000001-0000-0000-0000-000000000025',
    name: 'Vijay Narayan',
    email: 'vijay.narayan@gmail.com',
    phone: '+919805025025',
    city: 'Mumbai',
    total_orders: 4,
    total_spent: 4300,
    last_order_date: daysAgo(19),
    tags: ['regular'],
    created_at: daysAgo(128),
  },
  {
    id: '00000001-0000-0000-0000-000000000026',
    name: 'Ishaan Malhotra',
    email: 'ishaan.malhotra@gmail.com',
    phone: '+919876026026',
    city: 'Delhi',
    total_orders: 1,
    total_spent: 350,
    last_order_date: daysAgo(5),
    tags: ['new'],
    created_at: daysAgo(6),
  },
  {
    id: '00000001-0000-0000-0000-000000000027',
    name: 'Tanya Menon',
    email: 'tanya.menon@gmail.com',
    phone: '+919847027027',
    city: 'Bangalore',
    total_orders: 1,
    total_spent: 480,
    last_order_date: daysAgo(3),
    tags: ['new'],
    created_at: daysAgo(4),
  },
  {
    id: '00000001-0000-0000-0000-000000000028',
    name: 'Rohan Chatterjee',
    email: 'rohan.chatterjee@gmail.com',
    phone: '+919433028028',
    city: 'Kolkata',
    total_orders: 2,
    total_spent: 720,
    last_order_date: daysAgo(7),
    tags: ['new'],
    created_at: daysAgo(10),
  },
  {
    id: '00000001-0000-0000-0000-000000000029',
    name: 'Nisha Kapoor',
    email: 'nisha.kapoor@gmail.com',
    phone: '+919990029029',
    city: 'Mumbai',
    total_orders: 1,
    total_spent: 280,
    last_order_date: daysAgo(2),
    tags: ['new'],
    created_at: daysAgo(3),
  },
  {
    id: '00000001-0000-0000-0000-000000000030',
    name: 'Aryan Saxena',
    email: 'aryan.saxena@gmail.com',
    phone: '+919820030030',
    city: 'Pune',
    total_orders: 2,
    total_spent: 650,
    last_order_date: daysAgo(8),
    tags: ['new'],
    created_at: daysAgo(12),
  },
  {
    id: '00000001-0000-0000-0000-000000000031',
    name: 'Preethi Naidu',
    email: 'preethi.naidu@gmail.com',
    phone: '+919843031031',
    city: 'Hyderabad',
    total_orders: 1,
    total_spent: 420,
    last_order_date: daysAgo(4),
    tags: ['new'],
    created_at: daysAgo(5),
  },
  {
    id: '00000001-0000-0000-0000-000000000032',
    name: 'Kartik Bajaj',
    email: 'kartik.bajaj@gmail.com',
    phone: '+919921032032',
    city: 'Delhi',
    total_orders: 2,
    total_spent: 810,
    last_order_date: daysAgo(6),
    tags: ['new'],
    created_at: daysAgo(9),
  },
  {
    id: '00000001-0000-0000-0000-000000000033',
    name: 'Shreya Ghosh',
    email: 'shreya.ghosh@gmail.com',
    phone: '+919930033033',
    city: 'Bangalore',
    total_orders: 1,
    total_spent: 390,
    last_order_date: daysAgo(1),
    tags: ['new'],
    created_at: daysAgo(2),
  },
  {
    id: '00000001-0000-0000-0000-000000000034',
    name: 'Dev Mathur',
    email: 'dev.mathur@gmail.com',
    phone: '+919811034034',
    city: 'Chennai',
    total_orders: 2,
    total_spent: 760,
    last_order_date: daysAgo(9),
    tags: ['new'],
    created_at: daysAgo(11),
  },
  {
    id: '00000001-0000-0000-0000-000000000035',
    name: 'Simran Oberoi',
    email: 'simran.oberoi@gmail.com',
    phone: '+919999035035',
    city: 'Mumbai',
    total_orders: 1,
    total_spent: 310,
    last_order_date: daysAgo(3),
    tags: ['new'],
    created_at: daysAgo(4),
  },
  {
    id: '00000001-0000-0000-0000-000000000036',
    name: 'Manish Dubey',
    email: 'manish.dubey@gmail.com',
    phone: '+919871036036',
    city: 'Delhi',
    total_orders: 3,
    total_spent: 2200,
    last_order_date: daysAgo(120),
    tags: ['regular'],
    created_at: daysAgo(300),
  },
  {
    id: '00000001-0000-0000-0000-000000000037',
    name: 'Rekha Nambiar',
    email: 'rekha.nambiar@gmail.com',
    phone: '+919942037037',
    city: 'Bangalore',
    total_orders: 3,
    total_spent: 1900,
    last_order_date: daysAgo(95),
    tags: ['regular'],
    created_at: daysAgo(280),
  },
  {
    id: '00000001-0000-0000-0000-000000000038',
    name: 'Praveen Rao',
    email: 'praveen.rao@gmail.com',
    phone: '+919902038038',
    city: 'Hyderabad',
    total_orders: 3,
    total_spent: 2600,
    last_order_date: daysAgo(150),
    tags: ['regular'],
    created_at: daysAgo(320),
  },
  {
    id: '00000001-0000-0000-0000-000000000039',
    name: 'Madhuri Jain',
    email: 'madhuri.jain@gmail.com',
    phone: '+919835039039',
    city: 'Pune',
    total_orders: 3,
    total_spent: 1700,
    last_order_date: daysAgo(110),
    tags: ['regular'],
    created_at: daysAgo(290),
  },
  {
    id: '00000001-0000-0000-0000-000000000040',
    name: 'Sunil Pillai',
    email: 'sunil.pillai@gmail.com',
    phone: '+919805040040',
    city: 'Chennai',
    total_orders: 4,
    total_spent: 3000,
    last_order_date: daysAgo(180),
    tags: ['regular'],
    created_at: daysAgo(350),
  },
  {
    id: '00000001-0000-0000-0000-000000000041',
    name: 'Geeta Srivastava',
    email: 'geeta.srivastava@gmail.com',
    phone: '+919810041041',
    city: 'Mumbai',
    total_orders: 3,
    total_spent: 1800,
    last_order_date: daysAgo(100),
    tags: ['regular'],
    created_at: daysAgo(260),
  },
  {
    id: '00000001-0000-0000-0000-000000000042',
    name: 'Nikhil Deshpande',
    email: 'nikhil.deshpande@gmail.com',
    phone: '+919970042042',
    city: 'Pune',
    total_orders: 3,
    total_spent: 2400,
    last_order_date: daysAgo(130),
    tags: ['regular'],
    created_at: daysAgo(310),
  },
  {
    id: '00000001-0000-0000-0000-000000000043',
    name: 'Pallavi Iyer',
    email: 'pallavi.iyer@gmail.com',
    phone: '+919844043043',
    city: 'Bangalore',
    total_orders: 3,
    total_spent: 2100,
    last_order_date: daysAgo(140),
    tags: ['regular'],
    created_at: daysAgo(330),
  },
  {
    id: '00000001-0000-0000-0000-000000000044',
    name: 'Siddharth Mukherjee',
    email: 'sid.mukherjee@gmail.com',
    phone: '+919913044044',
    city: 'Delhi',
    total_orders: 4,
    total_spent: 2800,
    last_order_date: daysAgo(92),
    tags: ['regular'],
    created_at: daysAgo(270),
  },
  {
    id: '00000001-0000-0000-0000-000000000045',
    name: 'Vandana Choudhary',
    email: 'vandana.ch@gmail.com',
    phone: '+919987045045',
    city: 'Hyderabad',
    total_orders: 3,
    total_spent: 1600,
    last_order_date: daysAgo(160),
    tags: ['regular'],
    created_at: daysAgo(340),
  },
  {
    id: '00000001-0000-0000-0000-000000000046',
    name: 'Abhishek Pandey',
    email: 'abhishek.pandey@gmail.com',
    phone: '+919876046046',
    city: 'Mumbai',
    total_orders: 4,
    total_spent: 5500,
    last_order_date: daysAgo(35),
    tags: ['regular'],
    created_at: daysAgo(145),
  },
  {
    id: '00000001-0000-0000-0000-000000000047',
    name: 'Ritu Khare',
    email: 'ritu.khare@gmail.com',
    phone: '+919820047047',
    city: 'Delhi',
    total_orders: 4,
    total_spent: 6200,
    last_order_date: daysAgo(40),
    tags: ['regular'],
    created_at: daysAgo(155),
  },
  {
    id: '00000001-0000-0000-0000-000000000048',
    name: 'Mohit Anand',
    email: 'mohit.anand@gmail.com',
    phone: '+919921048048',
    city: 'Bangalore',
    total_orders: 5,
    total_spent: 8900,
    last_order_date: daysAgo(25),
    tags: ['regular'],
    created_at: daysAgo(165),
  },
  {
    id: '00000001-0000-0000-0000-000000000049',
    name: 'Swati Bhatnagar',
    email: 'swati.bhatnagar@gmail.com',
    phone: '+919843049049',
    city: 'Pune',
    total_orders: 4,
    total_spent: 7100,
    last_order_date: daysAgo(45),
    tags: ['regular'],
    created_at: daysAgo(175),
  },
  {
    id: '00000001-0000-0000-0000-000000000050',
    name: 'Harish Menon',
    email: 'harish.menon@gmail.com',
    phone: '+919847050050',
    city: 'Chennai',
    total_orders: 5,
    total_spent: 9600,
    last_order_date: daysAgo(20),
    tags: ['regular'],
    created_at: daysAgo(185),
  },
];

export const seedOrders: SeedOrder[] = [
  { customer_id: '00000001-0000-0000-0000-000000000001', amount: 750, items: { items: ['Cold Brew', 'Blueberry Muffin'] }, status: 'completed', ordered_at: daysAgo(3) },
  { customer_id: '00000001-0000-0000-0000-000000000001', amount: 680, items: { items: ['Cappuccino', 'Croissant', 'Sandwich'] }, status: 'completed', ordered_at: daysAgo(20) },
  { customer_id: '00000001-0000-0000-0000-000000000001', amount: 620, items: { items: ['Flat White', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(45) },
  { customer_id: '00000001-0000-0000-0000-000000000001', amount: 580, items: { items: ['Americano', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(75) },
  { customer_id: '00000001-0000-0000-0000-000000000001', amount: 550, items: { items: ['Espresso', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(110) },
  { customer_id: '00000001-0000-0000-0000-000000000002', amount: 800, items: { items: ['Signature Latte', 'Belgian Waffle'] }, status: 'completed', ordered_at: daysAgo(5) },
  { customer_id: '00000001-0000-0000-0000-000000000002', amount: 720, items: { items: ['Cold Brew', 'Almond Croissant'] }, status: 'completed', ordered_at: daysAgo(22) },
  { customer_id: '00000001-0000-0000-0000-000000000002', amount: 650, items: { items: ['Cappuccino', 'Tiramisu'] }, status: 'completed', ordered_at: daysAgo(50) },
  { customer_id: '00000001-0000-0000-0000-000000000002', amount: 600, items: { items: ['Flat White', 'Banana Bread'] }, status: 'completed', ordered_at: daysAgo(80) },
  { customer_id: '00000001-0000-0000-0000-000000000002', amount: 430, items: { items: ['Masala Chai', 'Cookies'] }, status: 'completed', ordered_at: daysAgo(120) },
  { customer_id: '00000001-0000-0000-0000-000000000003', amount: 780, items: { items: ['Filter Coffee', 'Ekam Waffle'] }, status: 'completed', ordered_at: daysAgo(1) },
  { customer_id: '00000001-0000-0000-0000-000000000003', amount: 700, items: { items: ['Cold Brew', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(18) },
  { customer_id: '00000001-0000-0000-0000-000000000003', amount: 620, items: { items: ['Cappuccino', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(40) },
  { customer_id: '00000001-0000-0000-0000-000000000003', amount: 560, items: { items: ['Americano', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(70) },
  { customer_id: '00000001-0000-0000-0000-000000000003', amount: 500, items: { items: ['Espresso'] }, status: 'completed', ordered_at: daysAgo(100) },
  { customer_id: '00000001-0000-0000-0000-000000000004', amount: 700, items: { items: ['South Indian Filter Coffee', 'Idli'] }, status: 'completed', ordered_at: daysAgo(7) },
  { customer_id: '00000001-0000-0000-0000-000000000004', amount: 650, items: { items: ['Cappuccino', 'Sandesh'] }, status: 'completed', ordered_at: daysAgo(28) },
  { customer_id: '00000001-0000-0000-0000-000000000004', amount: 580, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(55) },
  { customer_id: '00000001-0000-0000-0000-000000000004', amount: 520, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(85) },
  { customer_id: '00000001-0000-0000-0000-000000000004', amount: 450, items: { items: ['Americano', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(115) },
  { customer_id: '00000001-0000-0000-0000-000000000005', amount: 800, items: { items: ['Cold Brew', 'Chocolate Cake'] }, status: 'completed', ordered_at: daysAgo(2) },
  { customer_id: '00000001-0000-0000-0000-000000000005', amount: 780, items: { items: ['Signature Latte', 'Croissant', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(15) },
  { customer_id: '00000001-0000-0000-0000-000000000005', amount: 750, items: { items: ['Cappuccino', 'Tiramisu'] }, status: 'completed', ordered_at: daysAgo(38) },
  { customer_id: '00000001-0000-0000-0000-000000000005', amount: 700, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(65) },
  { customer_id: '00000001-0000-0000-0000-000000000005', amount: 620, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(95) },
  { customer_id: '00000001-0000-0000-0000-000000000006', amount: 680, items: { items: ['Cold Brew', 'Banana Bread'] }, status: 'completed', ordered_at: daysAgo(4) },
  { customer_id: '00000001-0000-0000-0000-000000000006', amount: 620, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(25) },
  { customer_id: '00000001-0000-0000-0000-000000000006', amount: 550, items: { items: ['Flat White', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(52) },
  { customer_id: '00000001-0000-0000-0000-000000000006', amount: 490, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(82) },
  { customer_id: '00000001-0000-0000-0000-000000000006', amount: 450, items: { items: ['Espresso', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(112) },
  { customer_id: '00000001-0000-0000-0000-000000000007', amount: 750, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(6) },
  { customer_id: '00000001-0000-0000-0000-000000000007', amount: 690, items: { items: ['Cappuccino', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(26) },
  { customer_id: '00000001-0000-0000-0000-000000000007', amount: 610, items: { items: ['Flat White', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(53) },
  { customer_id: '00000001-0000-0000-0000-000000000007', amount: 560, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(83) },
  { customer_id: '00000001-0000-0000-0000-000000000007', amount: 490, items: { items: ['Espresso', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(113) },
  { customer_id: '00000001-0000-0000-0000-000000000008', amount: 720, items: { items: ['Filter Coffee', 'Cake'] }, status: 'completed', ordered_at: daysAgo(8) },
  { customer_id: '00000001-0000-0000-0000-000000000008', amount: 650, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(30) },
  { customer_id: '00000001-0000-0000-0000-000000000008', amount: 580, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(58) },
  { customer_id: '00000001-0000-0000-0000-000000000008', amount: 510, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(88) },
  { customer_id: '00000001-0000-0000-0000-000000000008', amount: 440, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(118) },
  { customer_id: '00000001-0000-0000-0000-000000000009', amount: 800, items: { items: ['Cold Brew', 'Chocolate Cake', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(1) },
  { customer_id: '00000001-0000-0000-0000-000000000009', amount: 790, items: { items: ['Signature Latte', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(14) },
  { customer_id: '00000001-0000-0000-0000-000000000009', amount: 720, items: { items: ['Cappuccino', 'Tiramisu'] }, status: 'completed', ordered_at: daysAgo(35) },
  { customer_id: '00000001-0000-0000-0000-000000000009', amount: 670, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(62) },
  { customer_id: '00000001-0000-0000-0000-000000000009', amount: 600, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(92) },
  { customer_id: '00000001-0000-0000-0000-000000000010', amount: 700, items: { items: ['Cold Brew', 'Belgian Waffle'] }, status: 'completed', ordered_at: daysAgo(9) },
  { customer_id: '00000001-0000-0000-0000-000000000010', amount: 640, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(32) },
  { customer_id: '00000001-0000-0000-0000-000000000010', amount: 570, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(60) },
  { customer_id: '00000001-0000-0000-0000-000000000010', amount: 510, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(90) },
  { customer_id: '00000001-0000-0000-0000-000000000010', amount: 460, items: { items: ['Espresso', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(120) },
  { customer_id: '00000001-0000-0000-0000-000000000011', amount: 650, items: { items: ['Cold Brew', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(12) },
  { customer_id: '00000001-0000-0000-0000-000000000011', amount: 580, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(40) },
  { customer_id: '00000001-0000-0000-0000-000000000011', amount: 510, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(75) },
  { customer_id: '00000001-0000-0000-0000-000000000011', amount: 460, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(110) },
  { customer_id: '00000001-0000-0000-0000-000000000012', amount: 600, items: { items: ['Signature Latte', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(15) },
  { customer_id: '00000001-0000-0000-0000-000000000012', amount: 540, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(42) },
  { customer_id: '00000001-0000-0000-0000-000000000012', amount: 470, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(78) },
  { customer_id: '00000001-0000-0000-0000-000000000012', amount: 430, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(115) },
  { customer_id: '00000001-0000-0000-0000-000000000013', amount: 700, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(10) },
  { customer_id: '00000001-0000-0000-0000-000000000013', amount: 620, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(38) },
  { customer_id: '00000001-0000-0000-0000-000000000013', amount: 550, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(72) },
  { customer_id: '00000001-0000-0000-0000-000000000013', amount: 480, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(105) },
  { customer_id: '00000001-0000-0000-0000-000000000014', amount: 580, items: { items: ['Filter Coffee', 'Idli'] }, status: 'completed', ordered_at: daysAgo(20) },
  { customer_id: '00000001-0000-0000-0000-000000000014', amount: 520, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(55) },
  { customer_id: '00000001-0000-0000-0000-000000000014', amount: 450, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(90) },
  { customer_id: '00000001-0000-0000-0000-000000000015', amount: 560, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(18) },
  { customer_id: '00000001-0000-0000-0000-000000000015', amount: 490, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(48) },
  { customer_id: '00000001-0000-0000-0000-000000000015', amount: 430, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(80) },
  { customer_id: '00000001-0000-0000-0000-000000000015', amount: 380, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(115) },
  { customer_id: '00000001-0000-0000-0000-000000000016', amount: 520, items: { items: ['Signature Latte'] }, status: 'completed', ordered_at: daysAgo(25) },
  { customer_id: '00000001-0000-0000-0000-000000000016', amount: 460, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(58) },
  { customer_id: '00000001-0000-0000-0000-000000000016', amount: 400, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(88) },
  { customer_id: '00000001-0000-0000-0000-000000000017', amount: 640, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(14) },
  { customer_id: '00000001-0000-0000-0000-000000000017', amount: 570, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(44) },
  { customer_id: '00000001-0000-0000-0000-000000000017', amount: 500, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(76) },
  { customer_id: '00000001-0000-0000-0000-000000000017', amount: 440, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(108) },
  { customer_id: '00000001-0000-0000-0000-000000000018', amount: 600, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(22) },
  { customer_id: '00000001-0000-0000-0000-000000000018', amount: 530, items: { items: ['Cappuccino', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(55) },
  { customer_id: '00000001-0000-0000-0000-000000000018', amount: 460, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(88) },
  { customer_id: '00000001-0000-0000-0000-000000000019', amount: 720, items: { items: ['Cold Brew', 'Belgian Waffle'] }, status: 'completed', ordered_at: daysAgo(11) },
  { customer_id: '00000001-0000-0000-0000-000000000019', amount: 650, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(35) },
  { customer_id: '00000001-0000-0000-0000-000000000019', amount: 570, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(65) },
  { customer_id: '00000001-0000-0000-0000-000000000019', amount: 490, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(95) },
  { customer_id: '00000001-0000-0000-0000-000000000020', amount: 500, items: { items: ['Filter Coffee', 'Vada'] }, status: 'completed', ordered_at: daysAgo(28) },
  { customer_id: '00000001-0000-0000-0000-000000000020', amount: 440, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(62) },
  { customer_id: '00000001-0000-0000-0000-000000000020', amount: 380, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(95) },
  { customer_id: '00000001-0000-0000-0000-000000000021', amount: 760, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(13) },
  { customer_id: '00000001-0000-0000-0000-000000000021', amount: 680, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(40) },
  { customer_id: '00000001-0000-0000-0000-000000000021', amount: 600, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(70) },
  { customer_id: '00000001-0000-0000-0000-000000000021', amount: 530, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(100) },
  { customer_id: '00000001-0000-0000-0000-000000000022', amount: 580, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(17) },
  { customer_id: '00000001-0000-0000-0000-000000000022', amount: 510, items: { items: ['Cappuccino', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(50) },
  { customer_id: '00000001-0000-0000-0000-000000000022', amount: 440, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(85) },
  { customer_id: '00000001-0000-0000-0000-000000000023', amount: 620, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(16) },
  { customer_id: '00000001-0000-0000-0000-000000000023', amount: 550, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(46) },
  { customer_id: '00000001-0000-0000-0000-000000000023', amount: 480, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(80) },
  { customer_id: '00000001-0000-0000-0000-000000000023', amount: 410, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(112) },
  { customer_id: '00000001-0000-0000-0000-000000000024', amount: 540, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(30) },
  { customer_id: '00000001-0000-0000-0000-000000000024', amount: 470, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(65) },
  { customer_id: '00000001-0000-0000-0000-000000000024', amount: 400, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(98) },
  { customer_id: '00000001-0000-0000-0000-000000000025', amount: 670, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(19) },
  { customer_id: '00000001-0000-0000-0000-000000000025', amount: 600, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(52) },
  { customer_id: '00000001-0000-0000-0000-000000000025', amount: 520, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(85) },
  { customer_id: '00000001-0000-0000-0000-000000000025', amount: 450, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(118) },
  { customer_id: '00000001-0000-0000-0000-000000000026', amount: 350, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(5) },
  { customer_id: '00000001-0000-0000-0000-000000000027', amount: 480, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(3) },
  { customer_id: '00000001-0000-0000-0000-000000000028', amount: 380, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(7) },
  { customer_id: '00000001-0000-0000-0000-000000000028', amount: 340, items: { items: ['Americano', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(10) },
  { customer_id: '00000001-0000-0000-0000-000000000029', amount: 280, items: { items: ['Espresso'] }, status: 'completed', ordered_at: daysAgo(2) },
  { customer_id: '00000001-0000-0000-0000-000000000030', amount: 330, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(8) },
  { customer_id: '00000001-0000-0000-0000-000000000030', amount: 320, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(12) },
  { customer_id: '00000001-0000-0000-0000-000000000031', amount: 420, items: { items: ['Filter Coffee', 'Vada'] }, status: 'completed', ordered_at: daysAgo(4) },
  { customer_id: '00000001-0000-0000-0000-000000000032', amount: 430, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(6) },
  { customer_id: '00000001-0000-0000-0000-000000000032', amount: 380, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(9) },
  { customer_id: '00000001-0000-0000-0000-000000000033', amount: 390, items: { items: ['Signature Latte'] }, status: 'completed', ordered_at: daysAgo(1) },
  { customer_id: '00000001-0000-0000-0000-000000000034', amount: 400, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(9) },
  { customer_id: '00000001-0000-0000-0000-000000000034', amount: 360, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(11) },
  { customer_id: '00000001-0000-0000-0000-000000000035', amount: 310, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(3) },
  { customer_id: '00000001-0000-0000-0000-000000000036', amount: 520, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(120) },
  { customer_id: '00000001-0000-0000-0000-000000000036', amount: 480, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(150) },
  { customer_id: '00000001-0000-0000-0000-000000000036', amount: 420, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(200) },
  { customer_id: '00000001-0000-0000-0000-000000000037', amount: 440, items: { items: ['Filter Coffee', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(95) },
  { customer_id: '00000001-0000-0000-0000-000000000037', amount: 390, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(140) },
  { customer_id: '00000001-0000-0000-0000-000000000037', amount: 340, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(200) },
  { customer_id: '00000001-0000-0000-0000-000000000038', amount: 580, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(150) },
  { customer_id: '00000001-0000-0000-0000-000000000038', amount: 520, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(185) },
  { customer_id: '00000001-0000-0000-0000-000000000038', amount: 460, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(230) },
  { customer_id: '00000001-0000-0000-0000-000000000039', amount: 400, items: { items: ['Cold Brew'] }, status: 'completed', ordered_at: daysAgo(110) },
  { customer_id: '00000001-0000-0000-0000-000000000039', amount: 360, items: { items: ['Cappuccino', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(160) },
  { customer_id: '00000001-0000-0000-0000-000000000039', amount: 310, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(210) },
  { customer_id: '00000001-0000-0000-0000-000000000040', amount: 550, items: { items: ['Filter Coffee', 'Vada'] }, status: 'completed', ordered_at: daysAgo(180) },
  { customer_id: '00000001-0000-0000-0000-000000000040', amount: 490, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(220) },
  { customer_id: '00000001-0000-0000-0000-000000000040', amount: 430, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(270) },
  { customer_id: '00000001-0000-0000-0000-000000000040', amount: 380, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(310) },
  { customer_id: '00000001-0000-0000-0000-000000000041', amount: 420, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(100) },
  { customer_id: '00000001-0000-0000-0000-000000000041', amount: 380, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(145) },
  { customer_id: '00000001-0000-0000-0000-000000000041', amount: 340, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(195) },
  { customer_id: '00000001-0000-0000-0000-000000000042', amount: 540, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(130) },
  { customer_id: '00000001-0000-0000-0000-000000000042', amount: 480, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(175) },
  { customer_id: '00000001-0000-0000-0000-000000000042', amount: 420, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(225) },
  { customer_id: '00000001-0000-0000-0000-000000000043', amount: 490, items: { items: ['Filter Coffee', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(140) },
  { customer_id: '00000001-0000-0000-0000-000000000043', amount: 430, items: { items: ['Cold Brew', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(190) },
  { customer_id: '00000001-0000-0000-0000-000000000043', amount: 370, items: { items: ['Cappuccino'] }, status: 'completed', ordered_at: daysAgo(240) },
  { customer_id: '00000001-0000-0000-0000-000000000044', amount: 520, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(92) },
  { customer_id: '00000001-0000-0000-0000-000000000044', amount: 460, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(135) },
  { customer_id: '00000001-0000-0000-0000-000000000044', amount: 400, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(185) },
  { customer_id: '00000001-0000-0000-0000-000000000044', amount: 350, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(230) },
  { customer_id: '00000001-0000-0000-0000-000000000045', amount: 480, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(160) },
  { customer_id: '00000001-0000-0000-0000-000000000045', amount: 420, items: { items: ['Cappuccino', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(220) },
  { customer_id: '00000001-0000-0000-0000-000000000045', amount: 360, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(260) },
  { customer_id: '00000001-0000-0000-0000-000000000046', amount: 700, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(35) },
  { customer_id: '00000001-0000-0000-0000-000000000046', amount: 620, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(70) },
  { customer_id: '00000001-0000-0000-0000-000000000046', amount: 540, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(100) },
  { customer_id: '00000001-0000-0000-0000-000000000046', amount: 470, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(140) },
  { customer_id: '00000001-0000-0000-0000-000000000047', amount: 760, items: { items: ['Cold Brew', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(40) },
  { customer_id: '00000001-0000-0000-0000-000000000047', amount: 680, items: { items: ['Cappuccino', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(80) },
  { customer_id: '00000001-0000-0000-0000-000000000047', amount: 600, items: { items: ['Flat White'] }, status: 'completed', ordered_at: daysAgo(120) },
  { customer_id: '00000001-0000-0000-0000-000000000047', amount: 530, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(160) },
  { customer_id: '00000001-0000-0000-0000-000000000048', amount: 820, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(25) },
  { customer_id: '00000001-0000-0000-0000-000000000048', amount: 740, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(60) },
  { customer_id: '00000001-0000-0000-0000-000000000048', amount: 660, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(90) },
  { customer_id: '00000001-0000-0000-0000-000000000048', amount: 590, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(130) },
  { customer_id: '00000001-0000-0000-0000-000000000048', amount: 520, items: { items: ['Espresso'] }, status: 'completed', ordered_at: daysAgo(170) },
  { customer_id: '00000001-0000-0000-0000-000000000049', amount: 780, items: { items: ['Cold Brew', 'Brownie'] }, status: 'completed', ordered_at: daysAgo(45) },
  { customer_id: '00000001-0000-0000-0000-000000000049', amount: 700, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(85) },
  { customer_id: '00000001-0000-0000-0000-000000000049', amount: 620, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(125) },
  { customer_id: '00000001-0000-0000-0000-000000000049', amount: 550, items: { items: ['Americano'] }, status: 'completed', ordered_at: daysAgo(165) },
  { customer_id: '00000001-0000-0000-0000-000000000050', amount: 860, items: { items: ['Cold Brew', 'Cheesecake'] }, status: 'completed', ordered_at: daysAgo(20) },
  { customer_id: '00000001-0000-0000-0000-000000000050', amount: 780, items: { items: ['Cappuccino', 'Croissant'] }, status: 'completed', ordered_at: daysAgo(55) },
  { customer_id: '00000001-0000-0000-0000-000000000050', amount: 700, items: { items: ['Flat White', 'Muffin'] }, status: 'completed', ordered_at: daysAgo(95) },
  { customer_id: '00000001-0000-0000-0000-000000000050', amount: 620, items: { items: ['Americano', 'Cookie'] }, status: 'completed', ordered_at: daysAgo(135) },
  { customer_id: '00000001-0000-0000-0000-000000000050', amount: 560, items: { items: ['Espresso'] }, status: 'completed', ordered_at: daysAgo(175) },
];

/**
 * POST /seed
 * Clears existing demo data in the required FK-safe order and reloads the full seed dataset.
 */
router.post('/', async (_req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ success: false, error: 'Not allowed in production' });
      return;
    }

    await clearAllData();

    const { error: customersError } = await supabase.from('customers').insert(seedCustomers);
    if (customersError) throw customersError;

    const { error: ordersError } = await supabase.from('orders').insert(seedOrders);
    if (ordersError) throw ordersError;

    // Seed dummy segment, campaign, and stats for attribution tracking
    const { data: defaultSeg, error: defaultSegErr } = await supabase
      .from('segments')
      .insert({
        name: 'Inactive Customers Demo',
        description: 'Seeded segment for attribution demo',
        filter_rules: {
          logic: 'AND',
          rules: [{ field: 'last_order_date', operator: 'days_ago_gt', value: daysAgo(90).toISOString() }]
        },
        customer_count: 10,
        created_by_ai: false,
        created_at: daysAgo(5).toISOString()
      })
      .select()
      .single();

    if (defaultSegErr) throw defaultSegErr;

    if (defaultSeg) {
      const { data: defaultCampaign, error: defaultCampErr } = await supabase
        .from('campaigns')
        .insert({
          name: 'Re-engage Inactive Customers',
          segment_id: defaultSeg.id,
          channel: 'email',
          message_template: 'Hey {{name}}, we miss you! Here is a coupon for free coffee.',
          status: 'completed',
          ai_generated: true,
          created_at: daysAgo(4).toISOString(),
          sent_at: daysAgo(4).toISOString()
        })
        .select()
        .single();

      if (defaultCampErr) throw defaultCampErr;

      if (defaultCampaign) {
        // Create campaign_stats placeholder
        const { error: statsError } = await supabase.from('campaign_stats').insert({
          campaign_id: defaultCampaign.id,
        });
        if (statsError) throw statsError;

        // Perform random attribution on existing orders for the 10 inactive customers
        const inactiveCustomerIds = [
          '00000001-0000-0000-0000-000000000036',
          '00000001-0000-0000-0000-000000000037',
          '00000001-0000-0000-0000-000000000038',
          '00000001-0000-0000-0000-000000000039',
          '00000001-0000-0000-0000-000000000040',
          '00000001-0000-0000-0000-000000000041',
          '00000001-0000-0000-0000-000000000042',
          '00000001-0000-0000-0000-000000000043',
          '00000001-0000-0000-0000-000000000044',
          '00000001-0000-0000-0000-000000000045'
        ];

        // Fetch the generated orders for these customers from the DB
        const { data: dbOrders, error: fetchOrdersError } = await supabase
          .from('orders')
          .select('id, customer_id')
          .in('customer_id', inactiveCustomerIds);

        if (fetchOrdersError) throw fetchOrdersError;

        if (dbOrders && dbOrders.length > 0) {
          // Group by customer_id
          const ordersByCustomer: Record<string, string[]> = {};
          for (const o of dbOrders) {
            if (!ordersByCustomer[o.customer_id]) {
              ordersByCustomer[o.customer_id] = [];
            }
            ordersByCustomer[o.customer_id].push(o.id);
          }

          let conversionsCount = 0;
          const ordersToAttribute: string[] = [];

          // Only attribute orders for customers who actually clicked (first 3 customers of inactive list, who have status = 'clicked')
          const convertingCustomerIds = inactiveCustomerIds.slice(0, 3);

          for (const cid of convertingCustomerIds) {
            const oids = ordersByCustomer[cid] || [];
            if (oids.length > 0) {
              const countToPick = 1;
              const shuffled = oids.sort(() => 0.5 - Math.random());
              const picked = shuffled.slice(0, countToPick);
              ordersToAttribute.push(...picked);
              conversionsCount += picked.length;
            }
          }

          if (ordersToAttribute.length > 0) {
            const { error: updateOrdersError } = await supabase
              .from('orders')
              .update({ 
                attributed_campaign_id: defaultCampaign.id,
                ordered_at: daysAgo(3).toISOString()
              })
              .in('id', ordersToAttribute);
            if (updateOrdersError) throw updateOrdersError;

            const { error: updateCustomersError } = await supabase
              .from('customers')
              .update({ last_order_date: daysAgo(3).toISOString() })
              .in('id', convertingCustomerIds);
            if (updateCustomersError) throw updateCustomersError;
          }
        }

        // Seed communications records for the 10 inactive customers
        const commSeedData = inactiveCustomerIds.map((cid, idx) => {
          let status = 'delivered';
          if (idx < 5) status = 'clicked';
          else if (idx < 8) status = 'opened';

          return {
            campaign_id: defaultCampaign.id,
            customer_id: cid,
            channel: 'email',
            message: 'Hey customer, we miss you! Here is a coupon for free coffee.',
            status,
            external_id: `seeded_comm_${idx}`,
            sent_at: daysAgo(4).toISOString(),
            delivered_at: daysAgo(4).toISOString(),
            opened_at: idx < 8 ? daysAgo(4).toISOString() : null,
            clicked_at: idx < 5 ? daysAgo(4).toISOString() : null,
            created_at: daysAgo(4).toISOString(),
          };
        });

        const { error: commSeedErr } = await supabase
          .from('communications')
          .insert(commSeedData);
        if (commSeedErr) throw commSeedErr;

        // Finally, sync stats for the default campaign to make everything consistent
        await syncCampaignStats(defaultCampaign.id);
      }
    }

    res.json({
      success: true,
      message: 'Seed data reloaded successfully',
      data: {
        customers: seedCustomers.length,
        orders: seedOrders.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /seed/reset
 * Clears all data from all tables (dev only — protected by NODE_ENV check).
 */
router.delete('/reset', async (_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ success: false, error: 'Not allowed in production' });
    return;
  }

  try {
    await clearAllData();
    res.json({ success: true, message: 'All data cleared' });
  } catch (err) {
    next(err);
  }
});

export default router;

