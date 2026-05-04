import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import FriendsListScreen from "@/app/(app)/(tabs)/profile/friendsList";
import { getAllFriends, getFriendsByInteraction, removeFriend } from "@/services/friendshipsService";

const mockGetAllFriends = getAllFriends as jest.Mock;
const mockGetFriendsByInteraction = getFriendsByInteraction as jest.Mock;
const mockRemoveFriend = removeFriend as jest.Mock;

jest.mock("@/services/friendshipsService", () => ({
    getAllFriends: jest.fn(),
    getFriendsByInteraction: jest.fn(),
    removeFriend: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
    Ionicons: ({ name }: any) => name,
}));

jest.mock("@/components/ui/TextInputs", () => {
    const React = require("react");
    const { TextInput } = require("react-native");

    return {
        SearchBar: ({ value, onChangeText, placeholder }: any) => (
            <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />
        ),
    };
});

describe("FriendsListScreen", () => {
    const allFriends = [
        {
            friend_id: "1",
            full_name: "Carlos Briceno",
            avatar_url: null,
            major: "Computer Science",
            year: "Sophomore",
            interactionCount: 6,
        },
        {
            friend_id: "2",
            full_name: "Nicholas",
            avatar_url: null,
            major: "Computer Science",
            year: "Junior",
            interactionCount: 2,
        },
        {
            friend_id: "3",
            full_name: "eli sanchez",
            avatar_url: null,
            major: "Africana Studies",
            year: "Freshman",
            interactionCount: 1,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetAllFriends.mockResolvedValue(allFriends);
        mockGetFriendsByInteraction.mockImplementation(async (mode: "most" | "least") => {
            if (mode === "most") {
                return [
                    { ...allFriends[0], interactionCount: 6 },
                    { ...allFriends[1], interactionCount: 2 },
                    { ...allFriends[2], interactionCount: 1 },
                ];
            }

            return [
                { ...allFriends[2], interactionCount: 1 },
                { ...allFriends[1], interactionCount: 2 },
                { ...allFriends[0], interactionCount: 6 },
            ];
        });
        mockRemoveFriend.mockResolvedValue(undefined);
    });

    it("renders friends from getAllFriends on initial load", async () => {
        const { getByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(mockGetAllFriends).toHaveBeenCalledTimes(1);
        });

        expect(getByText("Carlos Briceno")).toBeTruthy();
        expect(getByText("Nicholas")).toBeTruthy();
        expect(getByText("eli sanchez")).toBeTruthy();
    });

    it("filters the friends list by search text", async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(getByText("Carlos Briceno")).toBeTruthy();
        });

        fireEvent.changeText(getByPlaceholderText("Search Friends"), "nich");

        expect(getByText("Nicholas")).toBeTruthy();
        expect(queryByText("Carlos Briceno")).toBeNull();
        expect(queryByText("eli sanchez")).toBeNull();
    });

    it('pressing "Most Interacted With" loads most interacted friends', async () => {
        const { getByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(mockGetAllFriends).toHaveBeenCalled();
        });

        fireEvent.press(getByText("Most Interacted With"));

        await waitFor(() => {
            expect(mockGetFriendsByInteraction).toHaveBeenCalledWith("most");
        });

        expect(getByText("Carlos Briceno")).toBeTruthy();
        expect(getByText("Nicholas")).toBeTruthy();
        expect(getByText("eli sanchez")).toBeTruthy();
    });

    it('pressing "Least Interacted With" loads least interacted friends', async () => {
        const { getByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(mockGetAllFriends).toHaveBeenCalled();
        });

        fireEvent.press(getByText("Least Interacted With"));

        await waitFor(() => {
            expect(mockGetFriendsByInteraction).toHaveBeenCalledWith("least");
        });

        expect(getByText("eli sanchez")).toBeTruthy();
        expect(getByText("Nicholas")).toBeTruthy();
        expect(getByText("Carlos Briceno")).toBeTruthy();
    });

    it('pressing "Clear" reloads the full friends list', async () => {
        const { getByText, queryByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(mockGetAllFriends).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(getByText("Most Interacted With"));

        await waitFor(() => {
            expect(mockGetFriendsByInteraction).toHaveBeenCalledWith("most");
        });

        expect(getByText("Clear")).toBeTruthy();

        fireEvent.press(getByText("Clear"));

        await waitFor(() => {
            expect(mockGetAllFriends).toHaveBeenCalledTimes(2);
        });

        expect(queryByText("Carlos Briceno")).toBeTruthy();
        expect(queryByText("Nicholas")).toBeTruthy();
        expect(queryByText("eli sanchez")).toBeTruthy();
    });

    it("shows the empty state when the user has no friends", async () => {
        mockGetAllFriends.mockResolvedValueOnce([]);

        const { getByText } = render(<FriendsListScreen />);

        await waitFor(() => {
            expect(getByText("You have no friends yet.")).toBeTruthy();
        });
    });
});
