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

