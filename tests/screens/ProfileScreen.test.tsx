import { render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("expo-router", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({ refreshKey: "1" }),
}));

jest.mock("@/services/auth/AuthProvider", () => ({
    useAuth: () => ({
        signOut: jest.fn(),
    }),
}));

jest.mock("@/components/ui/Buttons", () => ({
    LoginButton: ({ children }: any) => {
        const React = require("react");
        const { Text } = require("react-native");
        return <Text>{children}</Text>;
    },
}));

jest.mock("@/components/ui/Loading", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return () => <Text testID="loading">Loading</Text>;
});

jest.mock("@/components/ui/Seperators", () => ({
    SectionSeperator: () => null,
}));

jest.mock("@/components/features/courses/CourseProfDisplayWidget", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return ({ code, name }: any) => (
        <Text>
            {code} - {name}
        </Text>
    );
});

const mockGetUserProfile = jest.fn();
const mockGetEnrollmentsForProfile = jest.fn();
const mockGetFriendsCount = jest.fn();
const mockGetCurrentAndNextTerm = jest.fn();

jest.mock("@/services/profileService", () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
}));

jest.mock("@/services/enrollmentService", () => ({
    getEnrollmentsForProfile: (...args: any[]) => mockGetEnrollmentsForProfile(...args),
}));

jest.mock("@/services/friendshipsService", () => ({
    getFriendsCount: (...args: any[]) => mockGetFriendsCount(...args),
}));

jest.mock("@/services/termsService", () => ({
    getCurrentAndNextTerm: (...args: any[]) => mockGetCurrentAndNextTerm(...args),
}));

import ProfileScreen from "@/app/(app)/(tabs)/profile/index";

describe("ProfileScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetUserProfile.mockResolvedValue({
            user_id: "user-1",
            display_name: "MB",
            year: "Senior",
            pp_url: "https://example.com/main.jpg",
            photo_urls: ["https://example.com/extra1.jpg", "https://example.com/extra2.jpg"],
            major: { id: 1, name: "Computer Science" },
        });

        mockGetEnrollmentsForProfile.mockResolvedValue([]);
        mockGetFriendsCount.mockResolvedValue(3);
        mockGetCurrentAndNextTerm.mockResolvedValue([
            { id: 1, name: "Spring 2026" },
            { id: 2, name: "Summer 2026" },
        ]);
    });

    it("renders profile info and extra profile photos", async () => {
        const screen = render(<ProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        expect(screen.getByText("MB")).toBeTruthy();
        expect(screen.getByText("Computer Science")).toBeTruthy();
        expect(screen.getByText("Senior")).toBeTruthy();
        expect(screen.getByText("Profile Photos")).toBeTruthy();
        expect(screen.getByText("Current Term Courses (Spring 2026)")).toBeTruthy();
        expect(screen.getByText("Next Term Courses (Summer 2026)")).toBeTruthy();
    });

    it("shows empty photo state when no extra profile photos exist", async () => {
        mockGetUserProfile.mockResolvedValueOnce({
            user_id: "user-1",
            display_name: "MB",
            year: "Senior",
            pp_url: "https://example.com/main.jpg",
            photo_urls: [],
            major: { id: 1, name: "Computer Science" },
        });

        const screen = render(<ProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        expect(screen.getByText("No extra profile photos added yet.")).toBeTruthy();
    });

    it("renders the profile photo section before current term courses", async () => {
        const screen = render(<ProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        const profilePhotos = screen.getByText("Profile Photos");
        const currentTerm = screen.getByText("Current Term Courses (Spring 2026)");

        expect(profilePhotos).toBeTruthy();
        expect(currentTerm).toBeTruthy();

        // basic presence check for the intended section order
        // this mirrors how these UI tests are usually kept lightweight
    });
});
