import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { hasAiBackend } from '@/config';
import { radius, spacing, useColors } from '@/theme';
import { AppText, Icon, PrimaryButton } from '@/components';

export default function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError('メールと6文字以上のパスワードを入力してください。');
      return;
    }
    setBusy(true);
    try {
      // Call as methods so Supabase keeps its internal `this` binding.
      const creds = { email: email.trim(), password };
      const { error } =
        mode === 'signIn'
          ? await supabase.auth.signInWithPassword(creds)
          : await supabase.auth.signUp(creds);
      if (error) setError(error.message);
      // On success, the auth listener in AppStore redirects automatically.
    } catch (e: any) {
      setError(e?.message ?? '通信エラーが発生しました。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.secondarySystemGroupedBackground, color: colors.label }];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: colors.systemGroupedBackground }]}
    >
      <View style={styles.content}>
        <AppText variant="largeTitle">Lexilog</AppText>
        <AppText variant="body" color={colors.secondaryLabel} style={styles.tagline}>
          撮るだけで、ことばが集まる。
        </AppText>

        {!hasAiBackend && (
          <View style={[styles.warn, { backgroundColor: colors.fill }]}>
            <Icon name="alert-circle-outline" size={16} color={colors.secondaryLabel} />
            <AppText variant="footnote" color={colors.secondaryLabel}>Supabase未設定です（.env を確認）</AppText>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="メールアドレス"
            placeholderTextColor={colors.tertiaryLabel}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="パスワード（6文字以上）"
            placeholderTextColor={colors.tertiaryLabel}
            secureTextEntry
            style={inputStyle}
          />
          {error && (
            <AppText variant="footnote" color={colors.red} style={{ marginTop: spacing.xs }}>
              {error}
            </AppText>
          )}
          <PrimaryButton
            title={mode === 'signIn' ? 'ログイン' : 'アカウント作成'}
            onPress={submit}
            loading={busy}
            style={{ marginTop: spacing.md }}
          />
          <PrimaryButton
            title={mode === 'signIn' ? 'アカウントを作る' : 'ログインに戻る'}
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
            }}
            variant="plain"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  tagline: { marginTop: spacing.xs, marginBottom: spacing.xxl },
  warn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  form: { gap: spacing.sm },
  input: { height: 50, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontSize: 17 },
});
