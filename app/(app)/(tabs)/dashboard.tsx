import responsive from "@/responsive";
import { getPurchasedPlan } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ More reliable
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
    <>
      {/* ✅ Ensures status bar is styled properly */}
      <StatusBar barStyle="light-content" backgroundColor="#033337" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headingText}>Dashboard</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#033337"
            style={{ marginTop: 100 }}
          />
        ) : (
          <View style={{ width: "100%", alignItems: "center" }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/(tabs)/myvideos")}
            >
              <ImageBackground
                source={imageUrl ? { uri: imageUrl } : undefined}
                style={styles.imageButton}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Prevent transparent background issues
  },
  header: {
    alignItems: "center",
    gap: 20,
    backgroundColor: "#033337",
    paddingVertical: responsive.padding(15),
    paddingHorizontal: responsive.padding(15),
    flexDirection: "row",
  },
  headingText: {
    color: "#fff",
    fontSize: responsive.fontSize(18),
    fontFamily: "NotoSansSemiBold",
  },
  imageButton: {
    width: responsive.width(350),
    height: responsive.height(400),
    marginTop: responsive.margin(80),
    borderRadius: responsive.borderRadius(12),
    overflow: "hidden",
  },
});

export default Dashboard;
