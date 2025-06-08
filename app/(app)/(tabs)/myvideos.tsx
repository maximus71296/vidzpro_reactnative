import responsive from "@/responsive";
import {
  getVideoCategories,
  getVideosByCategory,
  VideoCategory,
} from "@/services/api";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define type for videos
type VideoItem = {
  id: number;
  video_title: string;
  video_thumbnail: string;
  video_url: string;
  description: string;
  is_completed: number;
};

const MyVideos: React.FC = () => {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const primaryColor = "#033337";
  const secondaryColor = "#F9BC11";

  const fetchCategories = async () => {
    try {
      const response = await getVideoCategories();
      if (response.status === "1") {
        setCategories(response.data);
        setSelectedCategory(response.data[0]);
        setMessage(response.message);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchVideos = async (categoryName: string) => {
    console.log("📦 Sending category NAME to fetch videos:", categoryName);
    setLoading(true);
    setError("");
    try {
      const response = await getVideosByCategory(categoryName);
      if (response.status === "1" && response.data?.data?.length > 0) {
        setVideos(response.data.data);
      } else {
        setVideos([]);
        setError("No videos found.");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchVideos(selectedCategory.name);
    }
  }, [selectedCategory]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}> 
      <View style={styles.header}>
        <Text style={styles.headingText}>My Videos</Text>
      </View>

      {/* View Tutorials & Certificate */}
      <View style={styles.buttonView}>
        <TouchableOpacity style={styles.viewTutorialsButtonView} activeOpacity={0.7}>
          <Text style={styles.viewTutorialsButtonText}>View Tutorials</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.certificateDownloadButtonView}
          activeOpacity={0.7}
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
      <View style={{ padding: 16 }}>
        {message && (
          <Text
            style={{
              fontSize: 16,
              marginBottom: 8,
              color: "#222",
              fontWeight: "600",
            }}
          >
            📢 {message}
          </Text>
        )}
      </View>

      {/* Video List */}
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={primaryColor} />
        ) : error ? (
          <Text style={{ color: "red", fontSize: 16 }}>{error}</Text>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {item.video_title}
                </Text>
                <Text numberOfLines={2}>
                  {item.description.replace(/<[^>]+>/g, "")}
                </Text>
                <View style={{ height: 10 }} />
                <View
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{ uri: item.video_thumbnail }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    alignItems: "center",
    gap: 20,
    backgroundColor: "#033337",
    paddingVertical: responsive.padding(15),
    paddingHorizontal: responsive.padding(15),
    flexDirection: "row",
  },
  headingText: {
    color: "#fff",
    fontSize: responsive.fontSize(18),
    fontFamily: "NotoSansSemiBold",
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
});

export default MyVideos;
