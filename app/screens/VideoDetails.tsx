import responsive from "@/responsive";
import { getVideoDetail } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const VideoDetails = () => {
  const { video_id } = useLocalSearchParams();
  const [videoData, setVideoData] = useState<null | Awaited<
    ReturnType<typeof getVideoDetail>
  >>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const data = await getVideoDetail(Number(video_id));
        setVideoData(data);
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    if (video_id) {
      fetchVideo();
    }
  }, [video_id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const formatSmartDate = (
    dateInput?: string | number | Date | null
  ): string => {
    let dateToFormat: Date;
    let options: Intl.DateTimeFormatOptions;

    try {
      // Case 1: A date was provided (from your API).
      if (dateInput) {
        // Create a Date object from the input.
        // The .replace is a safety measure for strings like "2025-05-15 13:37:40"
        const safeInput =
          typeof dateInput === "string"
            ? dateInput.replace(" ", "T")
            : dateInput;
        dateToFormat = new Date(safeInput);

        // Use the options that include time.
        options = {
          year: "numeric",
          month: "short", // "May" -> "May", "December" -> "Dec"
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Use 24-hour format as in your original function
        };
      }
      // Case 2: No date was provided, so use today's date.
      else {
        dateToFormat = new Date();

        // Use the date-only options.
        options = {
          year: "numeric",
          month: "long",
          day: "2-digit",
        };
      }

      // Final check to ensure the date is valid before formatting.
      if (isNaN(dateToFormat.getTime())) {
        throw new Error("Invalid date created.");
      }
    } catch (error) {
      console.error("Date formatting failed for input:", dateInput, error);
      return "Invalid Date"; // Fallback for any errors
    }

    // Use toLocaleString, which works for both date-only and date-with-time.
    return dateToFormat.toLocaleString("en-US", options);
  };

  const transformVimeoUrl = (url: string): string => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    const videoId = match ? match[1] : null;

    if (!videoId) return url;

    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&controls=1`;
  };

  if (!videoData) {
    return (
      <View style={styles.centered}>
        <Text>Unable to fetch video details.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#033337" />
      <View style={styles.header}>
        <View style={styles.headingBackButtonView}>
          <TouchableOpacity activeOpacity={0.5} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headingText}>{videoData.title}</Text>
        </View>
        <View style={styles.dateView}>
          <Text style={styles.dateText}>Today: {formatSmartDate()}</Text>
        </View>
      </View>
      <ScrollView>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <WebView
            source={{
              uri:
                transformVimeoUrl(videoData.url) +
                "?autoplay=0&title=0&byline=0&portrait=0&controls=1&fullscreen=1&speed=0&pip=0",
            }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
          />
        </View>

        {/* Video Details */}
        <View style={styles.videoDetailsView}>
          <Text style={styles.title}>{videoData.title}</Text>
          <Text style={styles.sectionTitle}>Description:</Text>
          {videoData.description
            .replace(/<[^>]+>/g, "") // remove HTML tags
            .split(/\n|•|-|\d+\./) // split on newline, bullets, hyphens, or numbered lists
            .filter((item) => item.trim() !== "") // remove empty lines
            .map((item, index) => (
              <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
                • {item.trim()}
              </Text>
            ))}

          <Text
            style={[styles.sectionTitle, { marginTop: responsive.margin(10) }]}
          >
            Key Points:
          </Text>
          {videoData.key_points
            .replace(/<[^>]+>/g, "") // remove HTML tags
            .split(/\n|•|-|\d+\./) // split into bullet items
            .filter((item) => item.trim() !== "") // remove empty strings
            .map((item, index) => (
              <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
                • {item.trim()}
              </Text>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eeeeee",
  },
  header: {
    alignItems: "center",
    gap: 20,
    backgroundColor: "#033337",
    paddingVertical: responsive.padding(15),
    paddingHorizontal: responsive.padding(15),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headingText: {
    color: "#fff",
    fontSize: responsive.fontSize(18),
    fontFamily: "NotoSansSemiBold",
  },
  dateView: {
    backgroundColor: "#F9BC11",
    paddingVertical: responsive.padding(5),
    paddingHorizontal: responsive.padding(10),
    borderRadius: responsive.borderRadius(5),
  },
  dateText: {
    fontWeight: "500",
    fontSize: responsive.fontSize(11),
  },
  headingBackButtonView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: responsive.fontSize(22),
    fontWeight: "bold",
    marginBottom: responsive.margin(10),
  },
  sectionTitle: {
    fontSize: responsive.fontSize(16),
    fontWeight: "600",
  },
  text: {
    fontSize: responsive.fontSize(13),
    marginTop: responsive.margin(4),
    color: "#333",
  },
  videoContainer: {
    margin: responsive.margin(10),
    height: responsive.height(200),
    borderRadius: responsive.borderRadius(10),
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
  videoDetailsView: {
    backgroundColor: "#fff",
    marginHorizontal: responsive.margin(10),
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(10),
  },
});

export default VideoDetails;
