import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { StateList } from '../components/StateList';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { PhoneIncoming, PhoneOutgoing, Voicemail } from 'lucide-react-native';

const fetchCalls = async () => {
  // Assuming a /calls endpoint exists based on Phase 5
  // Note: if it doesn't exist, this might fail unless implemented on backend.
  const res = await apiClient.get('/calls');
  return res.data;
};

export default function CallLogScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calls'],
    queryFn: fetchCalls,
  });

  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('CallDetail', { callRecordId: item.id })}
    >
      <View style={styles.iconContainer}>
        {item.direction === 'INBOUND' ? (
          <PhoneIncoming color={colors.primary} size={24} />
        ) : (
          <PhoneOutgoing color={colors.secondary} size={24} />
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.mobile}>{item.callerMobile || item.contact?.mobile || 'Unknown'}</Text>
        <Text style={styles.meta}>
          {new Date(item.startedAt).toLocaleString()} • {item.durationSec}s
        </Text>
      </View>
      {item.hasVoicemail && <Voicemail color={colors.warning} size={20} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StateList
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyMessage="No calls yet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  mobile: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  meta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
