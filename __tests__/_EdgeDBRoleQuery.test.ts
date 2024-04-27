import { _EdgeDBRoleQuery } from "../src/_EdgeDBRoleQuery";
import { API_BASE_URL, roles, signed_key } from "../jest.common";
import { api_key, org_id, secret_key } from "./../jest.common";
import { AuthLiteClient } from "../src";
import { _Roles } from "../src/_Roles";

describe('_EdgeDBRoleQuery', () => {
    
    const mockedInstances = [new AuthLiteClient(api_key, secret_key, org_id), new AuthLiteClient(api_key, secret_key)];
    
    let roleQuery;

    beforeEach(() => {
        roleQuery = new _EdgeDBRoleQuery(roles);
    });

    afterEach(() => {
        if (roleQuery.conn) {
            roleQuery.conn.close();
        }
    });

    describe('constructor', () => {
        test('should initialize roles in memory', () => {
            expect(_EdgeDBRoleQuery.roles).toEqual(expect.objectContaining({
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
            }));
        });

        test('should initialize totalRoles count', () => {
            expect(_EdgeDBRoleQuery.totalRoles).toBe(2);
        });
    });

    describe('countRoles', () => {
        test('should return total roles count', async () => {
            const count = await roleQuery.countRoles();
            expect(count).toBe(2);
        });
    });

    describe('query', () => {
        test('should return permissions for a specific role', async () => {
            const permissions = await roleQuery.query('rol_rce_474ae9e59b3d49ce');
            expect(permissions).toEqual([
                { name: "user", value: "administration" },
                { name: "viewer", value: "administration" },
                { name: "maintainer", value: "administration" }
            ]);
        });

        test('should return null for non-existing role', async () => {
            const permissions = await roleQuery.query('nonexistent');
            expect(permissions).toBeNull();
        });
    });

    describe('validate', () => {
        test('should validate permission for a role', async () => {
            const isValid = await roleQuery.validate('rol_rce_474ae9e59b3d49ce', 'user', 'administration');
            expect(isValid).toBe(true);
        });

        test('should return false for invalid permission', async () => {
            const isValid = await roleQuery.validate('rol_YHV_78ae9006bcaa4c77', 'viewer', 'user');
            expect(isValid).toBe(false);
        });
    });

    describe('reinitializeAll', () => {
        test('should call _reInitRoles on all AuthLiteClient instances when foreground is true', () => {
            const foreground = true;

            const mockedRolesInstance = new _Roles(roles, org_id, api_key, signed_key, secret_key, API_BASE_URL);
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles').mockImplementation(() => Promise.resolve(mockedRolesInstance));

            _EdgeDBRoleQuery.reinitializeAll(foreground);

            expect(spy).toHaveBeenCalledTimes(mockedInstances.length);
            spy.mockRestore();
        });

        test('should call _reInitRoles on all AuthLiteClient instances asynchronously when foreground is false', async () => {
            jest.useFakeTimers();
            const foreground = false;

            const mockedRolesInstance = new _Roles(roles, org_id, api_key, signed_key, secret_key, API_BASE_URL);
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles').mockImplementation(() => Promise.resolve(mockedRolesInstance));

            _EdgeDBRoleQuery.reinitializeAll(foreground);

            expect(spy).toHaveBeenCalledTimes(0);

            jest.runAllTimers();

            expect(spy).toHaveBeenCalledTimes(mockedInstances.length);
            spy.mockRestore();

            jest.useRealTimers();
        });
    });

    describe('EDGEWrapper', () => {
        test('should call reinitializeAll when X-EDGE header does not match totalRoles', async () => {
            const funcMock = jest.fn();
            const responseMock = { headers: { get: jest.fn() } };
            const reinitializeAllMock = jest.spyOn(_EdgeDBRoleQuery, 'reinitializeAll');
            
            const mockedRolesInstance = new _Roles(roles, org_id, api_key, signed_key, secret_key, API_BASE_URL);
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles').mockImplementation(() => Promise.resolve(mockedRolesInstance));
    
            _EdgeDBRoleQuery.totalRoles = 5;
            funcMock.mockResolvedValue(responseMock);
            responseMock.headers.get.mockReturnValue('10');
    
            const wrappedFunc = _EdgeDBRoleQuery.EDGEWrapper(funcMock);
            await wrappedFunc();
    
            expect(reinitializeAllMock).toHaveBeenCalled();
    
            reinitializeAllMock.mockRestore();
        });
    
        test('should not call reinitializeAll when X-EDGE header matches totalRoles', async () => {
            const funcMock = jest.fn();
            const responseMock = { headers: { get: jest.fn() } };
            const reinitializeAllMock = jest.spyOn(_EdgeDBRoleQuery, 'reinitializeAll');

            
            const mockedRolesInstance = new _Roles(roles, org_id, api_key, signed_key, secret_key, API_BASE_URL);
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles').mockImplementation(() => Promise.resolve(mockedRolesInstance));
    
            _EdgeDBRoleQuery.totalRoles = 5;
            funcMock.mockResolvedValue(responseMock);
            responseMock.headers.get.mockReturnValue('5');
    
            const wrappedFunc = _EdgeDBRoleQuery.EDGEWrapper(funcMock);
            await wrappedFunc();
    
            expect(reinitializeAllMock).not.toHaveBeenCalled();
    
            reinitializeAllMock.mockRestore();
        });
    });
});
