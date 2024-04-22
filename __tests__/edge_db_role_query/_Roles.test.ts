import { _Roles } from "../../src/edge_db_role_query/_Roles";
import { roles } from "./common.test";

describe("_Roles", () => {
  const org_id = "4195502c85984d27ae1aceb677d99551543808625aeb11ee88069dc8f7663e88";
  const api_key = "3GkqP2s9V5N7x4Z6";
  const signed_key = "Ab12Cd34Ef";
  const secret_key = "Gh56Ij78Kl";
  const API_BASE_URL = "https://api.trustauthx.com/api/user/me/settings";

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
          rol_rce_474ae9e59b3d49ce: [
            { name: "user", value: "administration" },
            { name: "viewer", value: "administration" },
            { name: "maintainer", value: "administration" }
          ],

          rol_YHV_78ae9006bcaa4c77: [
            { name: "user", value: "administration" },
            { name: "viewer", value: "administration" },
            { name: "maintainer", value: "administration" }
          ]
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