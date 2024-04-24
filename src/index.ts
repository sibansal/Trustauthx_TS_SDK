import { decodeJwt, JWTPayload, SignJWT } from 'jose';
import { GetUser, TokenCheck } from './types';
import { _EdgeDBRoleQuery } from './_EdgeDBRoleQuery';
import { Role, SignOffSessionReplace } from './scheme';
import { makeRequest } from './utils';
import { _Roles } from './_Roles';

export class AuthLiteClient {
  private secretKey: string;
  private apiKey: string;
  private signedKey: string;
  private data: JWTPayload;
  private orgId?: string;
  private API_BASE_URL: string;
  private InMemory: boolean;
  private Roles: _Roles;

  static instances: AuthLiteClient[] = [];

  // TODO: use for build/options pattern for instaniating instance async
  // TODO: add babel support for top-level-await to cjs
  // TODO: replace (un)condition checks for signed-key with async instance constructor
  constructor(apiKey: string, secretKey: string, orgId?: string,
    API_BASE_URL: string = "https://api.trustauthx.com",
    in_memory: boolean = true) {
    this.secretKey = secretKey;
    this.apiKey = apiKey;
    this.orgId = orgId;
    this.signedKey = '';
    this.data = { api_key: this.apiKey };
    this.API_BASE_URL = API_BASE_URL;
    this.InMemory = in_memory;
    this.Roles = new _Roles(
      [],
      this.orgId,
      this.apiKey,
      this.signedKey,
      this.secretKey,
      this.API_BASE_URL,
      this.InMemory,
    );
    AuthLiteClient.instances.push(this)
  }

