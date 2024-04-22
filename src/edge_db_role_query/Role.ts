import {RolePermissions} from './RolePermissions'

export interface Role {
    role_id: string;
    permissions: RolePermissions;
}