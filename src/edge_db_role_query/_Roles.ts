import { _EdgeDBRoleQuery } from "./EdgeDBRoleQuery";
import { Role } from "./Role";
export class _Roles extends _EdgeDBRoleQuery
{
    static instances: _Roles[] = [];

    org_id: string;
    _api_key: string;
    _secret_key: string;
    _signed_key: string;
    API_BASE_URL: string;

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
}