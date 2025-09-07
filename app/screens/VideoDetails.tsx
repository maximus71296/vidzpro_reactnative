import responsive from "@/responsive";
import {
  getVideoDetail,
  getVideoWatchedStatus,
  VideoWatchedStatusResponse,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import type { WebView as WebViewType } from "react-native-webview";
import { WebView } from "react-native-webview";

const VideoDetails: React.FC = () => {
  const navigation = useNavigation();
  const window = useWindowDimensions();
  const { video_id } = useLocalSearchParams<{ video_id: string }>();
  const webViewRef = useRef<WebViewType>(null);

  const [videoData, setVideoData] = useState<Awaited<
    ReturnType<typeof getVideoDetail>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [videoWatchedPercent, setVideoWatchedPercent] = useState(0);
  const [canMarkComplete, setCanMarkComplete] = useState(false);

  // NEW: modal states for confirm + actions + yes/no
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showUnderstandModal, setShowUnderstandModal] = useState(false);
  const [videoStatus, setVideoStatus] = useState<
    VideoWatchedStatusResponse["data"] | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { width, height } = window;

  useEffect(() => {
    const backAction = () => {
      if (isFullscreen) {
        toggleFullscreen();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [isFullscreen]);

  useEffect(() => {
    if (video_id) fetchVideoDetails();
  }, [video_id]);

  const fetchVideoDetails = async () => {
  try {
    const data = await getVideoDetail(Number(video_id));
    setVideoData(data);

    // 🔹 Fetch watched status from backend FIRST
    const status = await getVideoWatchedStatus(Number(video_id));
    if (status.status === "1" && status.data) {
      setVideoStatus(status.data);

      if (status.data.is_completed === 1) {
        setVideoWatchedPercent(100);
        setHasAcknowledged(true);
        setAlreadyAcknowledged(true);
        setCanMarkComplete(true);
      } else {
        // backend says not complete → start from 0 (or % if provided)
        setVideoWatchedPercent(0);
        setHasAcknowledged(false);
        setAlreadyAcknowledged(false);
      }
    } else {
      // 🔹 fallback: check local storage if API didn’t give a status
      const localAck = await AsyncStorage.getItem(
        `video_acknowledged_${video_id}`
      );
      if (localAck === "true" || data.is_completed === 1) {
        setAlreadyAcknowledged(true);
        setHasAcknowledged(true);
        setVideoWatchedPercent(100);
      }
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
    setWebViewKey((prev) => prev + 1);
  };

  const getVimeoIdFromUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  };

  /**
   * HTML kept lean: anti fast-forward, report progress (capped at 99) and send "videoEnded".
   * No UI inside the iframe.
   */
  const getVimeoHTML = (videoId: string) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; background: black; }
        #vimeoPlayer { position: absolute; inset: 0; width: 100%; height: 100%; }
        #blockOverlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.6); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; z-index: 999; visibility: hidden;
        }
      </style>
      <script src="https://player.vimeo.com/api/player.js"></script>
    </head>
    <body>
      <div id="blockOverlay">⏩ Forward blocked</div>
      <iframe id="vimeoPlayer"
        src="https://player.vimeo.com/video/${videoId}?api=1&autoplay=0&muted=0&controls=1"
        frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
      <script>
        const iframe = document.getElementById('vimeoPlayer');
        const player = new Vimeo.Player(iframe);
        const overlay = document.getElementById('blockOverlay');

        let duration = 0, maxAllowed = 0, lastPercent = 0;

        const showBlocked = () => {
          overlay.style.visibility = 'visible';
          setTimeout(() => overlay.style.visibility = 'hidden', 900);
        };

        const snapBack = () => {
          player.getPaused().then(isPaused => {
            player.setCurrentTime(maxAllowed).then(() => {
              if (!isPaused) player.play().catch(()=>{});
            }).catch(()=>{});
          }).catch(()=>{});
          showBlocked();
        };

        player.on('loaded', (data) => {
          duration = data?.duration || 0;
        });

        player.on('timeupdate', (data) => {
          const t = data?.seconds || 0;
          const tolerance = 0.75;
          if (t > maxAllowed + tolerance) { snapBack(); return; }
          if (t > maxAllowed) maxAllowed = t;

          if (duration > 0) {
            let percent = (maxAllowed / duration) * 100;
            if (percent > 99) percent = 99; // stay at 99 until RN marks completion
            if (percent > lastPercent) {
              lastPercent = percent;
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "progress", percent }));
            }
          }
        });

        player.on('ended', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "videoEnded" }));
        });
      </script>
    </body>
  </html>
