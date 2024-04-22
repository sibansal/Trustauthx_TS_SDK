import * as sqlite3 from 'sqlite3';
import {RolePermissions} from './RolePermissions';
import {Role} from './Role';
import { AuthLiteClient } from '..';

export class EdgeDBRoleQuery
{
    static totalRoles: number = 0;
    static roles: { [roleId: string]: RolePermissions } | null = null;
    static instances: AuthLiteClient[] = [];

    inMemory: boolean;
    conn: sqlite3.Database | null = null;

    constructor(roles: Role[], inMemory: boolean = true) {
        this.inMemory = inMemory;

        if (this.inMemory) {
            EdgeDBRoleQuery.roles = {};
            roles.forEach(role => {
                EdgeDBRoleQuery.roles![role.role_id] = role.permissions;
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
                    stmt.run(role.role_id, JSON.stringify(role.permissions));
                });
                stmt.finalize();
                this.conn!.run('COMMIT');
            });
        }
        this.countRoles();
    }

    async countRoles(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (this.inMemory) {
                const r = Object.keys(EdgeDBRoleQuery.roles || {}).length;
                EdgeDBRoleQuery.totalRoles = r;
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
                        EdgeDBRoleQuery.totalRoles = r;
                        resolve(r);
                    }
                });
            }
        });
    }

    async query(roleId?: string, permissionKey?: string): Promise<{ [roleId: string]: RolePermissions } | RolePermissions | string | null> {
        return new Promise<any>((resolve, reject) => {
            if (this.inMemory) {
                if (roleId && permissionKey) {
                    const role = EdgeDBRoleQuery.roles?.[roleId];
                    resolve(role ? role[permissionKey] : null);
                } else if (roleId) {
                    resolve(EdgeDBRoleQuery.roles?.[roleId] || null);
                } else if (permissionKey) {
                    const result: { [roleId: string]: string } = {};
                    for (const [roleId, permissions] of Object.entries(EdgeDBRoleQuery.roles || {})) {
                        if (permissionKey in permissions) {
                            result[roleId] = permissions[permissionKey];
                        }
                    }
                    resolve(result);
                } else {
                    resolve(EdgeDBRoleQuery.roles || null);
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
        return new Promise<boolean>((resolve, reject) => {
            if (this.inMemory) {
                const permissions = EdgeDBRoleQuery.roles?.[roleId];
                resolve(permissions ? permissions[permissionKey] === permissionVal : false);
            } else {
                this.conn!.get('SELECT permissions FROM roles WHERE role_id = ?', [roleId], (err, row: { permissions: string }) => {
                    if (err) {
                        reject(err);
                    } else {
                        const permissions: RolePermissions | null = row ? JSON.parse(row.permissions) : null;
                        resolve(permissions ? permissions[permissionKey] === permissionVal : false);
                    }
                });
            }
        });
    }

    //edge wrapper and reinit roles
}