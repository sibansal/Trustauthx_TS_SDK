export type Permission = {
    [key: string]: any;
}

export type Role = {
    org_id: string;
    rol_id: string;
    name: string;
    permissions: Permission[];
}

export type GetAllRolesResponse = {
    roles_list: Role[];
    roles_json_list: { [key: string]: string | { [key: string]: string }[] }[];
}

export type AddRoleResponse = {
    org_id: string;
    rol_id: string;
    name: string;
    permissions: Permission[];
}

export type DeleteRoleResponse = {
    org_id: string;
    rol_id: string;
    name: string;
    permissions: Permission[];
}

export type AddPermissionResponse = {
    org_id: string;
    rol_id: string;
    permissions: { [key: string]: string }[];
}

export type DeletePermissionResponse = {
    org_id: string;
    rol_id: string;
    permissions: Permission[];
}

export type User = {
    iss: string;
    jti: string;
    access_token: string;
    type: string;
    exp: number;
    refresh_token: string;
    refresh_exp: number;
    scope: string[];
    img: string;
    name: string;
    iat: number;
    email: string;
    uid: string;
}

export type SignOffSessionReplace = {
    uid: string;
    access_token: string;
    refresh_token: string;
    role: string[];
}