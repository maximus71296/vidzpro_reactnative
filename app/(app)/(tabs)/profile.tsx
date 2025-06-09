import responsive from "@/responsive";
import { getUserDetails } from "@/services/api";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import user from "../../../assets/images/user.png";

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
          setLoading(false);
          return;
        }

        const res = await getUserDetails(accessToken);

        if (res.status === "1" && res.data) {
          setUserData(res.data);
        } else {
          Toast.show({
            type: "error",
            text1: "Failed to load profile",
            text2: res.message,
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#033337"
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone || phone.length !== 10) return phone || "N/A";

    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#033337" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headingText}>Profile</Text>
        </View>

        <View style={styles.mainContentView}>
          <ImageBackground
            source={user}
            style={styles.imageCircle}
            imageStyle={{ borderRadius: responsive.borderRadius(75) }}
          >
            <TouchableOpacity
              style={styles.cameraButton}
              activeOpacity={0.7}
              onPress={() => console.log("Change image")}
            >
              <FontAwesome
                name="camera"
                size={responsive.width(20)}
                color="#333"
              />
            </TouchableOpacity>
          </ImageBackground>

          <Text style={styles.mainContentHeadingText}>
            Personal Information
          </Text>

          <View style={styles.formView}>
            <View style={styles.formIndividualSection}>
              <Text style={styles.formLabel}>Username</Text>
              <Text style={styles.formValue}>
                @{userData?.first_name?.toLowerCase() || "unknown"}
              </Text>
            </View>

            <View style={styles.formIndividualSection}>
              <Text style={styles.formLabel}>Name</Text>
              <Text style={styles.formValue}>
                {userData?.first_name} {userData?.last_name}
              </Text>
            </View>

            <View style={styles.formIndividualSection}>
              <Text style={styles.formLabel}>Phone</Text>
              <Text style={styles.formValue}>
                {formatPhoneNumber(userData?.phone)}
              </Text>
            </View>

            <View
              style={[styles.formIndividualSection, { borderBottomWidth: 0 }]}
            >
              <Text style={styles.formLabel}>Email</Text>
              <Text style={styles.formValue}>{userData?.email}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
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
  mainContentView: {
    width: "100%",
    alignItems: "center",
    marginTop: responsive.margin(40),
  },
  imageCircle: {
    width: responsive.width(150),
    height: responsive.height(150),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: responsive.borderRadius(75),
    position: "relative",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: responsive.width(40),
    height: responsive.width(40),
    backgroundColor: "#fff",
    borderRadius: responsive.width(20),
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  mainContentHeadingText: {
    marginTop: responsive.margin(20),
    fontWeight: "500",
    fontSize: responsive.fontSize(17),
  },
  formView: {
    backgroundColor: "#dddddd",
    width: "90%",
    marginTop: responsive.margin(20),
    borderRadius: responsive.borderRadius(8),
  },
  formIndividualSection: {
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
    padding: responsive.padding(10),
  },
  formLabel: {
    fontWeight: "500",
    fontSize: responsive.fontSize(13),
    color: "gray",
  },
  formValue: {
    fontSize: responsive.fontSize(15),
  },
  logoutButton: {
    position: "absolute",
    bottom: 10,
    width: "90%",
    backgroundColor: "#033337",
    alignSelf: "center",
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(25),
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: responsive.fontSize(15),
  },
});

export default Profile;
