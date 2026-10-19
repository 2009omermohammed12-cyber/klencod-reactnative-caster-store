import React from 'react';
import { ScrollView, Text } from 'react-native';
import { COLORS } from '../config';
import { useTheme } from '../theme';
import { TERMS, PRIVACY } from '../legal';

export default function Legal({ route }) {
  useTheme();
  const text = route.params.kind === 'terms' ? TERMS : PRIVACY;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Text style={{ color: COLORS.dark, textAlign: 'right', lineHeight: 28, fontSize: 15 }}>{text}</Text>
    </ScrollView>
  );
}
