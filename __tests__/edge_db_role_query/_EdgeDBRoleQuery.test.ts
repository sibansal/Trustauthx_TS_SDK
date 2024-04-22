import { _EdgeDBRoleQuery } from "../../src/edge_db_role_query/EdgeDBRoleQuery";
const roles = [
    { role_id: 'admin', permissions: { read: true, write: true } },
    { role_id: 'user', permissions: { read: true, write: false } }
];

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
                admin: { read: true, write: true },
                user: { read: true, write: false }
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
            const permissions = await roleQuery.query('admin');
            expect(permissions).toEqual({ read: true, write: true });
        });

        test('should return null for non-existing role', async () => {
            const permissions = await roleQuery.query('nonexistent');
            expect(permissions).toBeNull();
        });
    });

    describe('validate', () => {
        test('should validate permission for a role', async () => {
            const isValid = await roleQuery.validate('admin', 'read', true);
            expect(isValid).toBe(true);
        });

        test('should return false for invalid permission', async () => {
            const isValid = await roleQuery.validate('user', 'write', true);
            expect(isValid).toBe(false);
        });
    });
});
