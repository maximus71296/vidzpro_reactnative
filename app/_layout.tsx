import { Stack } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
          <StatusBar
            animated={true}
            backgroundColor="#033337"
            barStyle="light-content"
          />
          <Stack
            screenOptions={{
              headerShown: false, // remove headers everywhere
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="myvideos/[videoId]" />
            <Stack.Screen name="profile/change-password" />
          </Stack>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#033337", // keep your app background consistent
  },
});
