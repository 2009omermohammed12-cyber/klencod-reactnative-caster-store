import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS } from '../config';
import { ProductCard } from '../ProductCard';
import { useCart } from '../CartContext';
import { useProducts } from '../ProductsContext';

export default function Category({ route, navigation }) {
  useTheme();
  const { add } = useCart();
  const { productsOf } = useProducts();
  const list = productsOf(route.params.id);
  return (
    <View style={s.root}>
      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 8 }}
        ListEmptyComponent={<Text style={s.empty}>لا توجد منتجات في هذا القسم بعد</Text>}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('Product', { id: item.id })} onAdd={() => add(item)} />
        )}
      />
    </View>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60 },
}));
