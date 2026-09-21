import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen, { hasOnboarded } from './src/screens/OnboardingScreen';
import LogScreen from './src/screens/LogScreen';
import TodayScreen from './src/screens/TodayScreen';
import { colors } from './src/theme/colors';

export type RootStackParamList = {
  Onboarding: undefined;
  Log: undefined;
  Today: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
      <NavigationContainer>
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
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
