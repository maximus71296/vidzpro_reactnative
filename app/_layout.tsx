import { Slot } from "expo-router";
import React from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const _layout = () => {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#033337" barStyle="light-content" />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
};

export default _layout;
