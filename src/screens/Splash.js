import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';
import { STORE } from '../config';

// شاشة افتتاحية احترافية: شعار متحرك + اسم المتجر + شريط تحميل، ثم تتلاشى للتطبيق
const BG = '#F5F1E5';

export default function Splash({ onDone }) {
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
    Animated.timing(bar, { toValue: 1, duration: 2300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const t = setTimeout(() => {
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => onDone && onDone());
    }, 2700);
    return () => clearTimeout(t);
  }, []);

  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const dy = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const w = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[s.root, { opacity: out }]} pointerEvents="auto">
      <Animated.View style={{ opacity: logo, transform: [{ scale }, { translateY: dy }], alignItems: 'center' }}>
        <Image source={require('../../assets/logo.png')} style={s.img} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[s.tag, { opacity: text }]}>تسوّق بثقة • توصيل مجاني لكل المحافظات</Animated.Text>
      <View style={s.track}><Animated.View style={[s.fill, { width: w }]} /></View>
      <Text style={s.ver}>الإصدار {STORE.version}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  img: { width: 280, height: 280 * (491 / 431) },
  tag: { color: '#1B2B5B', marginTop: 18, fontSize: 14, fontWeight: '600' },
  track: { position: 'absolute', bottom: 80, width: 180, height: 5, borderRadius: 3, backgroundColor: 'rgba(27,43,91,0.12)', overflow: 'hidden' },
  fill: { height: 5, backgroundColor: '#E98B2A', borderRadius: 3 },
  ver: { position: 'absolute', bottom: 44, color: 'rgba(27,43,91,0.5)', fontSize: 12 },
});
