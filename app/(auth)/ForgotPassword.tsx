import responsive from "@/responsive";
import { forgotPassword } from "@/services/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

import { Ionicons } from "@expo/vector-icons";
import logo from "../../assets/images/logo.png";

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please enter your email",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());

      if (response.success === 1) {
        Toast.show({
          type: "success",
          text1: "Link Sent!",
          text2: response.message,
        });

        setTimeout(() => {
          router.replace("/(auth)/Login");
        }, 2000);
      } else {
        Toast.show({
          type: "error",
          text1: response.message || "Something went wrong.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Server Error",
        text2: "Please try again later.",
      });

      console.error("Forgot Password Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContentView}>
        <Image source={logo} style={styles.logoImg} resizeMode="contain" />
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text style={styles.greetingText}>Reset Password</Text>

          <View style={styles.loginFormView}>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.loginBtn, { opacity: loading ? 0.6 : 1 }]}
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Sending..." : "Send Password Reset Link"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.backButtonView}>
            <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={35} color="#F9BC11" />
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
  },
  backButtonView: {
    marginTop: responsive.margin(50), 
    width: '100%', 
    alignItems: 'center'
  },
  mainContentView: {
    width: "100%",
    alignItems: "center",
    marginTop: responsive.margin(100),
  },
  logoImg: {
    width: "70%",
    height: responsive.height(150),
  },
  greetingText: {
    color: "#fff",
    fontSize: responsive.fontSize(20),
    fontWeight: "500",
    marginTop: responsive.margin(30),
  },
  loginFormView: {
    width: "80%",
    marginTop: responsive.margin(15),
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: responsive.borderRadius(20),
    height: responsive.height(50),
    paddingHorizontal: responsive.padding(15),
    fontSize: responsive.fontSize(15),
    marginBottom: responsive.margin(20),
  },
  loginBtn: {
    backgroundColor: "#F9BC11",
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(25),
    alignItems: "center",
  },
  loginBtnText: {
    color: "#033337",
    fontWeight: "500",
    fontSize: responsive.fontSize(17),
  },
});

export default ForgotPassword;
