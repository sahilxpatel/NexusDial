import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { colors, spacing, typography } from '../theme';
import { useRoute } from '@react-navigation/native';
import { useSocket } from '../hooks/useSocket';

const fetchCallDetail = async (callRecordId: string) => {
  const res = await apiClient.get(`/calls/${callRecordId}`);
  return res.data;
};

export default function CallDetailScreen() {
  const route = useRoute<any>();
  const { callRecordId } = route.params;
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: call, isLoading, isError } = useQuery({
    queryKey: ['call', callRecordId],
    queryFn: () => fetchCallDetail(callRecordId),
  });

  useEffect(() => {
    if (!socket) return;

    const handleIntelligenceReady = (data: any) => {
      if (data.id === callRecordId || data.callRecordId === callRecordId) {
        queryClient.invalidateQueries({ queryKey: ['call', callRecordId] });
      }
    };

    socket.on('intelligence_ready', handleIntelligenceReady);

    return () => {
      socket.off('intelligence_ready', handleIntelligenceReady);
    };
  }, [socket, callRecordId, queryClient]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !call) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load call details</Text>
      </View>
    );
  }

  const aiSummary = call.aiSummary ? JSON.parse(call.aiSummary) : null;
  const isPending = call.intelligenceJob?.status === 'PENDING';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Call Details</Text>
      <Text style={styles.text}>Direction: {call.direction}</Text>
      <Text style={styles.text}>Duration: {call.durationSec}s</Text>
      
      <View style={styles.divider} />
      <Text style={styles.subtitle}>Intelligence Summary</Text>

      {isPending ? (
        <View style={styles.skeletonBox}>
          <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.skeletonText}>Processing...</Text>
        </View>
      ) : aiSummary ? (
        <View style={styles.aiBox}>
          <Text style={styles.aiText}><Text style={styles.bold}>Name:</Text> {aiSummary.name || 'Unknown'}</Text>
          <Text style={styles.aiText}><Text style={styles.bold}>Intent:</Text> {aiSummary.intent || 'Unknown'}</Text>
          
          <View style={[styles.badge, getSentimentStyle(aiSummary.sentiment)]}>
            <Text style={styles.badgeText}>{aiSummary.sentiment || 'NEUTRAL'}</Text>
          </View>
          
          {aiSummary.callbackRequested && (
            <Text style={styles.callbackText}>⚠️ Callback Requested</Text>
          )}
        </View>
      ) : (
        <Text style={styles.textSecondary}>No intelligence data available.</Text>
      )}
    </View>
  );
}

function getSentimentStyle(sentiment: string) {
  switch (sentiment?.toUpperCase()) {
    case 'POSITIVE': return { backgroundColor: colors.success };
    case 'NEGATIVE': return { backgroundColor: colors.error };
    default: return { backgroundColor: colors.warning };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  skeletonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.skeleton,
    padding: spacing.md,
    borderRadius: 8,
  },
  skeletonText: {
    color: colors.textSecondary,
  },
  aiBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  badgeText: {
    color: colors.surface,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  callbackText: {
    marginTop: spacing.sm,
    color: colors.error,
    fontWeight: typography.weights.bold,
  },
});
