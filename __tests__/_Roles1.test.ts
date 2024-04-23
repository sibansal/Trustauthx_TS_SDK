import { _Roles } from './../src/_Roles';
import { makeRequest } from './../src/utils';
import { Role, Permission } from './../src/scheme';

jest.mock('./utils');

describe('_Roles class', () => {
  let roles: _Roles;
  const mockRoles: Role[] = []; // replace with actual roles
  const mockPermissions: Permission[] = []; // replace with actual permissions

  beforeEach(() => {
    roles = new _Roles(
      mockRoles,
      'org_id',
      'api',
      'signed_key',
      'secret_key',
      'API_BASE_URL',
      true
    );
    (makeRequest as jest.Mock).mockClear();
  });

  test('should be defined', () => {
    expect(roles).toBeDefined();
  });

  test('get_all_roles should make a GET request', async () => {
    (makeRequest as jest.Mock).mockResolvedValueOnce({
      json: async () => mockRoles,
    });
    const response = await roles.get_all_roles();
    expect(makeRequest).toHaveBeenCalledWith('API_BASE_URL/rbac/role', {
      headers: { accept: 'application/json' },
      params: {
        org_id: 'org_id',
        api_key: 'api_key',
        signed_key: 'signed_key',
      },
      method: 'GET',
    });
    expect(response.roles_list).toEqual(mockRoles);
  });

  test('add_role should make a POST request', async () => {
    const mockResponse = {
      org_id: 'org_id',
      rol_id: 'rol_id',
      name: 'name',
      permissions: mockPermissions,
    };
    (makeRequest as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });
    const response = await roles.add_role('name', mockPermissions);
    expect(makeRequest).toHaveBeenCalledWith('API_BASE_URL/rbac/role', {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      params: {
        org_id: 'org_id',
        api_key: 'api_key',
        signed_key: 'signed_key',
      },
      method: 'POST',
      body: { org_id: 'org_id', name: 'name', permissions: mockPermissions },
    });
    expect(response).toEqual(mockResponse);
  });

  test('delete_role should make a DELETE request', async () => {
    const mockResponse = { message: 'Role deleted successfully' };
    (makeRequest as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });
    const response = await roles.delete_role('rol_id');
    expect(makeRequest).toHaveBeenCalledWith('API_BASE_URL/rbac/role', {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      params: {
        org_id: 'org_id',
        api_key: 'api_key',
        signed_key: 'signed_key',
      },
      method: 'DELETE',
      body: { org_id: 'org_id', rol_id: 'rol_id' },
    });
    expect(response).toEqual(mockResponse);
  });

  test('add_permission should make a POST request', async () => {
    const mockResponse = { message: 'Permission added successfully' };
    (makeRequest as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });
    const response = await roles.add_permission('rol_id', mockPermissions);
    expect(makeRequest).toHaveBeenCalledWith('API_BASE_URL/rbac/permission', {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      params: {
        org_id: 'org_id',
        api_key: 'api_key',
        signed_key: 'signed_key',
      },
      method: 'POST',
      body: { org_id: 'org_id', rol_id: 'rol_id', permissions: mockPermissions },
    });
    expect(response).toEqual(mockResponse);
  });

  test('delete_permission should make a DELETE request', async () => {
    const mockResponse = { message: 'Permission deleted successfully' };
    (makeRequest as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });
    const response = await roles.delete_permission('rol_id', mockPermissions);
    expect(makeRequest).toHaveBeenCalledWith('API_BASE_URL/rbac/permission', {
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      params: {
        org_id: 'org_id',
        api_key: 'api_key',
        signed_key: 'signed_key',
      },
      method: 'DELETE',
      body: { org_id: 'org_id', rol_id: 'rol_id', permissions: mockPermissions },
    });
    expect(response).toEqual(mockResponse);
  });
});