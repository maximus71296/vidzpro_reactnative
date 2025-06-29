import responsive from "@/responsive";
import { getVideoDetail, getVideoWatchedStatus, VideoWatchedStatusResponse } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { WebView as WebViewType } from "react-native-webview";
import { WebView } from "react-native-webview";

const VideoDetails: React.FC = () => {
  const { video_id } = useLocalSearchParams<{ video_id: string }>();
  const webViewRef = useRef<WebViewType>(null);

  const [videoData, setVideoData] = useState<Awaited<ReturnType<typeof getVideoDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [selectedFaqVideo, setSelectedFaqVideo] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoWatchedStatusResponse["data"] | null>(null);

  const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  try {
    if (video_id) {
      const data = await getVideoDetail(Number(video_id));
      setVideoData(data);

      const localAck = await AsyncStorage.getItem(`video_acknowledged_${video_id}`);
      if (localAck === "true" || data.is_completed === 1) {
        setAlreadyAcknowledged(true);
        setHasAcknowledged(true);
      } else {
        setAlreadyAcknowledged(false);
        setHasAcknowledged(false);
      }

      const status = await getVideoWatchedStatus(Number(video_id));
      if (status.status === "1" && status.data) {
        setVideoStatus(status.data);
      }
    }
  } catch (error) {
    console.error("Refresh failed:", error);
    Alert.alert("Error", "Failed to refresh video details.");
  } finally {
    setRefreshing(false);
    setWebViewKey(prev => prev + 1); // refresh WebView too
  }
};


  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const data = await getVideoDetail(Number(video_id));
        setVideoData(data);

        const localAck = await AsyncStorage.getItem(`video_acknowledged_${video_id}`);
        if (localAck === "true" || data.is_completed === 1) {
          setAlreadyAcknowledged(true);
          setHasAcknowledged(true);
        }

        const status = await getVideoWatchedStatus(Number(video_id));
        if (status.status === "1" && status.data) {
          setVideoStatus(status.data);
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (video_id) fetchVideoDetails();
  }, [video_id]);

  const restartVideo = () => {
    setWebViewKey(prev => prev + 1);
    setIsVideoEnded(false);
  };

  const getVimeoIdFromUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  };

  const getVimeoHTML = (vimeoId: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://player.vimeo.com/api/player.js"></script>
      </head>
      <body style="margin:0;padding:0;overflow:hidden;">
        <div style="width:100vw;height:100vh;">
          <iframe id="vimeoPlayer"
            src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&controls=1&playsinline=1"
            width="100%" height="100%" frameborder="0"
            allow="autoplay; fullscreen" allowfullscreen>
          </iframe>
        </div>
        <script>
          const iframe = document.getElementById('vimeoPlayer');
          window.vimeoPlayer = new Vimeo.Player(iframe);
          let timeWatched = 0;

          window.vimeoPlayer.on('timeupdate', function(data) {
            if (data.seconds - 1 < timeWatched && data.seconds > timeWatched) {
              timeWatched = data.seconds;
            }
          });

          window.vimeoPlayer.on('ended', function() {
            window.ReactNativeWebView.postMessage("videoEnded");
          });

          window.vimeoPlayer.on('seeked', function(data) {
            if (timeWatched < data.seconds) {
              window.vimeoPlayer.setCurrentTime(timeWatched);
            }
          });
        </script>
      </body>
    </html>
  `;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!videoData) {
    return (
      <View style={styles.centered}>
        <Text>Unable to fetch video details.</Text>
      </View>
    );
  }

  const baseVimeoId = getVimeoIdFromUrl(videoData.url);
  const faqVimeoId = selectedFaqVideo ? getVimeoIdFromUrl(selectedFaqVideo) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingBackButtonView}>
          <TouchableOpacity activeOpacity={0.5} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.headingText}>
            {videoData.title}
          </Text>
        </View>
      </View>

      <ScrollView refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }>
        <View style={styles.videoContainer}>
          <WebView
            key={webViewKey}
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: getVimeoHTML(faqVimeoId ?? baseVimeoId) }}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            onMessage={(event) => {
              if (event.nativeEvent.data === "videoEnded") {
                setIsVideoEnded(true);
              }
            }}
            style={styles.webview}
          />
        </View>

        {isVideoEnded && !hasAcknowledged && !alreadyAcknowledged && videoStatus?.is_completed !== 1 && (
          <View style={{ padding: 16, flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={restartVideo}
              style={styles.buttonGrey}
            >
              <Text>Watch Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Confirm",
                  "Do you really understand the video?",
                  [
                    { text: "No", onPress: restartVideo, style: "cancel" },
                    {
                      text: "Yes",
                      onPress: async () => {
                        try {
                          await getVideoWatchedStatus(Number(video_id));
                          await AsyncStorage.setItem(`video_acknowledged_${video_id}`, "true");
                          setHasAcknowledged(true);
                          setAlreadyAcknowledged(true);
                          alert("✅ Video marked as completed.");
                        } catch (error) {
                          alert("❌ Failed to complete video.");
                        }
                      },
                    },
                  ],
                  { cancelable: false }
                );
              }}
              style={styles.buttonGreen}
            >
              <Text style={{ color: "#fff" }}>I Understand</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.videoDetailsView}>
          <Text style={styles.title}>{videoData.title}</Text>
          {/* <Text style={styles.sectionTitle}>Description:</Text>
          {videoData.description.replace(/<[^>]+>/g, "")
            .split(/\n|•|-|\d+\./)
            .filter((item) => item.trim() !== "")
            .map((item, index) => (
              <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
                • {item.trim()}
              </Text>
            ))} */}

          <Text style={styles.sectionTitle}>
            Key Points:
          </Text>
          {videoData.key_points.replace(/<[^>]+>/g, "")
            .split(/\n|•|-|\d+\./)
            .filter((item) => item.trim() !== "")
            .map((item, index) => (
              <Text key={index} style={[styles.text, { paddingLeft: 10 }]}>
                • {item.trim()}
              </Text>
            ))}
        </View>

        {videoData.faqs && videoData.faqs.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", paddingHorizontal: 16, marginBottom: 8 }}>
              FAQs (Tap to Play):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
              {videoData.faqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.faqCard}
                  onPress={() => {
                    setSelectedFaqVideo(faq.answer);
                    setWebViewKey(prev => prev + 1);
                  }}
                >
                  <Text numberOfLines={3} style={styles.faqText}>
                    {faq.question}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D9D9D9" },
  header: {
    alignItems: "center",
    backgroundColor: "#033337",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headingBackButtonView: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  headingText: {
    color: "#fff",
    fontSize: responsive.fontSize(18),
    fontFamily: "NotoSansSemiBold",
    flexWrap: "wrap",
    textAlign: "left",
    lineHeight: 26,
    flex: 1,
    flexShrink: 1,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  videoContainer: {
    margin: 10,
    height: responsive.height(200),
    borderRadius: 10,
    overflow: "hidden",
  },
  webview: { flex: 1 },
  buttonGrey: {
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  buttonGreen: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  videoDetailsView: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    padding: 15,
    borderRadius: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  text: { fontSize: 13, marginTop: 4, color: "#333" },
  faqCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    width: 180,
  },
  faqText: {
    fontWeight: "600",
    fontSize: 14,
  },
});

export default VideoDetails;
