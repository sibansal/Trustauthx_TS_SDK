import { _EdgeDBRoleQuery } from "../src/_EdgeDBRoleQuery";
import { roles } from "../jest.common";

describe('_EdgeDBRoleQuery', () => {
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
});
