import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', // Optional: smooth navigation
      }}
    >
      <Stack.Screen name="Login" />
      <Stack.Screen name="ForgotPassword" />
    </Stack>
  );
}
