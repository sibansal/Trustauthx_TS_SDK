import { _EdgeDBRoleQuery } from '../src/_EdgeDBRoleQuery';
import { makeRequest } from './../src/utils';

describe('makeRequest', () => {
  it('should make a GET request to a sample API and return response', async () => {
    const url = 'https://jsonplaceholder.typicode.com/posts/1';

    const response = await makeRequest(url, { method: 'GET' });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body');
  });
});