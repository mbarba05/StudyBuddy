// components/MatchMakingCard.tsx
/*import React from "react";
import { View, Text, Image } from "react-native";

type MatchMakingCardProps = {
  name: string;
  major?: string;
  year?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
};

export default function MatchMakingCard({
  name,
  major,
  year,
  imageUrl,
  width = 320,
  height = 420,
}: MatchMakingCardProps) {
  return (
    <View
      className="bg-white rounded-3xl shadow-lg p-4 items-center"
      style={{ width, height }}
    >
      <Image
        source={{
          uri: imageUrl || "https://placehold.co/300x300?text=No+Image",
        }}
        className="w-72 h-72 rounded-3xl mb-4"
      />
      <Text className="text-2xl font-bold text-black mb-2">{name}</Text>
      {major ? (
        <Text className="text-lg text-gray-600 mb-1">{major}</Text>
      ) : null}
      {year ? <Text className="text-md text-gray-500">{year}</Text> : null}
    </View>
  );
}
*/
import { colors } from "@/assets/colors";
import supabase from "@/lib/subapase";
import { useAuth } from "@/services/auth/AuthProvider";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type MatchMakingCardProps = {
  name: string;
  major?: string; // string already coming from matchmaking.tsx
  year?: string;
  imageUrl?: string;
};

export default function MatchMakingCard({
  name,
  major,
  year,
  imageUrl,
}: MatchMakingCardProps) {
  const { user } = useAuth();
  const [userMajor, setUserMajor] = useState<string | null>(null);

  // Fetch logged-in user's major from Supabase
  useEffect(() => {
    const loadUserMajor = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("major:major_id(name)")
        .eq("user_id", user.id)
        .single();

      if (data?.major?.name) {
        setUserMajor(data.major.name);
      }
    };

    loadUserMajor();
  }, [user]);

  // compare lowercase so “Computer Science” matches “computer science”
  const isSameMajor =
    major &&
    userMajor &&
    major.trim().toLowerCase() === userMajor.trim().toLowerCase();

  return (
    <View style={styles.card}>
      <ImageBackground
        source={{
          uri: imageUrl || "https://placehold.co/400x400?text=No+Image",
        }}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay}>
          <Text style={styles.name}>{name}</Text>

          {/* Highlight if major matches user */}
          {major ? (
            <Text
              style={[
                styles.subText,
                isSameMajor ? styles.highlightMajor : null,
              ]}
            >
              {major}
            </Text>
          ) : null}

          {year ? <Text style={styles.subText}>{year}</Text> : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width * 0.95,
    height: height * 0.8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,

    marginTop: -100,
  },
  image: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imageStyle: {
    resizeMode: "cover",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "bold",
  },
  subText: {
    color: colors.textSecondary,
    fontSize: 17,
  },

  // Highlight matching major
  highlightMajor: {
    color: colors.accent,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});