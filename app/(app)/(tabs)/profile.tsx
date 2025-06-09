import responsive from "@/responsive";
import { getUserDetails } from "@/services/api";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import userImage from "../../../assets/images/user.png";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<null | {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");

        if (!accessToken) {
          Toast.show({
            type: "error",
            text1: "Token Missing",
            text2: "Please login again.",
          });
          return;
        }

        const res = await getUserDetails(accessToken);
        if (res.status === "1" && res.data) {
          setUserData(res.data);
        } else {
          Toast.show({
            type: "error",
            text1: "Failed to load profile",
            text2: res.message || "Try again later",
          });
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Something went wrong",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatPhoneNumber = (phone?: string): string => {
    if (!phone || phone.length !== 10) return phone || "N/A";
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("access_token");
    Toast.show({ type: "success", text1: "Logged out" });
    // You can also navigate to login page here
  };

  const infoFields = [
    { label: "Username", value: `@${userData?.first_name?.toLowerCase() || "unknown"}` },
    { label: "Name", value: `${userData?.first_name || ""} ${userData?.last_name || ""}` },
    { label: "Phone", value: formatPhoneNumber(userData?.phone) },
    { label: "Email", value: userData?.email || "N/A" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#033337" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#033337" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headingText}>Profile</Text>
        </View>

        {/* Profile Image + Edit Button */}
        <View style={styles.mainContentView}>
          <View style={styles.profileImageContainer}>
            <Image source={userImage} style={styles.profileImage} />
            <TouchableOpacity
              style={styles.cameraButton}
              activeOpacity={0.7}
              onPress={() => console.log("Change Image")}
            >
              <FontAwesome name="camera" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Information List */}
          <View style={styles.formContainer}>
            <FlatList
              data={infoFields}
              keyExtractor={(item) => item.label}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.formRow,
                    index === infoFields.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
              )}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#033337",
    padding: responsive.padding(15),
  },
  headingText: {
    color: "#fff",
    fontSize: responsive.fontSize(18),
    fontFamily: "NotoSansSemiBold",
  },
  mainContentView: {
    alignItems: "center",
    marginTop: responsive.margin(30),
    flex: 1,
  },
  profileImageContainer: {
    width: responsive.width(150),
    height: responsive.height(150),
    borderRadius: responsive.borderRadius(75),
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: responsive.width(40),
    height: responsive.width(40),
    backgroundColor: "#fff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sectionTitle: {
    marginTop: responsive.margin(20),
    fontSize: responsive.fontSize(17),
    fontWeight: "600",
    color: "#000",
  },
  formContainer: {
    width: "90%",
    backgroundColor: "#eeeeee",
    borderRadius: responsive.borderRadius(10),
    marginTop: responsive.margin(20),
    overflow: "hidden",
  },
  formRow: {
    padding: responsive.padding(12),
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  label: {
    fontSize: responsive.fontSize(13),
    color: "gray",
    fontWeight: "500",
  },
  value: {
    fontSize: responsive.fontSize(15),
    marginTop: 3,
  },
  logoutButton: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#033337",
    paddingVertical: responsive.padding(15),
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsive.margin(20),
  },
  logoutText: {
    color: "#fff",
    fontSize: responsive.fontSize(15),
    fontWeight: "500",
  },
});

export default Profile;
