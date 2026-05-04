import React from "react";
import { Alert } from "react-native";
import { render, waitFor, fireEvent } from "@testing-library/react-native";

import BlockedUsersScreen from "@/app/(app)/(tabs)/profile/blocked-users";

const mockGetBlockedUsers = jest.fn();
const mockUnblockUser = jest.fn();

jest.mock("@/services/profileService", () => ({
    getBlockedUsers: (...args: any[]) => mockGetBlockedUsers(...args),
    unblockUser: (...args: any[]) => mockUnblockUser(...args),
}));

jest.mock("@/assets/colors", () => ({
    colors: {
        background: "#000",
        text: "#fff",
        textSecondary: "#aaa",
        primary: "#007AFF",
    },
}));

jest.mock("@/components/ui/Loading", () => ({
    LoadingScreen: () => null,
}));

jest.mock("@expo/vector-icons", () => ({
    Ionicons: () => null,
}));

describe("BlockedUsersScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("loads and displays blocked users", async () => {
        mockGetBlockedUsers.mockResolvedValueOnce([
            {
                user_id: "user-1",
                display_name: "Carlos",
                major: { id: 1, name: "Computer Science" },
                year: "Senior",
                pp_url: null,
                photo_urls: [],
                bio: null,
            },
        ]);

        const { getByText } = render(<BlockedUsersScreen />);

        await waitFor(() => {
            expect(getByText("Blocked Users")).toBeTruthy();
            expect(getByText("Carlos")).toBeTruthy();
            expect(getByText("Computer Science • Senior")).toBeTruthy();
        });
    });

    it("shows empty message when there are no blocked users", async () => {
        mockGetBlockedUsers.mockResolvedValueOnce([]);

        const { getByText } = render(<BlockedUsersScreen />);

        await waitFor(() => {
            expect(getByText("No blocked users.")).toBeTruthy();
        });
    });

    it("opens confirmation alert when unblock is pressed", async () => {
        jest.spyOn(Alert, "alert");

        mockGetBlockedUsers.mockResolvedValueOnce([
            {
                user_id: "user-1",
                display_name: "Carlos",
                major: { id: 1, name: "Computer Science" },
                year: "Senior",
                pp_url: null,
                photo_urls: [],
                bio: null,
            },
        ]);

        const { getByText } = render(<BlockedUsersScreen />);

        await waitFor(() => {
            expect(getByText("Unblock")).toBeTruthy();
        });

        fireEvent.press(getByText("Unblock"));

        expect(Alert.alert).toHaveBeenCalledWith(
            "Unblock User",
            "Unblock Carlos?",
            expect.any(Array)
        );
    });

    it("removes user from list after confirming unblock", async () => {
        jest.spyOn(Alert, "alert").mockImplementation(
            (_title, _message, buttons: any) => {
                buttons[1].onPress();
            }
        );

        mockGetBlockedUsers.mockResolvedValueOnce([
            {
                user_id: "user-1",
                display_name: "Carlos",
                major: { id: 1, name: "Computer Science" },
                year: "Senior",
                pp_url: null,
                photo_urls: [],
                bio: null,
            },
        ]);

        mockUnblockUser.mockResolvedValueOnce(undefined);

        const { getByText, queryByText } = render(<BlockedUsersScreen />);

        await waitFor(() => {
            expect(getByText("Carlos")).toBeTruthy();
        });

        fireEvent.press(getByText("Unblock"));

        await waitFor(() => {
            expect(mockUnblockUser).toHaveBeenCalledWith("user-1");
            expect(queryByText("Carlos")).toBeNull();
        });
    });
});
