import responsive from "@/responsive";
import {
  generateCertificate,
  getVideoCategories,
  getVideosByCategory,
  VideoCategory,
} from "@/services/api";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ More reliable
import Toast from "react-native-toast-message";

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

  const primaryColor = "#F9BC11";
  const secondaryColor = "#033337";

  // Fetch video categories from API
  const fetchCategories = async () => {
    try {
      const response = await getVideoCategories();
      if (response.status === "1") {
        setCategories(response.data);
        setSelectedCategory(response.data[0]);
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
  const fetchVideos = async (categoryName: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await getVideosByCategory(categoryName);
      if (response.status === "1" && response.data?.data?.length > 0) {
        setVideos(response.data.data);
      } else {
        setVideos([]);
        setError("No videos found for this category.");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos.");
    } finally {
      setLoading(false);
    }
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
      console.log("📩 generateCertificate response:", res);

      if (res.status === 0) {
        Toast.show({
          type: "info",
          text1: "No Certificates",
          text2: res.message,
        });
        setDownloading(false);
        setShowDropdown(false);
        return;
      }

      if (res.status === 1 && res.file_url) {
        const filename =
          res.file_url.split("/").pop() ?? `certificate_${type}.pdf`;
        const docDir = FileSystem.documentDirectory;

        if (!docDir) throw new Error("FileSystem.documentDirectory is null");

        const fileUri = docDir + filename;
        console.log("⬇️ Downloading file to:", fileUri);

        const downloadResumable = FileSystem.createDownloadResumable(
          res.file_url,
          fileUri
        );

        const downloadResult = await downloadResumable.downloadAsync();
        console.log("✅ Download result:", downloadResult);

        Toast.show({
          type: "success",
          text1: "Download Complete",
          text2: `Certificate downloaded for ${
            type === "toolbox" ? "Tool Box" : "ISO 9001"
          }`,
        });
      } else {
        console.log(
          "❌ Certificate generation failed or file_url missing:",
          res
        );
        throw new Error("Certificate generation failed or file_url missing.");
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#033337" />
      <SafeAreaView style={styles.container}>
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

        {/* Category Tabs */}
        <View style={styles.buttonView}>
          {categories.map((cat) => {
            const isActive = selectedCategory?.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.buttonBase,
                  { backgroundColor: isActive ? primaryColor : secondaryColor },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: isActive ? secondaryColor : primaryColor,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show API Message and Category Details */}
        <View style={{ padding: 10 }}></View>

        {/* Video List */}
        <View style={{ paddingHorizontal: 20, flex: 1 }}>
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
                <View style={styles.videoCardView}>
                  {/* THUMBNAIL FIRST */}
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
                      resizeMode="cover"
                    />
                  </View>

                  {/* TITLE */}
                  <Text
                    style={{
                      fontSize: responsive.fontSize(16),
                      fontWeight: "bold",
                      marginBottom: responsive.margin(5),
                    }}
                  >
                    {item.video_title}
                  </Text>

                  {/* DESCRIPTION */}
                  <View style={{ paddingHorizontal: 10 }}>
                    {item.description
                      .replace(/<[^>]+>/g, "") // Remove HTML tags
                      .split(/[\n•-]/) // Split on newline or bullet-like characters
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
                              style={{ flex: 1, fontSize: 14, lineHeight: 20 }}
                            >
                              {trimmed}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                  <View style={styles.assignedDateView}>
                    <Text style={styles.assignedDateText}>
                      Assigned: {formatSmartDate(item.assign_date)}
                    </Text>

                    {item.is_completed === 0 ? (
                      <Text style={styles.assignedDateText}>
                        Not completed ❌
                      </Text>
                    ) : (
                      <Text style={styles.assignedDateText}>
                        Completed: {formatSmartDate(item.completed_date)} ✅
                      </Text>
                    )}
                  </View>
                </View>
              )}
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
      </SafeAreaView>
    </>
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
    flexGrow: 1,
    padding: 15,
    borderRadius: 7,
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
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },

  modalOption: {
    backgroundColor: "#F9BC11",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },

  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#033337",
  },

  modalCancel: {
    marginTop: 10,
  },

  modalCancelText: {
    fontSize: 14,
    color: "#666",
  },
  videoCardView: {
    marginBottom: responsive.margin(20),
    padding: responsive.padding(10),
    borderRadius: responsive.borderRadius(10),
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedDateView: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: responsive.margin(10),
    paddingTop: responsive.padding(5),
  },
  assignedDateText: {
    fontWeight: "500",
    fontSize: responsive.fontSize(12),
  },
});

export default MyVideos;
