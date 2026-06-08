import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { StateList } from '../components/StateList';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';

const fetchContacts = async (search: string) => {
  const params = search ? { q: search } : {};
  const res = await apiClient.get('/contacts', { params }).catch(() => ({ data: [] }));
  return res.data;
};

export default function ContactsScreen() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => fetchContacts(search),
  });

  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ContactTimeline', { contactId: item.id })}
    >
      <View style={styles.details}>
        <Text style={styles.mobile}>{item.mobile}</Text>
        <Text style={styles.meta}>{item.name || 'Unknown Contact'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {item.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <StateList
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyMessage="No contacts found"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.primary + '20', // Light primary background
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
  },
  tagText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
