import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { StateList } from '../components/StateList';
import { colors, spacing, typography } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Phone, Search, Users } from 'lucide-react-native';

const fetchContacts = async () => {
  const res = await apiClient.get('/contacts');
  return res.data;
};

export default function ContactsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  });

  const navigation = useNavigation<any>();

  const filteredData = data?.filter((contact: any) => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ContactTimeline', { contactId: item.id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{item.name || 'Unknown Contact'}</Text>
        <Text style={styles.mobile}>{item.phoneNumber}</Text>
      </View>
      <Phone color={colors.primary} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <StateList
        data={filteredData}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        emptyMessage="No contacts found"
        emptyIcon={<Users color={colors.textSecondary} size={48} />}
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
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  mobile: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
