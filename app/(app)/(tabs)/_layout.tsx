import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {

    const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#F9BC11",
        tabBarInactiveTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#033337",
          borderTopWidth: 0.5,
          borderTopColor: "#ccc",
          height: 30 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "myvideos":
              iconName = focused ? "videocam" : "videocam-outline";
              break;
            case "profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "alert-circle";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="myvideos" options={{ title: "My Videos" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
