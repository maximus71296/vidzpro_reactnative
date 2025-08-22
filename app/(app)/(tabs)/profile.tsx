import responsive from "@/responsive";
import { getUserDetails, updateUserProfile } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [userData, setUserData] = useState<null | {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        if (!accessToken) {
          Toast.show({ type: "error", text1: "Token Missing", text2: "Please login again." });
          router.replace("/(auth)/Login");
          return;
        }

        const res = await getUserDetails(accessToken);
        if (res.status === "1" && res.data) {
          setUserData(res.data);
          setFormData({
            first_name: res.data.first_name || "",
            last_name: res.data.last_name || "",
            phone: res.data.phone || "",
          });
        } else {
          Toast.show({ type: "error", text1: "Failed to load profile", text2: res.message || "Try again later" });
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Error", text2: "Something went wrong" });
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

  const handleLogout = () => {
    if (!userData?.first_name) {
      Toast.show({ type: "error", text1: "User data missing", text2: "Cannot logout without user name" });
      return;
    }
    Alert.alert(`Dear ${userData.first_name},`, "Do you wish to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);
          setTimeout(async () => {
            try {
              await AsyncStorage.removeItem("access_token");
              Toast.show({ type: "success", text1: "Logged out" });
              router.replace("/(auth)/Login");
            } catch (error) {
              Toast.show({ type: "error", text1: "Logout Failed", text2: "Please try again." });
            } finally {
              setLogoutLoading(false);
            }
          }, 2000);
        },
      },
    ]);
  };

  const handleSave = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Access token missing. Please login again.",
      });
      return;
    }

    const res = await updateUserProfile(accessToken, formData);
    console.log("API response:", res);

    if (res.status === "1") {
      Toast.show({
        type: "success",
        text1: "Profile Updated Successfully!",
      });

      setUserData((prev) => ({
        ...prev!,
        ...res.data,
      }));

      setEditMode(false);
    } else {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: res.message || "Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("Update Error:", error);
    Toast.show({
      type: "error",
      text1: "Server Error",
      text2: error.message || "Something went wrong. Please try again.",
    });
  }
};



  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#033337" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "#fff", flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headingText}>Profile</Text>
        </View>

        <View style={styles.mainContentView}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.formContainer}>
            {[{ label: "First Name", key: "first_name" }, { label: "Last Name", key: "last_name" }, { label: "Phone", key: "phone" }, { label: "Email", key: "email", editable: false }].map((item, index, arr) => (
              <View key={item.key} style={[styles.formRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}> 
                <Text style={styles.label}>{item.label}</Text>
                {editMode && item.editable !== false ? (
                  <TextInput
                    style={styles.input}
                    value={formData[item.key as keyof typeof formData]}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, [item.key]: text }))}
                    keyboardType={item.key === "phone" ? "phone-pad" : "default"}
                  />
                ) : (
                  <Text style={styles.value}>
                    {item.key === "email"
                      ? userData?.email || "N/A"
                      : item.key === "phone"
                      ? formatPhoneNumber(userData?.phone)
                      : userData?.[item.key as keyof typeof userData] || "N/A"}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {editMode ? (
  <View
    style={{
      flexDirection: "row",
      gap: 10,
      marginTop: responsive.margin(20),
      paddingHorizontal: responsive.padding(20),
    }}
  >
    <TouchableOpacity
      style={[styles.logoutButton, { backgroundColor: "#28a745", flex: 1 }]}
      onPress={handleSave}
    >
      <Text style={styles.logoutText}>Save Changes</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.logoutButton, { backgroundColor: "#6c757d", flex: 1 }]}
      onPress={() => {
        setEditMode(false);
        if (userData) {
          setFormData({
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
          });
        }
      }}
    >
      <Text style={styles.logoutText}>Cancel</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={{ width: "100%", alignItems: "center" }}>
    <TouchableOpacity
      style={[styles.logoutButton, { backgroundColor: "#ffc107", marginTop: 20 }]}
      onPress={() => setEditMode(true)}
    >
      <Text style={styles.logoutText}>Edit Profile</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.logoutButton, { backgroundColor: "#17a2b8", marginTop: 10 }]}
      onPress={() => router.push("/screens/ChangePassword")}
    >
      <Text style={styles.logoutText}>Change Password</Text>
    </TouchableOpacity>
  </View>
)}

        </View>

        {logoutLoading ? (
          <View style={[styles.logoutButton, { flexDirection: "row", justifyContent: "center" }]}> 
            <ActivityIndicator color="#fff" />
            <Text style={[styles.logoutText, { marginLeft: 10 }]}>Logging out...</Text>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.7} style={[styles.logoutButton, { marginTop: 10 }]} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
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
    marginTop: responsive.margin(10),
    flex: 1,
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
  input: {
    fontSize: responsive.fontSize(15),
    borderBottomWidth: 1,
    borderColor: "#aaa",
    paddingVertical: 4,
    marginTop: 5,
  },
  logoutButton: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#033337",
    paddingVertical: responsive.padding(15),
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsive.margin(10),
  },
  logoutText: {
    color: "#fff",
    fontSize: responsive.fontSize(15),
    fontWeight: "500",
  },
});

export default Profile;
