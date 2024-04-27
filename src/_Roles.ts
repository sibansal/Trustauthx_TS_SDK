import { _EdgeDBRoleQuery } from "./_EdgeDBRoleQuery";
import { AddPermissionResponse, AddRoleResponse, DeletePermissionResponse, DeleteRoleResponse, Permission, Role } from "./scheme";
import { GetAllRolesResponse } from "./scheme";
import { makeRequest } from "./utils";

/**
 * _Roles class extends _EdgeDBRoleQuery to manage roles and permissions.
 */
export class _Roles extends _EdgeDBRoleQuery {
  static instances: _Roles[] = [];

  org_id: string;
  _api_key: string;
  _secret_key: string;
  _signed_key: string;
  API_BASE_URL: string;

  /**
   * Constructs a new _Roles instance.
   * @param roles - Array of Role objects.
   * @param org_id - Organization ID.
   * @param api_key - API key.
   * @param signed_key - Signed key.
   * @param secret_key - Secret key.
   * @param API_BASE_URL - Base URL for the API.
   * @param InMemory - Boolean flag indicating whether to store roles in memory.
   */
  constructor(
    roles: Role[],
    org_id: string,
    api_key: string,
    signed_key: string,
    secret_key: string,
    API_BASE_URL: string,
    InMemory: boolean = true,
  ) {
    super(roles, InMemory)
    this.org_id = org_id
    this._api_key = api_key
    this._secret_key = secret_key
    this._signed_key = signed_key
    this.API_BASE_URL = API_BASE_URL
    _Roles.instances.push(this)
    console.log(_Roles.roles)
  }

  /**
   * Fetches all roles.
   * @returns Promise resolving to GetAllRolesResponse.
   */
  async get_all_roles(): Promise<GetAllRolesResponse> {
    const url = `${this.API_BASE_URL}/rbac/role`;
    const headers = { accept: 'application/json' };
    const params = {
      org_id: this.org_id,
      api_key: this._api_key,
      signed_key: this._signed_key,
    };
    const response = await makeRequest(url, { headers, params, method: "GET" });
    const roles: Role[] = await response.json();
    return {
      roles_list: roles,
      roles_json_list: roles.map((role) => ({ ...role })),
    };
  }

  /**
   * Adds a new role.
   * @param name - Name of the role.
   * @param permissions - Array of Permission objects.
   * @returns Promise resolving to AddRoleResponse.
   */
  public async add_role(name: string, permissions: Permission[]): Promise<AddRoleResponse> {
    const url = `${this.API_BASE_URL}/rbac/role`;
    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    const params = {
      org_id: this.org_id,
      api_key: this._api_key,
      signed_key: this._signed_key,
    };
    const data = { org_id: this.org_id, name, permissions };
    const response = await makeRequest(url, { headers, params, method: "POST", body: data });
    const { org_id, rol_id } = await response.json();
    return { org_id, rol_id, name, permissions };
  }

  /**
  * Deletes a role.
  * @param rol_id - Role ID.
  * @returns Promise resolving to DeleteRoleResponse.
  */
  public async delete_role(rol_id: string): Promise<DeleteRoleResponse> {
    const url = `${this.API_BASE_URL}/rbac/role`;
    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    const params = {
      org_id: this.org_id,
      api_key: this._api_key,
      signed_key: this._signed_key,
    };
    const data = { org_id: this.org_id, rol_id };
    const response = await makeRequest(url, { headers, params, method: "DELETE", body: data });
    return response.json();
  }

  /**
   * Adds permissions to a role.
   * @param rol_id - Role ID.
   * @param permissions - Array of Permission objects.
   * @returns Promise resolving to AddPermissionResponse.
   */
  public async add_permission(
    rol_id: string,
    permissions: Permission[]
  ): Promise<AddPermissionResponse> {
    const url = `${this.API_BASE_URL}/rbac/permission`;
    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    const params = {
      org_id: this.org_id,
      api_key: this._api_key,
      signed_key: this._signed_key,
    };
    const data = { org_id: this.org_id, rol_id, permissions };
    const response = await makeRequest(url, { headers, params, method: "POST", body: data });
    return response.json();
  }

  /**
   * Deletes permissions from a role.
   * @param rol_id - Role ID.
   * @param permissions - Array of Permission objects.
   * @returns Promise resolving to DeletePermissionResponse.
   */
  public async delete_permission(
    rol_id: string,
    permissions: Permission[]
  ): Promise<DeletePermissionResponse> {
    const url = `${this.API_BASE_URL}/rbac/permission`;
    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    const params = {
      org_id: this.org_id,
      api_key: this._api_key,
      signed_key: this._signed_key,
    };
    const data = { org_id: this.org_id, rol_id, permissions };
    const response = await makeRequest(url, { headers, params, method: "DELETE", body: data });
    return response.json();
  }
}