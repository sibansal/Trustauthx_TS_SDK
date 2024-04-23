import * as sqlite3 from 'sqlite3';
import { Permission as RolePermissions } from './scheme';
import { Role } from './scheme';
import { AuthLiteClient } from '.';

export class _EdgeDBRoleQuery {
    /**
     * A class for querying and managing roles and permissions.
     * 
     * @property {boolean} inMemory - Flag indicating whether to store the roles in-memory or in a SQLite database.
     * @property {sqlite3.Database | null} conn - The SQLite database connection (database mode).
     * 
     * @method
     * constructor(roles: Role[], inMemory: boolean = true): void
     * Initializes the _EdgeDBRoleQuery instance with the provided roles and storage mode.
     * 
     * @method
     * async countRoles(): Promise<number>
     * Returns the number of roles stored.
     * 
     * @method
     * async query(roleId?: string, permissionKey?: string): Promise<{ [roleId: string]: RolePermissions } | RolePermissions | string | null>
     * Queries the roles and permissions based on the provided role ID and/or permission key.
     * 
     * @method
     * async validate(roleId: string, permissionKey: string, permissionVal: string): Promise<boolean>
     * Validates a permission value for a given role ID and permission key.
     * 
     * @static
     * @property {number} totalRoles - The total number of roles.
     * @property {{ [roleId: string]: RolePermissions } | null} roles - A dictionary mapping role IDs to permissions.
    */
    static totalRoles: number = 0;
    static roles: { [roleId: string]: RolePermissions } | null = null;

    inMemory: boolean;
    conn: sqlite3.Database | null = null;

    constructor(roles: Role[], inMemory: boolean = true) {
        /**
         * Initializes the _EdgeDBRoleQuery instance.
         * 
         * @param {Role[]} roles - A list of dictionaries representing roles and their permissions.
         * @param {boolean} [inMemory=true] - Flag indicating whether to store the roles in-memory or in a SQLite database. Defaults to true.
         */
        this.inMemory = inMemory;

        if (this.inMemory) {
            _EdgeDBRoleQuery.roles = {};
            roles.forEach(role => {
                _EdgeDBRoleQuery.roles![role.rol_id] = role.permissions;
            });
        } else {
            this.conn = new sqlite3.Database(':memory:');
            this.conn!.serialize(() => {
                this.conn!.run('BEGIN TRANSACTION');
                this.conn!.run(`CREATE TABLE IF NOT EXISTS roles (
                    role_id TEXT PRIMARY KEY,
                    permissions TEXT
                )`)
                const stmt = this.conn!.prepare('INSERT INTO roles VALUES (?, ?)');
                roles.forEach(role => {
                    stmt.run(role.rol_id, JSON.stringify(role.permissions));
                });
                stmt.finalize();
                this.conn!.run('COMMIT');
            });
        }
        this.countRoles();
    }

