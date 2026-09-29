import * as Clipboard from 'expo-clipboard';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/core/auth/session-provider';
import { useRepositories } from '@/core/di/provider';
import { isAndroid, isExpoGo } from '@/core/environment';
import { ContentKind, LANGUAGE_OPTIONS } from '@/domain/models/settings';
import {
  useConnectMangadex,
  useDisconnectMangadex,
  useMangadexConnection,
} from '@/features/auth/use-mangadex';
import {
  useActiveSourceId,
  useLanguage,
  useSources,
  useUpdateActiveSource,
  useUpdateLanguage,
} from '@/features/settings/use-settings';
import {
  useNotificationPermission,
  useRegisterPush,
  useRequestNotificationPermission,
  useScheduleLocalTest,
  useSendTestPush,
  useStoredPushToken,
  useUpdateWeeklyReminder,
  useWeeklyReminder,
} from '@/features/notifications/use-notifications';
import {
  useDeviceId,
  usePushRegistrationEnabled,
  useSyncPushRegistration,
  useUnregisterPush,
} from '@/features/notifications/use-push-registration';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const { session, signOut } = useSession();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Ajustes</ThemedText>
        <AccountSection username={session?.username ?? ''} onSignOut={signOut} />
        <SourceAndLanguageSection />
        <MangaDexSection />
        <ServerSyncSection />
        <NotificationsSection />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
    </View>
  );
}

