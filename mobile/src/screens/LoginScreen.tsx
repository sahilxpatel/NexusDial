import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';
import Toast from 'react-native-toast-message';
import { apiClient } from '../api/client';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [loading, setLoading] = useState(false);
  const setTokens = useAuthStore((state) => state.setTokens);

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await apiClient.post('/auth/send-otp', { mobile });
      setStep('OTP');
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Please check your messages' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.error?.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/verify-otp', { mobile, otp });
      const { token, refreshToken } = res.data;
      await setTokens(token, refreshToken);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Logged in successfully' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.error?.message || 'Invalid OTP' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NexusDial</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {step === 'MOBILE' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mobile (+E.164 format)"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.infoText}>OTP sent to {mobile}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Verify & Login</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.textButton} onPress={() => setStep('MOBILE')}>
            <Text style={styles.textButtonText}>Change Mobile Number</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  infoText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  textButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  textButtonText: {
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});
