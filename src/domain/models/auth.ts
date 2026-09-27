export interface LocalSession {
  username: string;
  createdAt: string;
}

export interface MangaDexConnection {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  connectedAt: string;
}

export interface MangaDexCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export interface MangaDexTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
