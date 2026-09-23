import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen, { hasOnboarded } from './src/screens/OnboardingScreen';
import LogScreen from './src/screens/LogScreen';
import TodayScreen from './src/screens/TodayScreen';
import EditSnackScreen from './src/screens/EditSnackScreen';
import { useTheme } from './src/theme/colors';
import { Snack } from './src/types/snack';

export type RootStackParamList = {
  Onboarding: undefined;
  Log: undefined;
  Today: undefined;
  EditSnack: { snack: Snack };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colors = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Log' | null>(null);

  useEffect(() => {
    hasOnboarded().then((done) => setInitialRoute(done ? 'Log' : 'Onboarding'));
  }, []);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
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
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
