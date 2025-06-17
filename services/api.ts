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

export interface VideoCategory {
  id: number;
  name: string;
  type: string;
}

export interface VideoCategoryResponse {
  status: string;
  message: string;
  data: VideoCategory[];
}

type LoginResponse = LoginResponseSuccess | LoginResponseFail;

// ====== Forgot Password Response Type ======
interface ForgotPasswordResponse {
  success: number;
  message: string;
}

export interface Video {
  id: number;
  video_title: string;
  description: string;
  video_url: string;
  video_thumbnail: string;
  assign_date: string;
  is_completed: number;
  completed_date: string | null;
}

export interface VideosByCategoryResponse {
  status: string;
  message: string;
  data: {
    current_page: number;
    data: Video[];
  };
}

export interface VideoDetailResponse {
  status: "1" | "0";
  message: string;
  data: {
    id: number;
    title: string;
    description: string;
    url: string;
    key_points: string;
    faqs: any[];
  };
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
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/forgot-password`, { email }, {
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

// ====== Get User Information ======
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

// ====== Get Purchased Plan ======
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

// ====== Get Video Categories ======
export const getVideoCategories = async (): Promise<VideoCategoryResponse> => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) throw new Error('Token not found');

  try {
    const response = await axios.post(`${BASE_URL}/get-video-categories`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching video categories:", error);
    throw error;
  }
};


// ====== Get Videos by Category ======
export const getVideosByCategory = async (
  categoryType: string
): Promise<VideosByCategoryResponse> => {
  const token = await AsyncStorage.getItem("access_token");
  if (!token) throw new Error("Token not found");

  try {
    console.log("📦 Sending category type:", categoryType);

    const response = await axios.post(
      `${BASE_URL}/videos-by-category`,
      { category: categoryType }, // send type string instead of numeric id
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("❌ API Error:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected Error:", error);
    }
    throw error;
  }
};

// ====== Generate Certificate ======
export const generateCertificate = async (type: "toolbox" | "isovideos") => {
  try {
    const token = await AsyncStorage.getItem("access_token");

    if (!token) {
      throw new Error("Token not found in AsyncStorage");
    }

    const response = await axios.post(
      `${BASE_URL}/generate-certificate`,
      { type },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ generateCertificate error:", error);
    return {
      status: 0,
      message: "Failed to generate certificate",
    };
  }
};





// ====== Logout Function ======
export const logout = async (navigation: any) => {
  try {
    // Remove token and user data
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    // Optionally clear everything
    // await AsyncStorage.clear();

    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'login' }],
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// ====== Get Video Detail ======
export const getVideoDetail = async (video_id: number): Promise<VideoDetailResponse["data"]> => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) throw new Error('Token not found');

  try {
    const response = await axios.post<VideoDetailResponse>(
      `${BASE_URL}/videos`,
      { video_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === "1") {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Video fetch failed");
    }
  } catch (error: any) {
    console.error("Error fetching video details:", error.message);
    throw error;
  }
};




