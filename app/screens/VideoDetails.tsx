import responsive from "@/responsive";
import { getVideoDetail, getVideoWatchedStatus, VideoWatchedStatusResponse } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { WebView as WebViewType } from "react-native-webview";
import { WebView } from "react-native-webview";

const VideoDetails: React.FC = () => {
  const { video_id } = useLocalSearchParams<{ video_id: string }>();
  const webViewRef = useRef<WebViewType>(null);

  const [videoData, setVideoData] = useState<Awaited<
    ReturnType<typeof getVideoDetail>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [selectedFaqVideo, setSelectedFaqVideo] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoWatchedStatusResponse["data"] | null>(null);

  useEffect(() => {
  const fetchVideo = async () => {
    try {
      const data = await getVideoDetail(Number(video_id));
      setVideoData(data);

      const status = await getVideoWatchedStatus(Number(video_id));
      setVideoStatus(status.data || null);
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

  const restartVideo = () => {
    setWebViewKey((prev) => prev + 1); // Reloads the WebView with new key
    setIsVideoEnded(false); // Reset end state
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

  const vimeoMatch = videoData.url.match(/vimeo\.com\/(\d+)/);
  const vimeoId = vimeoMatch ? vimeoMatch[1] : "";

  const getVimeoIdFromUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  };

  const faqVimeoId = selectedFaqVideo
    ? getVimeoIdFromUrl(selectedFaqVideo)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingBackButtonView}>
          <TouchableOpacity activeOpacity={0.5} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={styles.headingText}
          >
            {videoData.title}
          </Text>
        </View>
      </View>

      <ScrollView>
        <View style={styles.videoContainer}>
          <WebView
            key={webViewKey}
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{
              html: getVimeoHTML(faqVimeoId ?? vimeoId),
            }}
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

        {isVideoEnded && !hasAcknowledged && videoStatus?.is_completed !== 1 && (
          <View style={{ padding: 16, flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={restartVideo}
              style={{
                backgroundColor: "#ccc",
                padding: 12,
                borderRadius: 8,
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text>Watch Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Confirm",
                  "Do you really understand the video?",
                  [
                    {
                      text: "No",
                      onPress: restartVideo,
                      style: "cancel",
                    },
                    {
                      text: "Yes",
                      onPress: async () => {
                        try {
                          await getVideoWatchedStatus(Number(video_id));
                          setHasAcknowledged(true);
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
              style={{
                backgroundColor: "#4CAF50",
                padding: 12,
                borderRadius: 8,
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff" }}>I Understand</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.videoDetailsView}>
          <Text style={styles.title}>{videoData.title}</Text>
          <Text style={styles.sectionTitle}>Description:</Text>
          {videoData.description
            .replace(/<[^>]+>/g, "")
            .split(/\n|•|-|\d+\./)
            .filter((item) => item.trim() !== "")
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
            .replace(/<[^>]+>/g, "")
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
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              FAQs (Tap to Play):
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingLeft: responsive.padding(16) }}
            >
              {videoData.faqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: "#fff",
                    padding: responsive.padding(12),
                    borderRadius: responsive.borderRadius(10),
                    marginRight: responsive.margin(10),
                    width: responsive.width(180),
                  }}
                  onPress={() => {
                    setSelectedFaqVideo(faq.answer);
                    setWebViewKey((prev) => prev + 1); // force reload
                  }}
                >
                  <Text
                    numberOfLines={3}
                    style={{ fontWeight: "600", fontSize: responsive.fontSize(14) }}
                  >
                    {faq.question}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
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
    flexWrap: "wrap",
    textAlign: "left",
    lineHeight: 26,
    flex: 1,
    flexShrink: 1,
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
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
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
