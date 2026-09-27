import {
  LocalSession,
  MangaDexConnection,
  MangaDexCredentials,
} from '../models/auth';

export interface AuthRepository {
  getSession(): Promise<LocalSession | null>;
  saveSession(session: LocalSession): Promise<void>;
  clearSession(): Promise<void>;

  getMangaDexConnection(): Promise<MangaDexConnection | null>;
  connectMangaDex(credentials: MangaDexCredentials): Promise<MangaDexConnection>;
  disconnectMangaDex(): Promise<void>;
  getValidAccessToken(): Promise<string | null>;
}
