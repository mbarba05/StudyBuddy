/*
import React, { useEffect, useState } from "react";
// Core React Native components used for layout, text, and images
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
// Provides device-safe padding (prevents overlap with status bar or notches)
import { SafeAreaView } from "react-native-safe-area-context";
// The Tinder-like swipe card library
import TinderCard from "react-tinder-card";
// Hook to get the currently logged-in user from the authentication context
import { useAuth } from "@/services/auth/AuthProvider";
import { getAllProfiles } from "@/services/profileService";
//import Deque from 'collections/deque';
// Function to fetch all user profiles from Supabase + the Profile type definition

// Get the screen width of the device (used for responsive card sizing)
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function MatchmakingScreen() {
  // Access the current authenticated user
  const { user } = useAuth();

  // Store all profiles retrieved from Supabase
  const [profiles, setProfiles] = useState([]);
  const [shownProfile, setShownProfile] = useState([]);
  // Boolean to show a loading spinner while profiles are being fetched
  const [loading, setLoading] = useState(true);

  // useEffect runs once when the component mounts or when `user` changes
  useEffect(() => {
    // Asynchronous function to fetch all user profiles
    const loadProfiles = async () => {
      try {
        // Retrieve all profiles from Supabase
        const allProfiles = await getAllProfiles();

        console.log("All profiles fetched:", allProfiles);

        // Filter out the currently logged-in user's own profile
        setProfiles(allProfiles);
        setShownProfile(allProfiles[0]);
        //setProfiles({"display_name": "MB", "major": {"name": "Computer Science"}, "pp_url": null, "user_id": "d154b2f9-2412-4765-b28f-d23a083ce943", "year": "Senior"})
        console.log("Profiles loaded:", profiles);
      } catch (err) {
        // Log any network or database errors
        console.error("Error loading profiles:", err);
      } finally {
        // Stop showing the loading spinner
        setLoading(false);
      }
    };
    // Call the profile loading function
    loadProfiles();
  }, [user]); // Re-run this effect if the user changes

  // Display a spinner while waiting for Supabase data
  if (loading)
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text className="text-white mt-3">Loading profiles...</Text>
      </SafeAreaView>
    );

  // Display a message if there are no profiles to show
  if (profiles.length === 0)
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
        <Text className="text-white text-lg">No profiles available</Text>
      </SafeAreaView>
    );

  // Function that runs when a user swipes left or right on a card
  const swiped = (direction: string, name: string) => {
    if (direction === "right") console.log(`You liked ${name}`);
    if (direction === "left") console.log(`You skipped ${name}`);
    setProfiles((prev) => prev.shift());
    setShownProfile(profiles[0]);
  };
  // Display stack of swipeable cards for each user profile
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
      {/* Map over all profiles to create individual TinderCards */
        /*
        <TinderCard
          key={shownProfile.user_id} // Unique key for each user
          onSwipe={(dir) => swiped(dir, shownProfile.display_name)} // Handle swipe direction
          preventSwipe={["up", "down"]} // Disable vertical swiping
        >
          <View><Text>{shownProfile.display_name}</Text></View>
        </TinderCard>
    </SafeAreaView>
  );
}
  */
 /** 
  * Matchmaking Screen
  * Tinder-like swipe interface for connecting with other users.
  * Fetches user profiles from Supabase and allows swiping left/right. (except users)
  * Shows one profile at a time
  * Sends friend requests on right swipe (sends friend request to Supabase pending)
  * On left swipe, skips the profile.
  * Rewind button to go back to the last swiped profile.
  */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TinderCard from "react-tinder-card";
import { useAuth } from "@/services/auth/AuthProvider";
import { getAllProfiles } from "@/services/profileService";
import { recordSwipe, getSwipedUserIds } from "@/services/swipeService";
// Get the screen width of the device (used for responsive card sizing)
const SCREEN_WIDTH = Dimensions.get("window").width;
// MatchmakingScreen component
export default function MatchmakingScreen() {
    // Access the current authenticated user
  const { user } = useAuth();
    // Store all profiles retrieved from Supabase and filter user out
  const [profiles, setProfiles] = useState<any[]>([]);
    // Boolean to show a loading spinner while profiles are being fetched
  const [loading, setLoading] = useState(true);

  //Fetch all profiles that haven't been swiped on yet
  useEffect(() => {
    // Asynchronous function to fetch all user profiles
    const loadProfiles = async () => {
        // Try-catch block to handle potential errors
      try {
        // Ensure user is logged in
        if (!user?.id) return;

        // Fetch all profiles from Supabase
        const allProfiles = await getAllProfiles();

        // Get list of already-swiped users
        const swipedIds = await getSwipedUserIds(user.id);

        // Filter out the current user + anyone swiped on before
        const availableProfiles = allProfiles.filter(
          (p: any) => p.user_id !== user.id && !swipedIds.includes(p.user_id)
        );
        // Update state with available profiles
        setProfiles(availableProfiles);
        // Log loaded profiles for debugging
        console.log("Profiles loaded:", availableProfiles);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [user]);

  
   //Handle a swipe left/right action. Records swipe in Supabase. Removes profile from local deck.
   
  const handleSwipe = async (direction: string, targetProfile: any) => {
    // Log the swipe action
    console.log(`Swiped ${direction} on ${targetProfile.display_name}`);
    // Record the swipe in Supabase
    if (direction === "left" || direction === "right") {
      await recordSwipe(user.id, targetProfile.user_id, direction as "left" | "right");
    }

    // Remove current profile from stack
    setProfiles((prev) => prev.filter((p) => p.user_id !== targetProfile.user_id));
  };

  // Loading spinner while fetching data
  if (loading)
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text className="text-white mt-3">Loading profiles...</Text>
      </SafeAreaView>
    );

  
   // Empty state when no more profiles left
   
  if (profiles.length === 0)
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
        <Text className="text-white text-lg">No profiles available</Text>
      </SafeAreaView>
    );

  
   // Current top profile to display
   
  const currentProfile = profiles[0];

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-colors-background">
        {/* TinderCard for swipeable profile card (change after teammate finishes) */}
      <TinderCard
      // Unique key for the profile
        key={currentProfile.user_id}
        // Handle swipe action
        onSwipe={(dir) => handleSwipe(dir, currentProfile)}
        // Disable vertical swiping
        preventSwipe={["up", "down"]}
      >
        {/* Profile card layout */}
        <View
          className="bg-white rounded-3xl shadow-lg p-4 items-center"
          style={{
            width: SCREEN_WIDTH * 0.9,
            height: SCREEN_WIDTH * 1.2,
            alignSelf: "center",
          }}
        >
            {/* Profile picture and details */}
          <Image
            source={{
              uri:
                currentProfile.pp_url || "https://placehold.co/300x300?text=No+Image",
            }}
            className="w-72 h-72 rounded-3xl mb-4"
          />
          <Text className="text-2xl font-bold text-black mb-2">
            {currentProfile.display_name}
          </Text>
          <Text className="text-lg text-gray-600 mb-1">
            {currentProfile.major?.name}
          </Text>
          <Text className="text-md text-gray-500">{currentProfile.year}</Text>
        </View>
      </TinderCard>
    </SafeAreaView>
  );
}