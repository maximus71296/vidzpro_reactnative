import responsive from "@/responsive";
import { getPurchasedPlan } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";

const Dashboard = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) throw new Error("No access token found");

        const res = await getPurchasedPlan(token);

        if (res.status === 1 && res.subscription_image_url) {
          setImageUrl(res.subscription_image_url);
        } else {
          Toast.show({
            type: "error",
            text1: "Error loading dashboard",
            text2: res.message,
          });
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        Toast.show({
          type: "error",
          text1: "Something went wrong",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      {loading ? (
        <ActivityIndicator size="large" color="#033337" style={{ marginTop: 100 }} />
      ) : (
        <TouchableOpacity activeOpacity={0.7}   onPress={() => router.push("/(app)/(tabs)/myvideos")}>
          <ImageBackground
            source={imageUrl ? { uri: imageUrl } : undefined}
            style={styles.imageButton}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  imageButton: {
    width: responsive.width(250),
    height: responsive.height(300),
    marginTop: responsive.margin(80),
    borderRadius: responsive.borderRadius(12),
    overflow: "hidden",
  },
});

export default Dashboard;
