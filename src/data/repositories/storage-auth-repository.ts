import { STORAGE_KEYS } from '@/core/config';
import {
  LocalSession,
  MangaDexConnection,
  MangaDexCredentials,
} from '@/domain/models/auth';
import { AuthRepository } from '@/domain/repositories/auth-repository';

import { MangaDexAuthDatasource } from '../remote/mangadex/auth-datasource';
import {
  appStore,
  KeyValueStore,
  readJson,
  secureStore,
  writeJson,
} from '../storage/key-value-store';

const EXPIRY_MARGIN_MS = 30_000;

export class StorageAuthRepository implements AuthRepository {
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(
    private readonly datasource: MangaDexAuthDatasource,
    private readonly secure: KeyValueStore = secureStore,
    private readonly store: KeyValueStore = appStore,
  ) {}

  getSession(): Promise<LocalSession | null> {
    return readJson<LocalSession>(this.secure, STORAGE_KEYS.session);
  }

  async saveSession(session: LocalSession): Promise<void> {
    await writeJson(this.secure, STORAGE_KEYS.session, session);
  }

  clearSession(): Promise<void> {
    return this.secure.removeItem(STORAGE_KEYS.session);
  }

  getMangaDexConnection(): Promise<MangaDexConnection | null> {
    return readJson<MangaDexConnection>(this.store, STORAGE_KEYS.mangadexConnection);
  }

  async connectMangaDex(credentials: MangaDexCredentials): Promise<MangaDexConnection> {
    const tokens = await this.datasource.login({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      username: credentials.username,
      password: credentials.password,
    });

    const connection: MangaDexConnection = {
      clientId: credentials.clientId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      connectedAt: new Date().toISOString(),
    };

    await this.persistSecret(credentials.clientSecret);
    await writeJson(this.store, STORAGE_KEYS.mangadexConnection, connection);
    return connection;
  }

  async disconnectMangaDex(): Promise<void> {
    await this.store.removeItem(STORAGE_KEYS.mangadexConnection);
    await this.secure.removeItem(secretKey());
  }

  getValidAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.resolveAccessToken().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async resolveAccessToken(): Promise<string | null> {
    const connection = await this.getMangaDexConnection();
    if (!connection) return null;

    const expiresAt = new Date(connection.expiresAt).getTime();
    if (expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
      return connection.accessToken;
    }

    const clientSecret = await this.secure.getItem(secretKey());
    if (!clientSecret) return null;

    try {
      const tokens = await this.datasource.refresh(
        connection.clientId,
        clientSecret,
        connection.refreshToken,
      );
      const updated: MangaDexConnection = {
        ...connection,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? connection.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      };
      await writeJson(this.store, STORAGE_KEYS.mangadexConnection, updated);
      return updated.accessToken;
    } catch {
      await this.disconnectMangaDex();
      return null;
    }
  }

  private persistSecret(clientSecret: string): Promise<void> {
    return this.secure.setItem(secretKey(), clientSecret);
  }
}

function secretKey(): string {
  return `${STORAGE_KEYS.mangadexConnection}.secret`;
}
