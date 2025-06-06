import { Slot } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const _layout = () => {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#033337" barStyle="light-content" />
      <Slot />
    </SafeAreaProvider>
  );
};

export default _layout;
