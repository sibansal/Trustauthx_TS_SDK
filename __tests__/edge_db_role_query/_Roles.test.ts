import { _Roles } from "../../src/edge_db_role_query/_Roles";
import { Role } from "../../src/edge_db_role_query/Role";

describe("_Roles", () => {
  const roles: Role[] = [
    { role_id: "admin", permissions: { read: true, write: true } },
    { role_id: "user", permissions: { read: true, write: false } },
  ];
  const org_id = "org123";
  const api_key = "api123";
  const signed_key = "signed123";
  const secret_key = "secret123";
  const API_BASE_URL = "https://example.com/api";

  let rolesInstance: _Roles;

  beforeEach(() => {
    rolesInstance = new _Roles(
      roles,
      org_id,
      api_key,
      signed_key,
      secret_key,
      API_BASE_URL
    );

    jest.spyOn(console, 'log');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test("should initialize roles in memory", () => {
      expect(_Roles.roles).toEqual(
        expect.objectContaining({
          admin: { read: true, write: true },
          user: { read: true, write: false },
        })
      );
    });

    test("should set org_id property", () => {
      expect(rolesInstance.org_id).toBe(org_id);
    });

    test("should set _api_key property", () => {
      expect(rolesInstance._api_key).toBe(api_key);
    });

    test("should set _secret_key property", () => {
      expect(rolesInstance._secret_key).toBe(secret_key);
    });

    test("should set _signed_key property", () => {
      expect(rolesInstance._signed_key).toBe(signed_key);
    });

    test("should set API_BASE_URL property", () => {
      expect(rolesInstance.API_BASE_URL).toBe(API_BASE_URL);
    });

    test("should add instance to instances array", () => {
      expect(_Roles.instances).toContain(rolesInstance);
    });

    test("should log roles", () => {
      expect(console.log).toHaveBeenCalledWith(_Roles.roles);
    });
  })
});