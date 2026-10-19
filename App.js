import React, { useEffect, useState } from 'react';
import { I18nManager, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ManageNotifications from './src/screens/ManageNotifications';
import Splash from './src/screens/Splash';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider, useAuth } from './src/AuthContext';
import { ProductsProvider } from './src/ProductsContext';
import { CartProvider, useCart } from './src/CartContext';
import { NotifProvider } from './src/NotifContext';
import { CATEGORIES } from './src/data';
import { COLORS } from './src/config';
import { setupChannels } from './src/notifications';

import Home from './src/screens/Home';
import Categories from './src/screens/Categories';
import Category from './src/screens/Category';
import Product from './src/screens/Product';
import Cart from './src/screens/Cart';
import Checkout from './src/screens/Checkout';
import CheckoutAddress from './src/screens/CheckoutAddress';
import Orders from './src/screens/Orders';
import Support from './src/screens/Support';
import Chat from './src/screens/Chat';
import Settings from './src/screens/Settings';
import Auth from './src/screens/Auth';
import Notifs from './src/screens/Notifications';
import Legal from './src/screens/Legal';
import ChangePassword from './src/screens/ChangePassword';
import SoundSettings from './src/screens/SoundSettings';
import Broadcast from './src/screens/Broadcast';
import ManageProducts from './src/screens/ManageProducts';
import ProductEditor from './src/screens/ProductEditor';

// واجهة عربية من اليمين لليسار
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navRef = createNavigationContainerRef();

const icon = (e) => ({ focused }) => <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.5 }}>{e}</Text>;

// الترتيب من اليمين: الرئيسية، الأقسام، السلة، طلباتي، الدعم، الإعدادات
function Tabs() {
  useTheme();
  const { count } = useCart();
  const { isOwner } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { height: 62, paddingBottom: 6, paddingTop: 4, backgroundColor: COLORS.card, borderTopColor: COLORS.line },
      }}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'الرئيسية', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Categories" component={Categories} options={{ title: 'الأقسام', tabBarIcon: icon('🗂️') }} />
      <Tab.Screen name="Cart" component={Cart} options={{ title: 'السلة', tabBarIcon: icon('🛒'), tabBarBadge: count > 0 ? count : undefined }} />
      <Tab.Screen name="Orders" component={Orders} options={{ title: isOwner ? 'الطلبات' : 'طلباتي', tabBarIcon: icon('📦') }} />
      <Tab.Screen name="Support" component={Support} options={{ title: 'الدعم', tabBarIcon: icon('💬') }} />
      <Tab.Screen name="Settings" component={Settings} options={{ title: 'الإعدادات', tabBarIcon: icon('⚙️') }} />
    </Tab.Navigator>
  );
}

// الاستماع للإشعارات: الضغط على إشعار يفتح الشاشة المناسبة
function Boot() {
  useEffect(() => {
    setupChannels();
    // الضغط على الإشعار يفتح التطبيق مباشرة على الشاشة المناسبة (حتى لو كان التطبيق مغلقاً تماماً)
    const open = (res, tries = 0) => {
      const d = res?.notification?.request?.content?.data || {};
      if (!navRef.isReady()) { if (tries < 40) setTimeout(() => open(res, tries + 1), 250); return; }
      if (d.kind === 'new_order' || d.kind === 'order_status') navRef.navigate('Tabs', { screen: 'Orders' });
      else if (d.kind === 'new_message') navRef.navigate('Tabs', { screen: 'Support' });
      else navRef.navigate('Notifications');
    };
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) open(r); }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r));
    return () => sub.remove();
  }, []);
  return null;
}

function Root() {
  const { scheme } = useTheme();
  const navTheme = {
    dark: scheme === 'dark',
    colors: {
      primary: COLORS.primary,
      background: COLORS.bg,
      card: COLORS.card,
      text: COLORS.dark,
      border: COLORS.line,
      notification: COLORS.danger,
    },
  };
  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Boot />
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.card },
          headerTitleStyle: { color: COLORS.dark },
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Category" component={Category} options={({ route }) => ({ title: CATEGORIES.find((c) => c.id === route.params.id)?.name })} />
        <Stack.Screen name="Product" component={Product} options={{ title: 'تفاصيل المنتج' }} />
        <Stack.Screen name="Checkout" component={Checkout} options={{ title: 'إتمام الطلب' }} />
        <Stack.Screen name="CheckoutAddress" component={CheckoutAddress} options={{ title: 'عنوان التوصيل' }} />
        <Stack.Screen name="Chat" component={Chat} options={({ route }) => ({ title: route.params?.title || 'محادثة' })} />
        <Stack.Screen name="Auth" component={Auth} options={{ title: 'الحساب' }} />
        <Stack.Screen name="Notifications" component={Notifs} options={{ title: 'الإشعارات' }} />
        <Stack.Screen name="Legal" component={Legal} options={({ route }) => ({ title: route.params.kind === 'terms' ? 'شروط الاستخدام' : 'سياسة الخصوصية' })} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'تغيير كلمة المرور' }} />
        <Stack.Screen name="SoundSettings" component={SoundSettings} options={{ title: 'أصوات الإشعارات' }} />
        <Stack.Screen name="Broadcast" component={Broadcast} options={{ title: 'إرسال إشعار للجميع' }} />
        <Stack.Screen name="ManageNotifications" component={ManageNotifications} options={{ title: 'الإشعارات المنشورة' }} />
        <Stack.Screen name="ManageProducts" component={ManageProducts} options={{ title: 'إدارة المنتجات' }} />
        <Stack.Screen name="ProductEditor" component={ProductEditor} options={{ title: 'المنتج' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function SplashGate() {
  const [done, setDone] = useState(false);
  return done ? null : <Splash onDone={() => setDone(true)} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <NotifProvider>
                <Root />
                <SplashGate />
              </NotifProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}