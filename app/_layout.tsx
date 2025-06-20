import { Slot } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const _layout = () => {
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar
        animated={true}
        backgroundColor="#033337"
        barStyle="light-content"
      />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
  },
});

export default _layout;
