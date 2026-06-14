import client from './client';

export const getOverview = () => client.get('/api/analytics/overview');

export const getCampaignAnalytics = () => client.get('/api/analytics/campaigns');
