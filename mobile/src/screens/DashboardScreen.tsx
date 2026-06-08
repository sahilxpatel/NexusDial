import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { colors, spacing, typography } from '../theme';
import { Phone, Users } from 'lucide-react-native';

const fetchDashboardStats = async () => {
  // Assuming a hypothetical /dashboard/stats endpoint
  const res = await apiClient.get('/dashboard/stats').catch(() => ({
    data: { totalCalls: 0, totalContacts: 0, recentActivity: [] }
  }));
  return res.data;
};

export default function DashboardScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.header}>Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Phone color={colors.primary} size={32} />
          <Text style={styles.statValue}>{data?.totalCalls || 0}</Text>
          <Text style={styles.statLabel}>Total Calls</Text>
        </View>

        <View style={styles.statCard}>
          <Users color={colors.primary} size={32} />
          <Text style={styles.statValue}>{data?.totalContacts || 0}</Text>
          <Text style={styles.statLabel}>Contacts</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Recent Activity</Text>
      {data?.recentActivity?.length > 0 ? (
        data.recentActivity.map((activity: any, index: number) => (
          <View key={index} style={styles.activityRow}>
            <Text style={styles.activityText}>{activity.description}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No recent activity found.</Text>
      )}
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
    marginTop: spacing.xl,
  },
  subHeader: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  activityRow: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
