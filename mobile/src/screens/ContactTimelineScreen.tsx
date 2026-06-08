import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { StateList } from '../components/StateList';
import { colors, spacing, typography } from '../theme';
import { useRoute } from '@react-navigation/native';
import { Phone, Clock } from 'lucide-react-native';

const fetchContactTimeline = async (contactId: string) => {
  const res = await apiClient.get(`/contacts/${contactId}/timeline`).catch(() => ({ data: [] }));
  return res.data;
};

export default function ContactTimelineScreen() {
  const route = useRoute<any>();
  const { contactId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contactTimeline', contactId],
    queryFn: () => fetchContactTimeline(contactId),
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIcon}>
        <Phone color={colors.surface} size={16} />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{item.type || 'Call Record'}</Text>
        <View style={styles.metaRow}>
          <Clock color={colors.textSecondary} size={14} style={styles.metaIcon} />
          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        {item.aiSummary && (
          <View style={styles.aiSummary}>
            <Text style={styles.summaryText}>{JSON.parse(item.aiSummary).intent || 'Unknown Intent'}</Text>
          </View>
        )}
      </View>
    </View>
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
        emptyMessage="No activity yet for this contact."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaIcon: {
    marginRight: 4,
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  aiSummary: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontStyle: 'italic',
  },
});
