import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://demo.vausm.co.in/vidzpro-iso/public/api';

// ====== Login Response Types ======
interface LoginResponseSuccess {
  success: 1;
  message: string;
  data: {
    user_id: number;
    name: string;
    email: string;
    access_token: string;
  };
}

interface LoginResponseFail {
  success: 0;
  message: string;
}

interface UserDetailsResponse {
  status: "1" | "0";
  message: string;
  data?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

type LoginResponse = LoginResponseSuccess | LoginResponseFail;

// ====== Forgot Password Response Type ======
interface ForgotPasswordResponse {
  success: number;
  message: string;
}

// ====== Login Function ======
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${BASE_URL}/login`, {
      email,
      password,
    });

    // Save token only if login is successful
    if (response.data.success === 1 && 'data' in response.data) {
      await AsyncStorage.setItem('access_token', response.data.data.access_token);
    }

    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    return {
      success: 0,
      message: 'Something went wrong. Please try again.',
    };
  }
};


// ====== Forgot Password Function ======
export const forgotPassword = async (email: string): Promise<{ success: number; message: string }> => {
  try {
    const response = await axios.post(`${BASE_URL}/forgot-password`, {
      email,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Forgot Password API error:", error?.response?.data || error);
    return {
      success: 0,
      message: "Something went wrong. Please try again.",
    };
  }
};

// ====== Get User Information Function ====
export const getUserDetails = async (token: string): Promise<UserDetailsResponse> => {
  try {
    const response = await axios.post<UserDetailsResponse>(
      `${BASE_URL}/user-details`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Get User API error:", error);
    return {
      status: "0",
      message: "Something went wrong. Please try again.",
    };
  }
};

// ====== Get Purchased Plan (Dashboard) ======
export const getPurchasedPlan = async (token: string): Promise<{
  status: number;
  message: string;
  subscription?: {
    name: string;
  };
  subscription_image_url?: string;
}> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/user/purchased-plan`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Dashboard API error:", error);
    return {
      status: 0,
      message: "Something went wrong. Please try again.",
    };
  }
};


