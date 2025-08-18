import responsive from "@/responsive";
import { getVideoDetail, getVideoWatchedStatus, VideoWatchedStatusResponse } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
// import { ProgressBar } from "react-native-paper";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import type { WebView as WebViewType } from "react-native-webview";
import { WebView } from "react-native-webview";

const VideoDetails: React.FC = () => {
  const window = useWindowDimensions();
  const { video_id } = useLocalSearchParams<{ video_id: string }>();
  const webViewRef = useRef<WebViewType>(null);
  const [videoData, setVideoData] = useState<Awaited<ReturnType<typeof getVideoDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoWatchedStatusResponse["data"] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFaqVideo, setSelectedFaqVideo] = useState<string | null>(null);
  const [videoWatchedPercent, setVideoWatchedPercent] = useState(0);
  const [canMarkComplete, setCanMarkComplete] = useState(false);
  const [autoMarked, setAutoMarked] = useState(false);

  const { width, height } = window;
  const isLandscape = width > height;

  useEffect(() => {
  const backAction = () => {
    if (isFullscreen) {
      toggleFullscreen(); // exits fullscreen
      return true; // prevent default back action
    }
    return false; // allow default back behavior
  };

  const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

  return () => backHandler.remove(); // cleanup on unmount
}, [isFullscreen]);


  useEffect(() => {
    if (video_id) fetchVideoDetails();
  }, [video_id]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVideoDetails();
    setRefreshing(false);
    setWebViewKey(prev => prev + 1);
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
        <style>
          html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
          iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe id="vimeoPlayer"
          src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&controls=1&playsinline=1&fullscreen=0"
          allow="autoplay; fullscreen" allowfullscreen>
        </iframe>
        <script>
          const iframe = document.getElementById('vimeoPlayer');
          window.vimeoPlayer = new Vimeo.Player(iframe);
          let lastPercent = 0;
          let duration = 0;
          let watchedSeconds = 0;
          let lastTime = 0;
          window.vimeoPlayer.on('loaded', function(data) {
            duration = data.duration;
          });
          window.vimeoPlayer.getDuration().then(function(d) { duration = d; });
          window.vimeoPlayer.on('timeupdate', function(data) {
            if (duration > 0) {
              // Only count as watched if user is not skipping ahead by more than 5 seconds
              if (Math.abs(data.seconds - lastTime) < 5) {
                watchedSeconds += data.seconds - lastTime;
              }
              lastTime = data.seconds;
              let percent = (watchedSeconds / duration) * 100;
              if (percent > 100) percent = 100;
              if (percent > lastPercent) {
                lastPercent = percent;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "progress", percent: percent }));
              }
            }
          });
          window.vimeoPlayer.on('ended', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "videoEnded" }));
          });
        </script>
      </body>
    </html>
  `;

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error("Screen orientation error:", error);
    }
  };

  const restartVideo = () => {
    setWebViewKey(prev => prev + 1);
    setIsVideoEnded(false);
  };

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

  // Auto-mark as complete if video ends and not already marked
  React.useEffect(() => {
    if (isVideoEnded && canMarkComplete && !hasAcknowledged && !alreadyAcknowledged && videoStatus?.is_completed !== 1 && !autoMarked) {
      (async () => {
        try {
          await getVideoWatchedStatus(Number(video_id));
          await AsyncStorage.setItem(`video_acknowledged_${video_id}`, "true");
          setHasAcknowledged(true);
          setAlreadyAcknowledged(true);
          setAutoMarked(true);
          alert("✅ Video marked as completed (auto).");
        } catch {
          alert("❌ Failed to complete video.");
        }
      })();
    }
  }, [isVideoEnded, canMarkComplete, hasAcknowledged, alreadyAcknowledged, videoStatus, autoMarked, video_id]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {isFullscreen && <StatusBar hidden />}

      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headingText} numberOfLines={1}>{videoData.title}</Text>
        </View>
      )}

      <View style={{ width: "100%", height: isFullscreen ? height : height * 0.3 }}>
        <WebView
          key={webViewKey}
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: getVimeoHTML(baseVimeoId) }}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "progress") {
                setVideoWatchedPercent(data.percent);
                if (data.percent >= 95 && !canMarkComplete) setCanMarkComplete(true);
              } else if (data.type === "videoEnded") {
                setIsVideoEnded(true);
                setVideoWatchedPercent(100);
                setCanMarkComplete(true);
              }
            } catch {
              // fallback for old string message
              if (event.nativeEvent.data === "videoEnded") {
                setIsVideoEnded(true);
                setVideoWatchedPercent(100);
                setCanMarkComplete(true);
              }
            }
          }}
          style={{ flex: 1, backgroundColor: "#000" }}
        />

        <TouchableOpacity
          onPress={toggleFullscreen}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: 8,
            borderRadius: 5,
            zIndex: 10,
          }}
        >
          <Ionicons name={isFullscreen ? "contract" : "expand"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {!isFullscreen && (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>Key Points:</Text>
          {videoData.key_points
            .replace(/<[^>]+>/g, "")
            .split(/\n|\u2022|-|\d+\./)
            .filter((item) => item.trim() !== "")
            .map((item, index) => (
              <Text key={index} style={styles.bulletText}>• {item.trim()}</Text>
            ))}

          {/* Progress Bar (fallback if react-native-paper is not installed) */}
          <View style={{ marginVertical: 16 }}>
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>Watched: {Math.floor(videoWatchedPercent)}%</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#eee', overflow: 'hidden' }}>
              <View style={{ width: `${videoWatchedPercent}%`, height: 8, backgroundColor: '#4CAF50' }} />
            </View>
          </View>

          {Array.isArray(videoData.faqs) && videoData.faqs.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
                FAQs (Tap to Play):
              </Text>
              {videoData.faqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: "#f1f1f1",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                  onPress={() => {
                    setSelectedFaqVideo(faq.answer);
                    setWebViewKey(prev => prev + 1);
                  }}
                >
                  <Text numberOfLines={3} style={{ fontWeight: "600" }}>{faq.question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Mark Complete Button, only enabled if canMarkComplete and not already marked */}
          {!hasAcknowledged && !alreadyAcknowledged && videoStatus?.is_completed !== 1 && (
            <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
              <TouchableOpacity onPress={restartVideo} style={styles.buttonGrey}>
                <Text>Watch Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!canMarkComplete}
                onPress={async () => {
                  Alert.alert(
                    "Confirm",
                    `You have watched ${Math.round(videoWatchedPercent)}% of the video. Do you really understand the video?`,
                    [
                      { text: "No", onPress: restartVideo },
                      {
                        text: "Yes",
                        onPress: async () => {
                          try {
                            await getVideoWatchedStatus(Number(video_id));
                            await AsyncStorage.setItem(`video_acknowledged_${video_id}`, "true");
                            setHasAcknowledged(true);
                            setAlreadyAcknowledged(true);
                            alert("✅ Video marked as completed.");
                          } catch {
                            alert("❌ Failed to complete video.");
                          }
                        }
                      }
                    ]
                  );
                }}
                style={[styles.buttonGreen, { opacity: canMarkComplete ? 1 : 0.5 }]}
              >
                <Text style={{ color: "#fff" }}>I Understand</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
  },

  // Header Section
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#033337",
    padding: responsive.padding(15),
  },
  headingBackButtonView: {
    flexDirection: "row",
    alignItems: "center",
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
    flexShrink: 1,
  },

  // Centered View
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Video Section
  videoContainer: {
    marginHorizontal: responsive.margin(10),
    marginTop: responsive.margin(10),
    borderRadius: responsive.borderRadius(10),
    overflow: "hidden",
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Action Buttons (After Video Ended)
  buttonGrey: {
    backgroundColor: "#ccc",
    padding: responsive.padding(12),
    borderRadius: responsive.borderRadius(8),
    flex: 1,
    alignItems: "center",
  },
  buttonGreen: {
    backgroundColor: "#4CAF50",
    padding: responsive.padding(12),
    borderRadius: responsive.borderRadius(8),
    flex: 1,
    alignItems: "center",
  },

  // Video Description / Key Points Section
  videoDetailsView: {
    backgroundColor: "#fff",
    marginHorizontal: responsive.margin(10),
    marginTop: responsive.margin(16),
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(10),
  },
  title: {
    fontSize: responsive.fontSize(20),
    fontWeight: "bold",
    marginBottom: responsive.margin(10),
  },
  sectionTitle: {
    fontSize: responsive.fontSize(16),
    fontWeight: "600",
    marginBottom: responsive.margin(8),
  },
  text: {
    fontSize: responsive.fontSize(14),
    marginTop: responsive.margin(4),
    color: "#333",
  },
  bulletText: {
    fontSize: responsive.fontSize(14),
    color: "#333",
    marginBottom: responsive.margin(6),
    paddingLeft: responsive.padding(8),
  },

  // FAQ Cards
  faqCard: {
    backgroundColor: "#fff",
    padding: responsive.padding(12),
    borderRadius: responsive.borderRadius(10),
    marginBottom: responsive.margin(10),
    width: responsive.width(180),
    elevation: 2,
  },
  faqText: {
    fontWeight: "600",
    fontSize: responsive.fontSize(14),
    color: "#000",
  },
});

export default VideoDetails;
