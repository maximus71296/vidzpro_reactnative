import responsive from "@/responsive";
import { changePassword } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [secureText, setSecureText] = useState({
    current: true,
    new: true,
    confirm: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // ✅ Field validations
    if (!form.currentPassword.trim()) {
      Toast.show({ type: "error", text1: "Current password is required" });
      return;
    }
    if (!form.newPassword.trim()) {
      Toast.show({ type: "error", text1: "New password is required" });
      return;
    }
    if (form.newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "New password must be at least 6 characters",
      });
      return;
    }
    if (!form.confirmPassword.trim()) {
      Toast.show({ type: "error", text1: "Please confirm your new password" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);

      const response = await changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword
      );

      if (response.success === 1) {
        Toast.show({
          type: "success",
          text1: response.message || "Password changed successfully",
        });
        // small delay so toast is visible before navigating back
        setTimeout(() => router.back(), 1500);
      } else {
        Toast.show({
          type: "error",
          text1: response.message || "Failed to change password",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    key: "currentPassword" | "newPassword" | "confirmPassword",
    toggleKey: "current" | "new" | "confirm"
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.input}
          placeholder={label}
          value={value}
          secureTextEntry={secureText[toggleKey]}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => setForm((prev) => ({ ...prev, [key]: text }))}
        />
        <TouchableOpacity
          onPress={() =>
            setSecureText((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))
          }
        >
          <Ionicons
            name={secureText[toggleKey] ? "eye-off" : "eye"}
            size={20}
            color="#555"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="#fff"
            style={styles.backbuttonIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headingText}>Change Password</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderPasswordInput(
          "Current Password",
          form.currentPassword,
          "currentPassword",
          "current"
        )}
        {renderPasswordInput(
          "New Password",
          form.newPassword,
          "newPassword",
          "new"
        )}
        {renderPasswordInput(
          "Confirm New Password",
          form.confirmPassword,
          "confirmPassword",
          "confirm"
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backbuttonIcon: {
    marginRight: responsive.margin(10),
  },
  content: {
    padding: responsive.padding(20),
  },
  inputContainer: {
    marginBottom: responsive.margin(15),
  },
  label: {
    fontSize: responsive.fontSize(14),
    fontFamily: "NotoSansMedium",
    marginBottom: 5,
    color: "#333",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: responsive.fontSize(14),
    fontFamily: "NotoSansRegular",
  },
  button: {
    backgroundColor: "#033337",
    padding: responsive.padding(15),
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: responsive.fontSize(16),
    fontFamily: "NotoSansSemiBold",
  },
});