function AccountSection({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  return (
    <Section title="Cuenta local">
      <ThemedText type="small">Sesión: {username}</ThemedText>
      <Button title="Cerrar sesión" variant="danger" onPress={onSignOut} />
    </Section>
  );
}

function SourcePicker({ kind, title }: { kind: ContentKind; title: string }) {
  const sources = useSources(kind);
  const activeSourceId = useActiveSourceId(kind);
  const updateSource = useUpdateActiveSource(kind);
  const activeSource = sources.find((source) => source.id === activeSourceId);

  if (sources.length === 0) return null;

  return (
    <Section title={title}>
      {sources.map((source) => {
        const selected = source.id === activeSourceId;
        return (
          <Button
            key={source.id}
            title={selected ? `${source.name} ✓` : source.name}
            variant={selected ? 'primary' : 'secondary'}
            loading={updateSource.isPending && updateSource.variables === source.id}
            onPress={() => updateSource.mutate(source.id)}
          />
        );
      })}
      {activeSource ? (
        <ThemedText type="small" themeColor="textSecondary">
          {activeSource.description} Idiomas: {activeSource.languages.join(', ')}.
        </ThemedText>
      ) : null}
    </Section>
  );
}

function SourceAndLanguageSection() {
  const language = useLanguage();
  const updateLanguage = useUpdateLanguage();

  return (
    <>
      <SourcePicker kind="manga" title="Fuente de mangas" />
      <SourcePicker kind="book" title="Fuente de libros" />
      <SourcePicker kind="comic" title="Fuente de comics" />

      <Section title="Idioma de lectura">
        <Segmented
          value={language.data ?? 'es'}
          onChange={(value) => updateLanguage.mutate(value)}
          options={LANGUAGE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {language.data === 'all'
            ? 'Se muestran capítulos en todos los idiomas.'
            : `Se prefieren capítulos en ${language.data ?? 'es'}.`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          WeebCentral solo tiene inglés; el idioma aplica a MangaDex.
        </ThemedText>
      </Section>
    </>
  );
}

function MangaDexSection() {
  const { data: connection } = useMangadexConnection();
  const connect = useConnectMangadex();
  const disconnect = useDisconnectMangadex();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (connection) {
    return (
      <Section title="MangaDex">
        <ThemedText type="small" themeColor="success">
          Conectado como {username || 'cuenta MangaDex'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Token expira: {new Date(connection.expiresAt).toLocaleTimeString()}
        </ThemedText>
        <Button
          title="Desconectar"
          variant="secondary"
          loading={disconnect.isPending}
          onPress={() => disconnect.mutate()}
        />
      </Section>
    );
  }

  return (
    <Section title="Conectar MangaDex (opcional)">
      <ThemedText type="small" themeColor="textSecondary">
        Usa tu personal client aprobado en mangadex.org/settings.
      </ThemedText>
      <TextField label="Client ID" value={clientId} onChangeText={setClientId} autoCapitalize="none" />
      <TextField
        label="Client Secret"
        value={clientSecret}
        onChangeText={setClientSecret}
        secureTextEntry
        autoCapitalize="none"
      />
      <TextField label="Usuario" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {connect.isError ? (
        <ThemedText type="small" themeColor="danger">
          {String(connect.error)}
        </ThemedText>
      ) : null}
      <Button
        title="Conectar"
        loading={connect.isPending}
        onPress={() =>
          connect.mutate({ clientId, clientSecret, username, password })
        }
      />
    </Section>
  );
}

function ServerSyncSection() {
  const enabled = usePushRegistrationEnabled();
  const deviceId = useDeviceId();
  const sync = useSyncPushRegistration();
  const unregister = useUnregisterPush();

  return (
    <Section title="Servidor de notificaciones">
      {enabled ? (
        <>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            Dispositivo: {deviceId.data ?? '—'}
          </ThemedText>
          <Button
            title="Sincronizar ahora"
            loading={sync.isPending}
            onPress={() => sync.mutate()}
          />
          <Button
            title="Desregistrar dispositivo"
            variant="secondary"
            loading={unregister.isPending}
            onPress={() => unregister.mutate()}
          />
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Define EXPO_PUBLIC_NOTIFICATIONS_API_URL en el .env para activar el envío desde tu
          servidor.
        </ThemedText>
      )}
    </Section>
  );
}

function NotificationsSection() {
  const theme = useTheme();
  const { notifications } = useRepositories();
  const permission = useNotificationPermission();
  const requestPermission = useRequestNotificationPermission();
  const weekly = useWeeklyReminder();
  const updateWeekly = useUpdateWeeklyReminder();
  const token = useStoredPushToken();
  const registerPush = useRegisterPush();
  const sendTest = useSendTestPush();
  const localTest = useScheduleLocalTest();
  const [copied, setCopied] = useState(false);

  const config = weekly.data;
  const notificationsAvailable = notifications.isSupported();

  return (
    <>
      {!notificationsAvailable ? (
        <Section title="Notificaciones no disponibles">
          <ThemedText type="small" themeColor="textSecondary">
            {isExpoGo && isAndroid
              ? 'En Expo Go (Android) las notificaciones están desactivadas para evitar un bug de expo-notifications. Usa un development build o el APK, o activa el modo Expo Go con "npm run expo-go:notifications:on".'
              : 'Las notificaciones no están disponibles en este entorno.'}
          </ThemedText>
        </Section>
      ) : null}
      <Section title="Permisos y push">
        <ThemedText type="small">
          Permiso: {permission.data ?? 'desconocido'}
        </ThemedText>
        <Button
          title="Solicitar permiso"
          variant="secondary"
          loading={requestPermission.isPending}
          onPress={() => requestPermission.mutate()}
        />
        <Button
          title="Registrar token push"
          loading={registerPush.isPending}
          onPress={() => registerPush.mutate()}
        />
        {registerPush.isError ? (
          <ThemedText type="small" themeColor="danger">
            {String(registerPush.error)}
          </ThemedText>
        ) : null}
        {token.data?.token ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {token.data.token}
            </ThemedText>
            <View style={styles.row}>
              <Button
                title={copied ? 'Copiado' : 'Copiar token'}
                variant="secondary"
                onPress={async () => {
                  await Clipboard.setStringAsync(token.data!.token);
                  setCopied(true);
                }}
              />
              <Button
                title="Enviar push real"
                loading={sendTest.isPending}
                onPress={() => sendTest.mutate(token.data!.token)}
              />
            </View>
          </>
        ) : null}
        <Button
          title="Notificación local (5s)"
          variant="ghost"
          loading={localTest.isPending}
          onPress={() => localTest.mutate()}
        />
      </Section>

      <Section title="Recordatorio de fin de semana">
        {config ? (
          <>
            <View style={styles.switchRow}>
              <ThemedText type="small">Activar recordatorio</ThemedText>
              <Switch
                value={config.enabled}
                trackColor={{ true: theme.accent }}
                onValueChange={(enabled) => updateWeekly.mutate({ ...config, enabled })}
              />
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Día
            </ThemedText>
            <Segmented
              value={String(config.weekday)}
              onChange={(value) =>
                updateWeekly.mutate({ ...config, weekday: Number(value) })
              }
              options={[
                { value: '7', label: 'Sábado' },
                { value: '1', label: 'Domingo' },
              ]}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <TextField
                  label="Hora"
                  keyboardType="number-pad"
                  value={String(config.hour)}
                  onChangeText={(text) =>
                    updateWeekly.mutate({
                      ...config,
                      hour: clamp(Number(text) || 0, 0, 23),
                    })
                  }
                />
              </View>
              <View style={styles.flex}>
                <TextField
                  label="Minuto"
                  keyboardType="number-pad"
                  value={String(config.minute)}
                  onChangeText={(text) =>
                    updateWeekly.mutate({
                      ...config,
                      minute: clamp(Number(text) || 0, 0, 59),
                    })
                  }
                />
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              El aviso mostrará el manga y capítulo donde quedaste.
            </ThemedText>
          </>
        ) : null}
      </Section>
    </>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  section: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
