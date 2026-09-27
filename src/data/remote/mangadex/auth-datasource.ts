import { MANGADEX_AUTH_URL } from '@/core/config';

import { TokenDto } from './dto';
import { HttpClient } from './http-client';

export interface PasswordGrantInput {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export class MangaDexAuthDatasource {
  constructor(private readonly http: HttpClient) {}

  login(input: PasswordGrantInput): Promise<TokenDto> {
    return this.http.postForm<TokenDto>(MANGADEX_AUTH_URL, {
      grant_type: 'password',
      username: input.username,
      password: input.password,
      client_id: input.clientId,
      client_secret: input.clientSecret,
    });
  }

  refresh(clientId: string, clientSecret: string, refreshToken: string): Promise<TokenDto> {
    return this.http.postForm<TokenDto>(MANGADEX_AUTH_URL, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
  }
}
