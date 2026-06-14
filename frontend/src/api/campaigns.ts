import client from './client';

export const getCampaigns = () => client.get('/api/campaigns');

export const getCampaign = (id: string) => client.get('/api/campaigns/' + id);

export const getCampaignStats = (id: string) =>
  client.get('/api/campaigns/' + id + '/stats');

export const createCampaign = (data: unknown) => client.post('/api/campaigns', data);

export const launchCampaign = (id: string) =>
  client.post('/api/campaigns/' + id + '/launch');
