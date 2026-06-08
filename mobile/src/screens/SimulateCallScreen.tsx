import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { colors, spacing, typography } from '../theme';
import Toast from 'react-native-toast-message';

const fetchNumbers = async () => {
  const res = await apiClient.get('/numbers').catch(() => ({ data: [] }));
  return res.data;
};

const simulateCall = async (payload: any) => {
  const res = await apiClient.post('/simulate/call', payload);
  return res.data;
};

export default function SimulateCallScreen() {
  const [callerMobile, setCallerMobile] = useState('+1234567890');
  const [direction, setDirection] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [durationSec, setDurationSec] = useState('45');
  const [hasVoicemail, setHasVoicemail] = useState(true);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const { data: numbers, isLoading } = useQuery({
    queryKey: ['virtualNumbers'],
    queryFn: fetchNumbers,
  });

  const mutation = useMutation({
    mutationFn: simulateCall,
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Call simulated successfully' });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.error?.message || 'Failed to simulate call' });
    },
  });

  const handleSubmit = () => {
    if (!selectedNumber) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a virtual number' });
      return;
    }
    mutation.mutate({
      virtualNumberId: selectedNumber,
      callerMobile,
      direction,
      durationSec: parseInt(durationSec, 10),
      hasVoicemail,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Simulate Call</Text>

      <Text style={styles.label}>Virtual Number</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
      ) : (
        <View style={styles.numberList}>
          {numbers?.map((num: any) => (
            <TouchableOpacity
              key={num.id}
              style={[styles.chip, selectedNumber === num.id && styles.chipSelected]}
              onPress={() => setSelectedNumber(num.id)}
            >
              <Text style={[styles.chipText, selectedNumber === num.id && styles.chipTextSelected]}>
                {num.e164Number}
              </Text>
            </TouchableOpacity>
          ))}
          {numbers?.length === 0 && <Text style={styles.textSecondary}>No numbers provisioned.</Text>}
        </View>
      )}

      <Text style={styles.label}>Caller Mobile</Text>
      <TextInput
        style={styles.input}
        value={callerMobile}
        onChangeText={setCallerMobile}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Direction</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btnHalf, direction === 'INBOUND' && styles.btnActive]}
          onPress={() => setDirection('INBOUND')}
        >
          <Text style={[styles.btnText, direction === 'INBOUND' && styles.btnTextActive]}>INBOUND</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnHalf, direction === 'OUTBOUND' && styles.btnActive]}
          onPress={() => setDirection('OUTBOUND')}
        >
          <Text style={[styles.btnText, direction === 'OUTBOUND' && styles.btnTextActive]}>OUTBOUND</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Duration (sec)</Text>
      <TextInput
        style={styles.input}
        value={durationSec}
        onChangeText={setDurationSec}
        keyboardType="number-pad"
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Has Voicemail (Triggers AI)</Text>
        <Switch
          value={hasVoicemail}
          onValueChange={setHasVoicemail}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, mutation.isPending && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.submitButtonText}>Simulate Now</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  numberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnHalf: {
    flex: 0.48,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnText: {
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  btnTextActive: {
    color: colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
