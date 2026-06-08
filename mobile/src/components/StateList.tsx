import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { RefreshCcw, Inbox } from 'lucide-react-native';

interface StateListProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactElement;
}

const SkeletonItem = () => {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonContainer, { opacity }]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </Animated.View>
  );
};

export function StateList<T>({
  data,
  isLoading,
  isError,
  onRefresh,
  renderItem,
  keyExtractor,
  emptyMessage = 'No data available',
  emptyIcon,
}: StateListProps<T>) {
  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        {[1, 2, 3, 4, 5].map((key) => (
          <SkeletonItem key={key} />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <RefreshCcw color={colors.surface} size={20} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        {emptyIcon ? emptyIcon : <Inbox color={colors.textSecondary} size={48} />}
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
  },
  skeletonContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: colors.surface,
    marginLeft: spacing.sm,
    fontWeight: typography.weights.medium,
  },
});
