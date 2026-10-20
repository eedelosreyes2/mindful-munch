import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
  LinkingOptions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen, { hasOnboarded } from './src/screens/OnboardingScreen';
import LogScreen from './src/screens/LogScreen';
import TodayScreen from './src/screens/TodayScreen';
import EditSnackScreen from './src/screens/EditSnackScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme, useThemeSettings } from './src/theme/colors';
import { MAX_WEB_APP_WIDTH } from './src/theme/layout';
import {
  scheduleWeeklyInsightNotification,
  useLastNotificationResponse,
  WEEKLY_INSIGHT_DEEP_LINK,
} from './src/notifications/weeklyInsight';

export type RootStackParamList = {
  Onboarding: { viewOnly?: boolean } | undefined;
  Log: undefined;
  Today: { initialViewMode?: 'today' | 'week'; initialWeekOffset?: number } | undefined;
  EditSnack: { snackId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const webLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    initialRouteName: 'Log',
    screens: {
      Log: '',
      Today: {
        path: 'log',
        parse: { initialWeekOffset: Number },
      },
      EditSnack: 'edit/:snackId',
      Settings: 'settings',
      Onboarding: {
        path: 'welcome',
        parse: { viewOnly: (value: string) => value === 'true' },
      },
    },
  },
};

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
  const lastNotificationResponse = useLastNotificationResponse();
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
      navigationRef.navigate('Today', { initialViewMode: 'week', initialWeekOffset: 1 });
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: Platform.OS === 'web' ? MAX_WEB_APP_WIDTH : undefined,
            alignSelf: 'center',
          }}
        >
          <NavigationContainer
            ref={navigationRef}
            theme={isDark ? DarkTheme : DefaultTheme}
            onReady={tryHandleNotificationDeepLink}
            linking={Platform.OS === 'web' && initialRoute === 'Log' ? webLinking : undefined}
            documentTitle={{ formatter: () => 'MindfulMunch' }}
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
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
