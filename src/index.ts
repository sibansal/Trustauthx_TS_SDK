import { decodeJwt, JWTPayload, SignJWT } from 'jose';
import { GetUser, TokenCheck } from './types';
import { _EdgeDBRoleQuery } from './_EdgeDBRoleQuery';
import { GetAllRolesResponse, Role } from './scheme';
import { makeRequest } from './utils';

export class AuthLiteClient {
  private secretKey: string;
  private apiKey: string;
  private signedKey: string;
  private data: JWTPayload;
  private orgId?: string;
  private API_BASE_URL: string;
  private InMemory: boolean;

  static instances: AuthLiteClient[] = [];

  // TODO: use for build/options pattern for instaniating instance async
  // TODO: add babel support for top-level-await to cjs
  // TODO: replace (un)condition checks for signed-key with async instance constructor
  constructor(apiKey: string, secretKey: string, orgId?: string,
    API_BASE_URL:string="https://api.trustauthx.com",
    in_memory:boolean=true) {
    this.secretKey = secretKey;
    this.apiKey = apiKey;
    this.orgId = orgId;
    this.signedKey = '';
    this.data = { api_key: this.apiKey };
    this.API_BASE_URL = API_BASE_URL;
    this.InMemory = in_memory;
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
      return `https://${
        subDomain ? `${subDomain}.` : ''
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
          `Request failed with status code: ${
            response.status
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
          `Request failed with status code: ${
            response.status
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
          `Request failed with status code: ${
            response.status
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
          `Request failed with status code: ${
            response.status
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

  async _set_edge_roles(): Promise<GetAllRolesResponse> {
    const url = `${this.API_BASE_URL}/rbac/role`;
    const headers = { "accept": "application/json" };
    const params = {
      "org_id": `${this.orgId}`,
      "api_key": `${this.apiKey}`,
      "signed_key": `${this.signedKey}`,
    };
    const response = await makeRequest(url, { headers, params });
    let roles:Role[] = await response.json();
    return {
      roles_list: roles,
      roles_json_list:roles.map((role) => ({ ...role })),
    };
  }

  async _reInitRoles(): Promise<void> {}
  /**
   *     
def _set_edge_roles(self) -> list:
        # self.Roles
        url = f"{self.API_BASE_URL}/rbac/role"
        headers = {"accept": "application/json"}
        params = {
            "org_id": f"{self.org_id}",
            "api_key": f"{self._api_key}",
            "signed_key": f"{self._signed_key}",
        }
        response = requests.get(url, headers=headers, params=params)
        roles = [Role(**role_data) for role_data in response.json()]
        roles = GetAllRolesResponse(
            roles_list=roles, roles_json_list=[asdict(role) for role in roles]
        )
        # print(roles.roles_json_list)
        return roles.roles_json_list
        
    def _re_init_roles(self) -> _Roles:
        self.Roles: _Roles = _Roles(
            roles=self._set_edge_roles(),
            org_id=self.org_id,
            api_key=self._api_key,
            signed_key=self._signed_key,
            secret_key=self._secret_key,
            API_BASE_URL=self.API_BASE_URL,
            InMemory=self.in_memory,
        )
        return self.Roles

    def attach_role(
        self,
        uid: str,
        rol_ids: Union[str, list],
        signoff_session_and_assign=False,
        refresh_token=None,
        access_token=None,
        return_class: bool = False,
    ) -> Union[dict, SignOffSessionReplace]:
        """
        Attaches a role to a user.

        Args:
            uid (str): The user ID to attach the role to.
            rol_ids (str | list): The ID(s) of the role(s) to attach.
            signoff_session_and_assign (bool, optional): Whether to sign off the session and assign. Default is False.
            refresh_token (str, optional): The refresh token for authentication.
            access_token (str, optional): The access token for authentication.
            return_class (bool, optional): Whether to return a class instance. Default is False.

        Returns:
            dict | SignOffSessionReplace: The response from the API, or a class instance if return_class is True.

        Raises:
            ParseError: If signoff_session_and_assign is True but refresh_token or access_token is not provided.
        """
        if signoff_session_and_assign:
            if not refresh_token or not access_token:
                raise ParseError(
                    "must parse refresh_token and access_token if signoff_session_and_assign is true"
                )
        url = f"{self.API_BASE_URL}/rbac/assign/permission"
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        params = {
            "org_id": self.org_id,
            "api_key": self._api_key,
            "signed_key": self._signed_key,
        }
        rols = []
        if isinstance(rol_ids) == str:
            rols.append(rol_ids)
        elif isinstance(rol_ids) == list:
            rols = [i for i in rol_ids]
        else:
            raise TypeError()
        data = {
            "uid": uid,
            "rol_id": rol_ids,
            "inplace": [],
            "signoff_session_and_assign": signoff_session_and_assign,
            "AccessToken": access_token,
            "RefreshToken": refresh_token,
        }
        response = requests.post(url, headers=headers, params=params, json=data)
        if signoff_session_and_assign:
            return response.json()
        else:
            if return_class:
                return SignOffSessionReplace(response.json())
            else:
                return SignOffSessionReplace(response.json()).to_dict()

    def remove_role(
        self,
        uid: str,
        rol_ids: Union[str, list],
        signoff_session_and_assign=False,
        refresh_token=None,
        access_token=None,
        return_class: bool = False,
    ) -> Union[dict, SignOffSessionReplace]:
        """
        Removes a role from a user.

        Args:
            uid (str): The user ID to remove the role from.
            rol_ids (str | list): The ID(s) of the role(s) to remove.
            signoff_session_and_assign (bool, optional): Whether to sign off the session and assign. Default is False.
            refresh_token (str, optional): The refresh token for authentication.
            access_token (str, optional): The access token for authentication.
            return_class (bool, optional): Whether to return a class instance. Default is False.

        Returns:
            dict | SignOffSessionReplace: The response from the API, or a class instance if return_class is True.

        Raises:
            ParseError: If signoff_session_and_assign is True but refresh_token or access_token is not provided.
        """
        if signoff_session_and_assign:
            if not refresh_token or not access_token:
                raise ParseError(
                    "must parse refresh_token and access_token if signoff_session_and_assign is true"
                )
        url = f"{self.API_BASE_URL}/rbac/assign/permission"
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        params = {
            "org_id": self.org_id,
            "api_key": self._api_key,
            "signed_key": self._signed_key,
        }
        rols = []
        if isinstance(rol_ids) == str:
            rols.append(rol_ids)
        elif isinstance(rol_ids) == list:
            rols = [i for i in rol_ids]
        else:
            raise TypeError()
        data = {
            "uid": uid,
            "rol_id": [],
            "inplace": rol_ids,
            "signoff_session_and_assign": signoff_session_and_assign,
            "AccessToken": access_token,
            "RefreshToken": refresh_token,
        }
        response = requests.post(url, headers=headers, params=params, json=data)
        if signoff_session_and_assign:
            return response.json()
        else:
            if return_class:
                return SignOffSessionReplace(response.json())
            else:
                return SignOffSessionReplace(response.json()).to_dict()

    def update_role(
        self,
        uid: str,
        rol_ids_to_add: Union[str, list],
        rol_ids_to_remove: Union[str, list],
        signoff_session_and_assign=False,
        refresh_token=None,
        access_token=None,
        return_class: bool = False,
    ) -> Union[dict, SignOffSessionReplace]:
        """
        Updates a user's roles by adding and/or removing roles.

        Args:
            uid (str): The user ID to update roles for.
            rol_ids_to_add (str | list): The ID(s) of the role(s) to add.
            rol_ids_to_remove (str | list): The ID(s) of the role(s) to remove.
            signoff_session_and_assign (bool, optional): Whether to sign off the session and assign. Default is False.
            refresh_token (str, optional): The refresh token for authentication.
            access_token (str, optional): The access token for authentication.
            return_class (bool, optional): Whether to return a class instance. Default is False.

        Returns:
            dict | SignOffSessionReplace: The response from the API, or a class instance if return_class is True.

        Raises:
            ParseError: If signoff_session_and_assign is True but refresh_token or access_token is not provided.
        """
        if signoff_session_and_assign:
            if not refresh_token or not access_token:
                raise ParseError(
                    "must parse refresh_token and access_token if signoff_session_and_assign is true"
                )
        url = f"{self.API_BASE_URL}/rbac/assign/permission"
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }
        params = {
            "org_id": self.org_id,
            "api_key": self._api_key,
            "signed_key": self._signed_key,
        }
        rols_add = []
        if isinstance(rol_ids_to_add) == str:
            rols_add.append(rol_ids_to_add)
        elif isinstance(rol_ids_to_add) == list:
            rols_add = [i for i in rol_ids_to_add]
        else:
            raise TypeError()
        rols_rem = []
        if isinstance(rol_ids_to_remove) == str:
            rols_rem.append(rol_ids_to_remove)
        elif isinstance(rol_ids_to_remove) == list:
            rols_rem = [i for i in rol_ids_to_remove]
        else:
            raise TypeError()
        data = {
            "uid": uid,
            "rol_id": rols_add,
            "inplace": rols_rem,
            "signoff_session_and_assign": signoff_session_and_assign,
            "AccessToken": access_token,
            "RefreshToken": refresh_token,
        }
        response = requests.post(url, headers=headers, params=params, json=data)
        if signoff_session_and_assign:
            return response.json()
        else:
            if return_class:
                return SignOffSessionReplace(response.json())
            else:
                return SignOffSessionReplace(response.json()).to_dict()
   * 
   */
}