    async query(roleId?: string, permissionKey?: string): Promise<{ [roleId: string]: RolePermissions }
        | RolePermissions | string | null> {
        /**
         * Queries the roles and permissions based on the provided role ID and/or permission key.
         * 
         * @param {string} [roleId] - The role ID to query.
         * @param {string} [permissionKey] - The permission key to query.
         * @returns {Promise<{ [roleId: string]: RolePermissions } | RolePermissions | string | null>} - The queried roles, permissions, or permission value, depending on the provided arguments.
        */
        return new Promise<any>((resolve, reject) => {
            if (this.inMemory) {
                if (roleId && permissionKey) {
                    const role = _EdgeDBRoleQuery.roles?.[roleId];
                    resolve(role ? role[permissionKey] : null);
                } else if (roleId) {
                    resolve(_EdgeDBRoleQuery.roles?.[roleId] || null);
                } else if (permissionKey) {
                    const result: { [roleId: string]: string } = {};
                    for (const [roleId, permissions] of Object.entries(_EdgeDBRoleQuery.roles || {})) {
                        if (permissionKey in permissions) {
                            result[roleId] = permissions[permissionKey];
                        }
                    }
                    resolve(result);
                } else {
                    resolve(_EdgeDBRoleQuery.roles || null);
                }
            } else {
                if (roleId && permissionKey) {
                    this.conn!.get('SELECT permissions FROM roles WHERE role_id = ?', [roleId], (err, row: { permissions: string }) => {
                        if (err) {
                            reject(err);
                        } else {
                            const permissions: RolePermissions | null = row ? JSON.parse(row.permissions) : null;
                            resolve(permissions ? permissions[permissionKey] : null);
                        }
                    });
                } else if (roleId) {
                    this.conn!.get('SELECT permissions FROM roles WHERE role_id = ?', [roleId], (err, row: { permissions: string }) => {
                        if (err) {
                            reject(err);
                        } else {
                            const permissions: RolePermissions | null = row ? JSON.parse(row.permissions) : null;
                            resolve(permissions || null);
                        }
                    });
                } else if (permissionKey) {
                    this.conn!.all('SELECT * FROM roles', (err, rows: { role_id: string; permissions: string }[]) => {
                        if (err) {
                            reject(err);
                        } else {
                            const result: { [roleId: string]: string } = {};
                            rows.forEach(row => {
                                const permissions: RolePermissions = JSON.parse(row.permissions);
                                if (permissionKey in permissions) {
                                    result[row.role_id] = permissions[permissionKey];
                                }
                            });
                            resolve(result);
                        }
                    });
                } else {
                    this.conn!.all('SELECT * FROM roles', (err, rows: { role_id: string; permissions: string }[]) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows || null);
                        }
                    });
                }
            }
        });
    }

    async validate(roleId: string, permissionKey: string, permissionVal: string): Promise<boolean> {
        /**
         * Validates a permission value for a given role ID and permission key.
         * 
         * @param {string} roleId - The role ID to validate.
         * @param {string} permissionKey - The permission key to validate.
         * @param {string} permissionVal - The expected permission value to validate.
         * @returns {Promise<boolean>} - True if the permission value matches the expected value, False otherwise.
         */
        return new Promise<boolean>((resolve, reject) => {
            let permissions: RolePermissions | null;
            if (this.inMemory) {
                permissions = _EdgeDBRoleQuery.roles?.[roleId];
            } else {
                this.conn!.get('SELECT permissions FROM roles WHERE role_id = ?', [roleId], (err, row: { permissions: string }) => {
                    if (err) {
                        reject(err);
                    } else {
                        permissions = row ? JSON.parse(row.permissions) : null;
                    }
                });
            }
            const getPermission = permissions.find(permission => permission.name === permissionKey)
            resolve(permissions ? getPermission.value === permissionVal : false);
        });
    }

    async countRoles(): Promise<number> {
        /**
         * Returns the number of roles stored.
         * 
         * @returns {Promise<number>} - The number of roles stored.
         */
        return new Promise<number>((resolve, reject) => {
            if (this.inMemory) {
                const r = Object.keys(_EdgeDBRoleQuery.roles || {}).length;
                _EdgeDBRoleQuery.totalRoles = r;
                resolve(r);
            } else {
                if (!this.conn) {
                    reject(new Error('Database connection is not initialized'));
                    return;
                }
                this.conn.get('SELECT COUNT(*) AS count FROM roles', (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        const r = (row as { count: number })?.count || 0;
                        _EdgeDBRoleQuery.totalRoles = r;
                        resolve(r);
                    }
                });
            }
        });
    }

    public static reinitializeAll(foreground: boolean = true): void {
        if (foreground) {
            for (let instance of AuthLiteClient.instances) {
                instance._reInitRoles();
            }
        } else {
            setTimeout(() => {
                for (let instance of AuthLiteClient.instances) {
                    instance._reInitRoles();
                }
            }, 0);
        }
    }

    public static EDGEWrapper(func: Function) {
        return async function wrapper(...args: any[]):Promise<Response> {
          // Call the function
          const response = await func(...args);
          
          // Check for "X-EDGE"
          const xEdge = response.headers.get("X-EDGE");
          if (xEdge) {
            if (parseInt(xEdge) !== _EdgeDBRoleQuery.totalRoles) {
              _EdgeDBRoleQuery.reinitializeAll();
            }
          }
      
          // Add data
          return response;
        };
      }
}