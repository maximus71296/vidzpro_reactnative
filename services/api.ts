import axios from 'axios';

const BASE_URL = 'https://demo.vausm.co.in/vidzpro-iso/public/api';

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

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
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
