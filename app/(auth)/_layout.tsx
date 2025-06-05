import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

export default function AuthLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right", // Optional: smooth navigation
        }}
      >
        <Stack.Screen name="Login" />
        <Stack.Screen name="ForgotPassword" />
      </Stack>
      <Toast />
    </>
  );
}
