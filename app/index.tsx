import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

// This is a placeholder. You'll need to implement your actual auth logic.
// For example, you might have a hook like useAuth() that checks a token or calls an API.
const useAuth = () => {
  // Replace this with your actual authentication check
  // For demonstration, let's assume a loading state and a simple isLoggedIn check
  const isLoading = false; // Set to true while checking auth status
  const isLoggedIn = false; // Replace with actual check, e.g., check for a token

  return { isLoading, isLoggedIn };
};

export default function Index() {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    // You might want to show a loading spinner while checking auth status
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/dashboard" />;
  } else {
    return <Redirect href="/Login" />;
  }
}
