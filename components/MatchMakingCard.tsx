// components/MatchMakingCard.tsx
import React from "react";
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
