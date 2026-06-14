import client from './client';

export const getSegments = () => client.get('/api/segments');

export const getSegment = (id: string) => client.get('/api/segments/' + id);

export const getSegmentMembers = (id: string) => client.get('/api/segments/' + id + '/members');

export const createSegment = (data: unknown) => client.post('/api/segments', data);

export const deleteSegment = (id: string) => client.delete('/api/segments/' + id);

export const refreshSegment = (id: string) =>
  client.post('/api/segments/' + id + '/refresh');

export const suggestSegment = (description: string) =>
  client.post('/api/ai/suggest-segment', { description });

export const draftMessage = (data: unknown) =>
  client.post('/api/ai/draft-message', data);
