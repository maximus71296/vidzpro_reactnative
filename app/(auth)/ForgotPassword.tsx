import responsive from "@/responsive";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import logo from "../../assets/images/logo.png";

const ForgotPassword = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#033337" barStyle="light-content" />
      <View style={styles.mainContentView}>
        <Image source={logo} style={styles.logoImg} resizeMode="contain" />
      <View style={{ width: "100%", alignItems: "center" }}>
        <Text style={styles.greetingText}>Reset Password</Text>

        {/* Login Form */}

        <View style={styles.loginFormView}>
          <TextInput style={styles.textInput} placeholder="Email" />
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.5}>
            <Text style={styles.loginBtnText}>Send Password Reset Link</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
  },
  mainContentView: {
    width: '100%',
    alignItems: 'center',
    marginTop: responsive.margin(100)
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
  forgotPasswordBtn: {
    alignItems: "center",
    marginTop: responsive.margin(20),
  },
  forgotPasswordBtnText: {
    color: "#F9BC11",
    fontWeight: "500",
    fontSize: responsive.fontSize(15),
  },
});

export default ForgotPassword;
