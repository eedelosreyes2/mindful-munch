import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import OnboardingScreen, { hasOnboarded } from './src/screens/OnboardingScreen';
import LogScreen from './src/screens/LogScreen';
import TodayScreen from './src/screens/TodayScreen';
import EditSnackScreen from './src/screens/EditSnackScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme, useThemeSettings } from './src/theme/colors';
import { Snack } from './src/types/snack';
import {
  scheduleWeeklyInsightNotification,
  WEEKLY_INSIGHT_DEEP_LINK,
} from './src/notifications/weeklyInsight';

export type RootStackParamList = {
  Onboarding: undefined;
  Log: undefined;
  Today: { initialViewMode?: 'today' | 'week' } | undefined;
  EditSnack: { snack: Snack };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const colors = useTheme();
  const { isDark } = useThemeSettings();
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Log' | null>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const handledResponseRef = useRef<typeof lastNotificationResponse>(null);

  useEffect(() => {
    hasOnboarded().then((done) => setInitialRoute(done ? 'Log' : 'Onboarding'));
  }, []);

  useEffect(() => {
    if (initialRoute === 'Log') {
      scheduleWeeklyInsightNotification();
    }
  }, [initialRoute]);

  const tryHandleNotificationDeepLink = () => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse !== handledResponseRef.current &&
      lastNotificationResponse.notification.request.content.data?.deepLink ===
        WEEKLY_INSIGHT_DEEP_LINK &&
      navigationRef.isReady()
    ) {
      handledResponseRef.current = lastNotificationResponse;
      navigationRef.navigate('Today', { initialViewMode: 'week' });
    }
  };

  useEffect(() => {
    tryHandleNotificationDeepLink();
  }, [lastNotificationResponse, initialRoute]);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        theme={isDark ? DarkTheme : DefaultTheme}
        onReady={tryHandleNotificationDeepLink}
      >
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Log" component={LogScreen} />
          <Stack.Screen name="Today" component={TodayScreen} />
          <Stack.Screen name="EditSnack" component={EditSnackScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
