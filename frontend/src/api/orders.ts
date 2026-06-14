import client from './client';

export const createOrder = (data: {
  customer_id: string;
  amount: number;
  items: string[];
  order_date?: string;
}) => client.post('/api/orders', data);
