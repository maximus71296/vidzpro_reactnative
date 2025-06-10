import responsive from '@/responsive';
import { loginUser } from '@/services/api'; // 👈 API call
import { Ionicons } from '@expo/vector-icons'; // 👈 Make sure this is added
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import logo from "../../assets/images/logo.png";

const Login = () => {
  const [email, setEmail] = useState<string>('miemp.user@yopmail.com');
  const [password, setPassword] = useState<string>('eDToUSra');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Please enter both email and password."
      })
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success === 1) {
      const { access_token, name } = result.data;

      Toast.show({
        type: "success",
        text1: "Login Successful!",
        text2: `Welcome ${name}`
      })

      router.replace("/(app)/(tabs)/dashboard");
    } else {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: result.message,
      })
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#033337" barStyle="light-content" />
      <View style={styles.mainContentView}>
        <Image source={logo} style={styles.logoImg} resizeMode="contain" />
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text style={styles.greetingText}>Hello, Let's get started!</Text>

          {/* Login Form */}
          <View style={styles.loginFormView}>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Password Input with Eye Icon */}
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
              />
              <TouchableOpacity
                onPress={() => setSecure(!secure)}
                style={{
                  position: 'absolute',
                  right: 15,
                  top: responsive.height(15),
                }}
              >
                <Ionicons
                  name={secure ? 'eye-off' : 'eye'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.5} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordBtn}
              activeOpacity={0.5}
              onPress={() => router.push('/(auth)/ForgotPassword')}
            >
              <Text style={styles.forgotPasswordBtnText}>Forgot Password</Text>
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
    marginTop: responsive.margin(100),
  },
  logoImg: {
    width: "70%",
    height: responsive.height(100),
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

export default Login;