`;

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error("Screen orientation error:", error);
    }
  };

  const resetForReplay = () => {
    setIsVideoEnded(false);
    setShowConfirmModal(false);
    setConfirmText("");
    setShowActionsModal(false);
    setShowUnderstandModal(false);
    setVideoWatchedPercent(0);
  };

  const restartVideo = () => {
    resetForReplay();
    setWebViewKey((prev) => prev + 1); // reloads WebView
  };

  const baseVimeoId = videoData ? getVimeoIdFromUrl(videoData.url) : "";

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

  // Handlers for the new flow
  const handleConfirmSubmit = () => {
    if (confirmText.trim().toLowerCase() === "confirm") {
      setShowConfirmModal(false);
      setShowActionsModal(true); // now show "I Understand" and "Watch Again"
    }
  };

  const handleUnderstandPrimary = () => {
    setShowActionsModal(false);
    setShowUnderstandModal(true); // Yes/No popup
  };

  const handleUnderstandNo = () => {
    setShowUnderstandModal(false);
    restartVideo();
  };

  const handleUnderstandYes = async () => {
    if (videoWatchedPercent < 95) {
      setShowUnderstandModal(false);
      return;
    }

    try {
      const res = await getVideoWatchedStatus(Number(video_id));
      if (res.status === "1") {
        await AsyncStorage.setItem(`video_acknowledged_${video_id}`, "true");
        setHasAcknowledged(true);
        setAlreadyAcknowledged(true);
        setShowUnderstandModal(false);

        // 🔹 Update progress instantly
        setVideoWatchedPercent(100);
        setCanMarkComplete(true);
      } else {
        console.warn("Video completion API failed:", res.message);
      }
    } catch (e) {
      console.error("Error marking video complete:", e);
    } finally {
      setShowUnderstandModal(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {isFullscreen && <StatusBar hidden />}

      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headingText} numberOfLines={1}>
            {videoData.title}
          </Text>
        </View>
      )}

      {/* Video */}
      <View
        style={{ width: "100%", height: isFullscreen ? height : height * 0.3 }}
      >
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
                // progress stays <= 99 until user completes confirm + yes flow
                setVideoWatchedPercent(data.percent);
                if (data.percent >= 95) setCanMarkComplete(true);
              } else if (data.type === "videoEnded") {
                setIsVideoEnded(true);
                // Show the confirm modal (text input) when the video actually ends
                setShowConfirmModal(true);
              }
            } catch {
              // no-op for legacy string messages
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
          <Ionicons
            name={isFullscreen ? "contract" : "expand"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Page content */}
      {!isFullscreen && (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          style={{ padding: 16 }}
        >
          <Text style={styles.sectionTitle}>Key Points:</Text>
          {videoData.key_points
            .replace(/<[^>]+>/g, "")
            .split(/\n|\u2022|-|\d+\./)
            .filter((item) => item.trim() !== "")
            .map((item, index) => (
              <Text key={index} style={styles.bulletText}>
                • {item.trim()}
              </Text>
            ))}

          {/* Progress Bar */}
          <View style={{ marginVertical: 16 }}>
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>
              Watched: {Math.floor(videoWatchedPercent)}%
            </Text>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "#eee",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${videoWatchedPercent}%`,
                  height: 8,
                  backgroundColor: "#4CAF50",
                }}
              />
            </View>
          </View>

          {/* After-completion actions are via modals now, so we remove the old inline buttons */}
        </ScrollView>
      )}

      {/* ===== Modals ===== */}

      {/* 1) Confirm Modal: text input centered on screen */}
      {/* 1) Confirm Modal */}
<Modal visible={showConfirmModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>
        Type 'complete' and submit if you understand, or watch the video again
      </Text>

      <TextInput
        value={confirmText}
        onChangeText={(t) => {
          setConfirmText(t);
          setErrorMessage("");
        }}
        placeholder="complete"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonBlack} onPress={restartVideo}>
          <Text style={{ color: "#fbc511", fontWeight: "600" }}>
            Watch Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonGold}
          onPress={() => {
            if (confirmText.trim().toLowerCase() === "complete") {
              setShowConfirmModal(false);
              setShowActionsModal(true);
            } else {
              setErrorMessage(
                "Please either type complete and submit to confirm your understanding. Or watch the video again."
              );
            }
          }}
        >
          <Text style={{ color: "#000", fontWeight: "600" }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


      {/* 2) Actions Modal: I Understand / Watch Again */}
      <Modal visible={showActionsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose an option</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.buttonBlack, { flex: 1 }]}
                onPress={restartVideo}
              >
                <Text style={{ textAlign: "center", color: '#fbc511' }}>Watch Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonGold, { flex: 1 }]}
                onPress={handleUnderstandPrimary}
              >
                <Text style={{ color: "#000", textAlign: "center" }}>
                  I Understand
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3) Yes/No confirmation for understanding */}
      <Modal visible={showUnderstandModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Do you understand the video?</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.buttonBlack, { flex: 1 }]}
                onPress={handleUnderstandNo}
              >
                <Text style={{ textAlign: "center", color: '#fbc511'  }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonGold, { flex: 1 }]}
                onPress={handleUnderstandYes}
              >
                <Text style={{ color: "#000", textAlign: "center" }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9D9D9",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#033337",
    padding: responsive.padding(15),
    gap: 10,
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

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },

  buttonGrey: {
    backgroundColor: "#ccc",
    padding: responsive.padding(12),
    borderRadius: responsive.borderRadius(8),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGreen: {
    backgroundColor: "#fbc511",
    padding: responsive.padding(12),
    borderRadius: responsive.borderRadius(8),
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: responsive.fontSize(16),
    fontWeight: "600",
    marginBottom: responsive.margin(8),
  },
  bulletText: {
    fontSize: responsive.fontSize(14),
    color: "#333",
    marginBottom: responsive.margin(6),
    paddingLeft: responsive.padding(8),
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  errorText: {
  color: "red",
  fontSize: 12,
  textAlign: "center",
  marginBottom: 6,
},

buttonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginTop: 10,
},

buttonBlack: {
  flex: 1,
  backgroundColor: "#000",
  padding: responsive.padding(12),
  borderRadius: responsive.borderRadius(8),
  alignItems: "center",
  marginRight: 8,
},

buttonGold: {
  flex: 1,
  backgroundColor: "#fbc511",
  padding: responsive.padding(12),
  borderRadius: responsive.borderRadius(8),
  alignItems: "center",
  marginLeft: 8,
},

});

export default VideoDetails;
