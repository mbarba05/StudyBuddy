import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
    useRouter: () => ({
        replace: mockReplace,
        back: mockBack,
    }),
}));

jest.mock("@/components/ui/LoadingScreen", () => {
    const React = require("react");
    const { Text } = require("react-native");
    return () => <Text testID="loading">Loading</Text>;
});

jest.mock("@/components/ui/Buttons", () => ({
    LoginButton: ({ children, onPress }: any) => {
        const React = require("react");
        const { TouchableOpacity, Text } = require("react-native");
        return (
            <TouchableOpacity onPress={onPress}>
                <Text>{children}</Text>
            </TouchableOpacity>
        );
    },
}));

jest.mock("@/components/ui/TextInputs", () => ({
    LoginInput: ({ value, onChangeText, placeholder }: any) => {
        const React = require("react");
        const { TextInput } = require("react-native");
        return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />;
    },
}));

jest.mock("@/components/features/courses/CourseSearchModal", () => {
    return () => null;
});

jest.mock("react-native-dropdown-picker", () => {
    const React = require("react");
    const { View } = require("react-native");
    return () => <View />;
});

const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: (...args: any[]) => mockRequestMediaLibraryPermissionsAsync(...args),
    launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
    MediaTypeOptions: {
        Images: "Images",
    },
}));

const mockGetUserProfile = jest.fn();
const mockEditProfile = jest.fn();
const mockGetAllMajorsForDropdown = jest.fn();
const mockGetEnrollmentsForProfile = jest.fn();
const mockGetCurrentAndNextTerm = jest.fn();
const mockCreateEnrollments = jest.fn();
const mockDeleteEnrollments = jest.fn();

jest.mock("@/services/profileService", () => ({
    getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
    editProfile: (...args: any[]) => mockEditProfile(...args),
}));

jest.mock("@/services/majorsService", () => ({
    getAllMajorsForDropdown: (...args: any[]) => mockGetAllMajorsForDropdown(...args),
}));

jest.mock("@/services/enrollmentService", () => ({
    getEnrollmentsForProfile: (...args: any[]) => mockGetEnrollmentsForProfile(...args),
    createEnrollments: (...args: any[]) => mockCreateEnrollments(...args),
    deleteEnrollments: (...args: any[]) => mockDeleteEnrollments(...args),
}));

jest.mock("@/services/termsService", () => ({
    getCurrentAndNextTerm: (...args: any[]) => mockGetCurrentAndNextTerm(...args),
}));

import EditProfileScreen from "@/app/(app)/(tabs)/profile/edit";

describe("EditProfileScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetAllMajorsForDropdown.mockResolvedValue([{ label: "Computer Science", value: 1 }]);

        mockGetUserProfile.mockResolvedValue({
            user_id: "user-1",
            display_name: "MB",
            year: "Senior",
            pp_url: "https://example.com/main.jpg",
            photo_urls: ["https://example.com/extra1.jpg"],
            major: { id: 1, name: "Computer Science" },
        });

        mockGetEnrollmentsForProfile.mockResolvedValue([]);
        mockGetCurrentAndNextTerm.mockResolvedValue([
            { id: 1, name: "Spring 2026" },
            { id: 2, name: "Summer 2026" },
        ]);

        mockEditProfile.mockResolvedValue({});
        mockCreateEnrollments.mockResolvedValue({});
        mockDeleteEnrollments.mockResolvedValue({});
    });

    it("loads existing extra profile photos from the user profile", async () => {
        const screen = render(<EditProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        expect(screen.getByText("Extra Profile Photos")).toBeTruthy();
        expect(screen.getByText("Save")).toBeTruthy();
    });

    it("adds extra photos from image picker", async () => {
        mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
        mockLaunchImageLibraryAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: "blob:http://localhost:8081/photo1" }, { uri: "blob:http://localhost:8081/photo2" }],
        });

        const screen = render(<EditProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        fireEvent.press(screen.getByTestId("add-extra-photos-button"));

        await waitFor(() => {
            expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
        });
    });

    it("calls editProfile with photo_urls when saving", async () => {
        const screen = render(<EditProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        fireEvent.press(screen.getByText("Save"));

        await waitFor(() => {
            expect(mockEditProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    display_name: "MB",
                    year: "Senior",
                    pp_url: "https://example.com/main.jpg",
                    photo_urls: ["https://example.com/extra1.jpg"],
                }),
            );
        });
    });

    it("removes an extra photo before saving", async () => {
        const screen = render(<EditProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        fireEvent.press(screen.getByTestId("remove-extra-photo-0"));
        fireEvent.press(screen.getByText("Save"));

        await waitFor(() => {
            expect(mockEditProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    photo_urls: [],
                }),
            );
        });
    });

    it("saves multiple newly selected extra photos", async () => {
        mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
        mockLaunchImageLibraryAsync.mockResolvedValue({
            canceled: false,
            assets: [{ uri: "blob:http://localhost:8081/photo1" }, { uri: "blob:http://localhost:8081/photo2" }],
        });

        const screen = render(<EditProfileScreen />);

        await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull());

        fireEvent.press(screen.getByTestId("add-extra-photos-button"));

        await waitFor(() => {
            expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
        });

        fireEvent.press(screen.getByText("Save"));

        await waitFor(() => {
            expect(mockEditProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    photo_urls: expect.arrayContaining([
                        "https://example.com/extra1.jpg",
                        "blob:http://localhost:8081/photo1",
                        "blob:http://localhost:8081/photo2",
                    ]),
                }),
            );
        });
    });
});
