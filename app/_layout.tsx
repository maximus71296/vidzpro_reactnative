import { Slot } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const _layout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.container}>
        <StatusBar
          animated={true}
          backgroundColor="#033337"
          barStyle="light-content"
        />
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
          <Slot />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
  },
});

export default _layout;
