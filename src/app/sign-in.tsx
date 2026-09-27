import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/core/auth/session-provider';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('Ingresa usuario y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(username.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <ThemedText type="title">manga-spawn</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tu lector de manga con recordatorios de fin de semana.
            </ThemedText>
          </View>

          <View style={styles.form}>
            <TextField
              label="Usuario"
              placeholder="tu_usuario"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
            <TextField
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
            />
            {error ? (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            ) : null}
            <Button title="Entrar" loading={loading} onPress={submit} />
            <ThemedText type="small" themeColor="textSecondary">
              La sesión se guarda de forma local en este dispositivo.
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.six,
  },
  hero: {
    gap: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
});
