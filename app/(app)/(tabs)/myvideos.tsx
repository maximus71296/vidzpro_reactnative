import responsive from "@/responsive";
import {
  generateCertificate,
  getVideoCategories,
  getVideosByCategory,
  VideoCategory,
} from "@/services/api";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import WebView from "react-native-webview";

const { width, height } = Dimensions.get("window");

// Define type for videos
type VideoItem = {
  id: number;
  video_title: string;
  video_thumbnail: string;
  video_url: string;
  description: string;
  is_completed: number;
  assign_date: string;
  completed_date: string | null;
};

// Map your category strings to allowed certificate types
const certificateTypeMap: Record<string, "toolbox" | "isovideos"> = {
  toolbox: "toolbox",
  isovideos: "isovideos",
  // add more if needed
};

const MyVideos: React.FC = () => {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<VideoCategory | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showIsoModal, setShowIsoModal] = useState(false);
  const [isoCategories, setIsoCategories] = useState<VideoCategory[]>([]);


  const vimeoUrl = "https://player.vimeo.com/video/1071440600";

  const primaryColor = "#F9BC11";
  const secondaryColor = "#033337";

  // Fetch video categories from API
  const fetchCategories = async () => {
    try {
      const response = await getVideoCategories();
      if (response.status === "1") {
        setCategories(response.data);
        setSelectedCategory(response.data[0]);
        setIsoCategories(response.iso);
        setMessage(response.message);
      } else {
        setError("Failed to fetch categories.");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories.");
    }
  };

  // Fetch videos by category name
  const fetchVideos = async (
    categoryName: string,
    page: number = 1,
    isLoadMore = false
  ) => {
    if (!isLoadMore) setLoading(true);
    setError("");

    try {
      const response = await getVideosByCategory(categoryName, page);

      if (response.status === "1") {
        if (isLoadMore) {
          setVideos((prev) => [...prev, ...response.data.data]);
        } else {
          setVideos(response.data.data);
        }
        setCurrentPage(response.data.current_page);
        setLastPage(response.data.last_page);
      } else {
        if (!isLoadMore) setVideos([]);
        setError("No videos found for this category.");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos.");
    } finally {
      if (!isLoadMore) setLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Load More Function
  const loadMoreVideos = () => {
    if (isFetchingMore || currentPage >= lastPage) return;

    setIsFetchingMore(true);
    fetchVideos(selectedCategory?.name || "", currentPage + 1, true);
  };

  // On component mount, fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // When selectedCategory changes, fetch videos
  useEffect(() => {
    if (selectedCategory) {
      fetchVideos(selectedCategory.name);
    }
  }, [selectedCategory]);

  // Certificate download handler (dynamic & type-safe)
  const downloadCertificate = async (categoryType: string) => {
    const type = certificateTypeMap[categoryType.toLowerCase()];
    if (!type) {
      Toast.show({
        type: "error",
        text1: "Invalid certificate type",
        text2: `No certificate available for category "${categoryType}"`,
      });
      return;
    }

    try {
      setDownloading(true);
      console.log("🚀 Starting downloadCertificate for type:", type);

      const res = await generateCertificate(type);

      // Check if the API returned an error
      if (res.status === 0 || res.status === "0") {
        Toast.show({
          type: "error",
          text1: "Download Failed",
          text2: res.message || "Failed to generate certificate",
        });
        return;
      }

      if (res?.file_url) {
        const url = `${res.file_url}?download=1`; // or customize if needed
        Linking.openURL(url);
      } else {
        Toast.show({
          type: "error",
          text1: "Download Failed",
          text2: "Certificate link not found.",
        });
      }
    } catch (err) {
      console.error("❌ Download Error:", err);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: "Something went wrong.",
      });
    } finally {
      setDownloading(false);
      setShowDropdown(false);
    }
  };

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

  useEffect(() => {
    if (selectedCategory) {
      setCurrentPage(1); // ✅ reset page
      setLastPage(1); // ✅ reset lastPage
      fetchVideos(selectedCategory.name, 1);
    }
  }, [selectedCategory]);

  return (
    <>
      <View style={styles.container}>
        <View style={{ backgroundColor: "#fff", flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headingText}>My Videos</Text>
            <View style={styles.dateView}>
              <Text style={styles.dateText}>Today: {formatSmartDate()}</Text>
            </View>
          </View>
          {/* View Tutorials & Certificate */}
          <View style={styles.buttonView}>
            <TouchableOpacity
              style={styles.viewTutorialsButtonView}
              activeOpacity={0.7}
              onPress={() => setVideoModalVisible(true)}
            >
              <Text style={styles.viewTutorialsButtonText}>View Tutorials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.certificateDownloadButtonView}
              activeOpacity={0.7}
              onPress={() => setShowDropdown((prev) => !prev)}
            >
              <Text style={styles.certificateDownloadButtonText}>
                Download Certificate
              </Text>
            </TouchableOpacity>
          </View>

          {/* ToolBox & ISO Buttons */}
          <View style={styles.buttonView}>
            <TouchableOpacity
              style={[
                styles.buttonBase,
                {
                  backgroundColor: selectedCategory?.type === "toolbox" ? primaryColor : secondaryColor,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                const toolboxCategory = categories.find(cat => cat.type === "toolbox");
                if (toolboxCategory) {
                  setSelectedCategory(toolboxCategory);
                }
              }}
            >
              <Text
                style={{
                  color: selectedCategory?.type === "toolbox" ? secondaryColor : primaryColor,
                  fontSize: responsive.fontSize(14),
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                ToolBox
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonBase,
                {
                  backgroundColor: selectedCategory?.type === "isovideos" ? primaryColor : secondaryColor,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setShowIsoModal(true)}
            >
              <Text
                style={{
                  color: selectedCategory?.type === "isovideos" ? secondaryColor : primaryColor,
                  fontSize: responsive.fontSize(14),
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                ISO
              </Text>
            </TouchableOpacity>
          </View>


          {/* Video List */}
          <View style={{ paddingHorizontal: responsive.padding(10), flex: 1, marginTop: responsive.padding(15) }}>
            {loading ? (
              <ActivityIndicator size="large" color={primaryColor} />
            ) : error ? (
              <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
            ) : (
              <FlatList
                showsVerticalScrollIndicator={false}
                data={videos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: "/screens/VideoDetails",
                        params: { video_id: item.id },
                      })
                    }
                    style={styles.videoCardView}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: responsive.height(200),
                        borderRadius: responsive.borderRadius(10),
                        overflow: "hidden",
                        marginBottom: responsive.margin(10),
                      }}
                    >
                      <Image
                        source={{ uri: item.video_thumbnail }}
                        style={styles.videoThumbnail}
                        resizeMode="contain"
                      />
                    </View>

                    <Text
                      style={{
                        fontSize: responsive.fontSize(16),
                        fontWeight: "bold",
                        marginBottom: responsive.margin(5),
                      }}
                    >
                      Key Points
                    </Text>

                    <View style={{ paddingHorizontal: 10 }}>
                      {item.description
                        .replace(/<[^>]+>/g, "")
                        .split(/[\n•-]/)
                        .map((point, index) => {
                          const trimmed = point.trim();
                          if (!trimmed) return null;
                          return (
                            <View
                              key={index}
                              style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                marginBottom: 4,
                              }}
                            >
                              <Text style={{ fontSize: 14, lineHeight: 20 }}>
                                •{" "}
                              </Text>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  lineHeight: 20,
                                }}
                              >
                                {trimmed}
                              </Text>
                            </View>
                          );
                        })}
                    </View>

                    <View style={styles.assignedDateViewColumn}>
                      {item.is_completed === 0 ? (
                        <>
                          <Text style={styles.assignedDateText}>
                            Assigned: {formatSmartDate(item.assign_date)}
                          </Text>
                          <Text style={styles.assignedDateText}>
                            Not completed ❌
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.assignedDateText}>
                          Completed: {formatSmartDate(item.completed_date)} ✅
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                onEndReached={loadMoreVideos}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingMore ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : null
                }
              />
            )}
          </View>

          {/* Certificate Download Dropdown */}
          {showDropdown && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Download Certificate</Text>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => downloadCertificate("Toolbox")}
                  disabled={downloading}
                >
                  <Text style={styles.modalOptionText}>Tool Box</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => downloadCertificate("isovideos")}
                  disabled={downloading}
                >
                  <Text style={styles.modalOptionText}>ISO 9001</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowDropdown(false)}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ISO Categories Modal */}
          {showIsoModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select ISO Category</Text>

                {isoCategories.map((isoCategory) => (
                  <TouchableOpacity
                    key={isoCategory.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedCategory(isoCategory);
                      setShowIsoModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{isoCategory.name}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => setShowIsoModal(false)}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Video Modal */}
        <Modal visible={videoModalVisible} transparent animationType="fade">
          <View style={styles.videoModalOverlay}>
            <View style={styles.videoModalContent}>
              <WebView
                source={{ uri: vimeoUrl }}
                style={{ flex: 1 }}
                javaScriptEnabled
                allowsFullscreenVideo
              />
            </View>
            <TouchableOpacity
              onPress={() => setVideoModalVisible(false)}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#033337",
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
  buttonView: {
    paddingHorizontal: responsive.padding(10),
    paddingTop: responsive.padding(10),
    flexDirection: "row",
    width: "100%",
    gap: 10,
    flexWrap: "wrap",
  },
  viewTutorialsButtonView: {
    backgroundColor: "#033337",
    flex: 0.5,
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(7),
    alignItems: "center",
    justifyContent: "center",
  },
  viewTutorialsButtonText: {
    color: "#F9BC11",
    fontSize: responsive.fontSize(14),
    fontWeight: "500",
  },
  certificateDownloadButtonView: {
    backgroundColor: "#cccccc",
    flex: 0.5,
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(7),
    alignItems: "center",
    justifyContent: "center",
  },
  certificateDownloadButtonText: {
    fontSize: responsive.fontSize(14),
    fontWeight: "500",
  },
  buttonBase: {
    flex: 0.5,
    padding: responsive.padding(15),
    borderRadius: responsive.borderRadius(7),
    alignItems: "center",
    justifyContent: "center",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: responsive.padding(20),
    borderRadius: responsive.borderRadius(10),
    elevation: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: responsive.fontSize(18),
    fontWeight: "600",
    marginBottom: responsive.margin(15),
  },

  modalOption: {
    backgroundColor: "#F9BC11",
    paddingVertical: responsive.padding(10),
    paddingHorizontal: responsive.padding(25),
    borderRadius: responsive.borderRadius(5),
    marginVertical: responsive.margin(5),
    width: "100%",
    alignItems: "center",
  },

  modalOptionText: {
    fontSize: responsive.fontSize(16),
    fontWeight: "500",
    color: "#033337",
  },

  modalCancel: {
    marginTop: responsive.margin(20),
  },

  modalCancelText: {
    fontSize: responsive.fontSize(14),
    color: "#666",
  },
  videoCardView: {
    marginBottom: responsive.margin(20),
    padding: responsive.padding(10),
    borderRadius: responsive.borderRadius(10),
    backgroundColor: "#f1f1f1",
    shadowColor: "#000",
  },
  assignedDateViewColumn: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: responsive.margin(10),
    paddingTop: responsive.padding(5),
  },
  assignedDateText: {
    fontWeight: "500",
    fontSize: responsive.fontSize(12),
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalContent: {
    width: width * 0.9,
    height: width * 0.55,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    padding: responsive.padding(10),
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 30,
    padding: responsive.padding(10),
    backgroundColor: "#000",
    borderRadius: responsive.borderRadius(30),
  },
  closeModalText: {
    color: "#fff",
    fontSize: responsive.fontSize(20),
  },
});

export default MyVideos;
