import client from './client';

export const getCustomers = (filters?: Record<string, unknown>) =>
  client.get('/api/customers', { params: filters });

export const getCustomer = (id: string) => client.get('/api/customers/' + id);

export const importCustomers = (data: unknown) =>
  client.post('/api/customers/import', data);

export const createCustomer = (data: unknown) =>
  client.post('/api/customers', data);

export const seedData = () => client.post('/api/seed');