  private async getEncodedJWT(): Promise<string> {
    const secret = new TextEncoder().encode(this.secretKey);
    return await new SignJWT(this.data)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secret);
  }

  private getDecodedJWT(token: string): Record<string, any> {
    return decodeJwt(token);
  }

  generateUrl(subDomain?: string): string {
    if (this.orgId)
      return `https://${subDomain ? `${subDomain}.` : ''
        }app.trustauthx.com/widget/login/?org_id=${this.orgId}`;
    else throw new Error('Must provide org_id');
  }

  async generateEditUserUrl(accessToken: string, url: string): Promise<string> {
    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }
    const params = new URLSearchParams({
      AccessToken: accessToken,
      api_key: this.apiKey,
      signed_key: this.signedKey,
      url: url,
    });

    return `https://api.trustauthx.com/api/user/me/settings/?${params.toString()}`;
  }

  async reAuth(code: string): Promise<{ email: string; uid: string }> {
    const url = 'https://api.trustauthx.com/api/user/me/widget/re-auth/token';
    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }
    const params = new URLSearchParams({
      code: code,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await makeRequest(url + '?' + params.toString(), {
        headers,
      });

      if (response.status === 200) {
        const data = await response.json();

        const decoded = this.getDecodedJWT(JSON.stringify(data));

        return { email: decoded.email, uid: decoded.uid };
      } else {
        throw new Error(
          `Request failed with status code: ${response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getUser(token: string): Promise<GetUser> {
    const url = 'https://api.trustauthx.com/api/user/me/auth/data';

    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }

    const params = new URLSearchParams({
      UserToken: token,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        const data = await response.json();

        const decoded = this.getDecodedJWT(data);
        const decodedSub = JSON.parse(decoded['sub']);
        delete decoded['sub'];

        return { ...decoded, ...decodedSub };
      } else {
        throw new Error(
          `Request failed with status code: ${response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getAccessTokenFromRefreshToken(refreshToken: string): Promise<any> {
    const url = 'https://api.trustauthx.com/api/user/me/access/token/';
    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }
    const params = new URLSearchParams({
      RefreshToken: refreshToken,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        throw new Error(
          `Request failed with status code: ${response.status
          }\n${await response.text()}`
        );
      }
    } catch (error: any) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async validateAccessToken(access_token: string): Promise<boolean> {
    const url = 'https://api.trustauthx.com/api/user/me/auth/validate/token';
    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }
    const params = new URLSearchParams({
      AccessToken: access_token,
      api_key: this.apiKey,
      signed_key: this.signedKey,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      return response.status === 200;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async revokeToken(
    accessToken: string,
    refreshToken: string | null = null,
    revokeAllTokens: boolean = false
  ): Promise<boolean> {
    const url = 'https://api.trustauthx.com/api/user/me/token/';
    const headers = { accept: 'application/json' };

    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }

    if (!accessToken)
      throw new Error('Must provide either AccessToken or RefreshToken');

    const isAccessToken = !!accessToken;
    const t = accessToken ?? refreshToken;
    const params = new URLSearchParams({
      Token: t!,
      api_key: this.apiKey,
      signed_key: this.signedKey,
      AccessToken: isAccessToken.toString(),
      SpecificTokenOnly: (!revokeAllTokens).toString(),
    });

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'DELETE',
        headers: headers,
      });

      return response.status === 200;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async getUserFromToken(accessToken: string): Promise<{
    uid: string;
    email: string;
    img: string;
  }> {
    const url = 'https://api.trustauthx.com/api/user/me/data';
    if (!this.signedKey) {
      this.signedKey = await this.getEncodedJWT();
    }
    const params = new URLSearchParams({
      api_key: this.apiKey,
      signed_key: this.signedKey,
      AccessToken: accessToken,
    });
    const headers = { accept: 'application/json' };

    try {
      const response = await fetch(url + '?' + params.toString(), {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 200) {
        const data = await response.text();
        const processedData = data.slice(1, -1);

        const decoded = this.getDecodedJWT(processedData);

        return {
          uid: decoded?.uid,
          email: decoded?.email,
          img: decoded?.img,
        };
      } else {
        throw new Error(
          `Request failed with status code: ${response.status
          }\n${await response.text()}`
        );
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async validateTokenSet(
    access_token: string,
    refresh_token: string
  ): Promise<TokenCheck> {
    try {
      const d: TokenCheck = {
        access: '',
        refresh: '',
        state: false,
      };
      const is_valid = await this.validateAccessToken(access_token);
      if (!is_valid) {
        if (refresh_token) {
          const new_tokens = await this.getAccessTokenFromRefreshToken(
            refresh_token
          );
          d.state = false;
          d.access = new_tokens['access_token'];
          d.refresh = new_tokens['refresh_token'];
        }
        return d;
      } else {
        d.state = true;
        d.access = access_token;
        d.refresh = refresh_token;
        return d;
      }
    } catch (error) {
      throw new Error('Both tokens are invalid, please log in again');
    }
  }

  //Rbac
  async setEdgeRoles(): Promise<Role[]> {
    const url = `${this.API_BASE_URL}/rbac/role`;
    const headers = { "accept": "application/json" };
    const params = {
      "org_id": `${this.orgId}`,
      "api_key": `${this.apiKey}`,
      "signed_key": `${this.signedKey}`,
    };
    const response = await makeRequest(url, { headers, params });
    let roles: Role[] = await response.json();
    return roles
  }


  async _reInitRoles(): Promise<_Roles> {
    let roles = await this.setEdgeRoles()
    this.Roles = new _Roles(
      roles,
      this.orgId,
      this.apiKey,
      this.signedKey,
      this.secretKey,
      this.API_BASE_URL,
      this.InMemory,
    );
    return this.Roles;
  }

  async attach_role(
    uid: string,
    rol_ids: string | string[],
    signoff_session_and_assign: boolean = false,
    refresh_token: string | null = null,
    access_token: string | null = null,
    return_class: boolean = false,
  ): Promise<SignOffSessionReplace> {
    if (signoff_session_and_assign && (!refresh_token || !access_token)) {
      throw new Error("must parse refresh_token and access_token if signoff_session_and_assign is true");
    }

    const url = `${this.API_BASE_URL}/rbac/assign/permission`;
    const headers = {
      "accept": "application/json",
      "Content-Type": "application/json",
    };
    const params = {
      "org_id": this.orgId,
      "api_key": this.apiKey,
      "signed_key": this.signedKey,
    };
    const rols = Array.isArray(rol_ids) ? rol_ids : [rol_ids];
    const data = {
      "uid": uid,
      "rol_id": rols,
      "inplace": [],
      "signoff_session_and_assign": signoff_session_and_assign,
      "AccessToken": access_token,
      "RefreshToken": refresh_token,
    };
    const response = await makeRequest(url, { headers: headers, params: params, body: data, method: "POST" });
    return response.json()
  }

  async remove_role(
    uid: string,
    rol_ids: string | string[],
    signoff_session_and_assign: boolean = false,
    refresh_token: string | null = null,
    access_token: string | null = null,
    return_class: boolean = false,
  ): Promise<SignOffSessionReplace> {
    if (signoff_session_and_assign && (!refresh_token || !access_token)) {
      throw new Error("must parse refresh_token and access_token if signoff_session_and_assign is true");
    }

    const url = `${this.API_BASE_URL}/rbac/assign/permission`;
    const headers = {
      "accept": "application/json",
      "Content-Type": "application/json",
    };
    const params = {
      "org_id": this.orgId,
      "api_key": this.apiKey,
      "signed_key": this.signedKey,
    };
    const rols = Array.isArray(rol_ids) ? rol_ids : [rol_ids];
    const data = {
      "uid": uid,
      "rol_id": [],
      "inplace": rols,
      "signoff_session_and_assign": signoff_session_and_assign,
      "AccessToken": access_token,
      "RefreshToken": refresh_token,
    };

    const response = await makeRequest(url, { headers: headers, params: params, body: data, method: "POST" });
    return response.json()
  }

  async update_role(
    uid: string,
    rol_ids_to_add: string | string[],
    rol_ids_to_remove: string | string[],
    signoff_session_and_assign: boolean = false,
    refresh_token: string | null = null,
    access_token: string | null = null,
    return_class: boolean = false,
  ): Promise<SignOffSessionReplace> {
    if (signoff_session_and_assign && (!refresh_token || !access_token)) {
      throw new Error("must parse refresh_token and access_token if signoff_session_and_assign is true");
    }

    const url = `${this.API_BASE_URL}/rbac/assign/permission`;
    const headers = {
      "accept": "application/json",
      "Content-Type": "application/json",
    };
    const params = {
      "org_id": this.orgId,
      "api_key": this.apiKey,
      "signed_key": this.signedKey,
    };
    const rols_add = Array.isArray(rol_ids_to_add) ? rol_ids_to_add : [rol_ids_to_add];
    const rols_rem = Array.isArray(rol_ids_to_remove) ? rol_ids_to_remove : [rol_ids_to_remove];
    const data = {
      "uid": uid,
      "rol_id": rols_add,
      "inplace": rols_rem,
      "signoff_session_and_assign": signoff_session_and_assign,
      "AccessToken": access_token,
      "RefreshToken": refresh_token,
    };

    const response = await makeRequest(url, { headers: headers, params: params, body: data, method: "POST" });
    return response.json()
  }
}
