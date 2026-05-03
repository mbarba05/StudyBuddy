// Mock expo-router/build/hooks before importing the component
jest.mock("expo-router/build/hooks", () => {
    const expoRouter = require("expo-router");
    return {
        useLocalSearchParams: expoRouter.useLocalSearchParams,
        useRouter: expoRouter.useRouter,
    };
});

// Override Stack.Screen mock to render headerRight content so we can test header buttons
jest.mock("expo-router", () => {
    const React = require("react");
    const { View } = require("react-native");

    const StackScreen = ({ options }: any) => {
        const headerRight = options?.headerRight;
        return <View testID="stack-screen">{headerRight ? headerRight() : null}</View>;
    };

    let mockParams: Record<string, any> = {};
    (globalThis as any).__setRouteParams = (params: Record<string, any>) => {
        mockParams = params;
    };

    const mockPushFn = require("../setup/screen.setup").mockPush;

    return {
        Stack: { Screen: StackScreen },
        useLocalSearchParams: () => mockParams,
        useRouter: () => ({ push: mockPushFn, replace: jest.fn(), back: jest.fn() }),
        useFocusEffect: jest.fn(),
    };
});

import ViewProfile from "@/app/(app)/(tabs)/matchmaking/viewProfile";
import { FriendshipStatus } from "@/services/friendshipsService";
import { act, render, waitFor, fireEvent } from "@testing-library/react-native";
import React from "react";
import { mockPush } from "../setup/screen.setup";

// --- service mocks ---
const mockCheckStatus = jest.fn();
const mockRemoveFriend = jest.fn();
const mockSendFriendRequest = jest.fn();

jest.mock("@/services/friendshipsService", () => {
    const actual = jest.requireActual("@/services/friendshipsService");
    return {
        FriendshipStatus: actual.FriendshipStatus,
        checkStatus: (...args: any[]) => mockCheckStatus(...args),
        removeFriend: (...args: any[]) => mockRemoveFriend(...args),
        sendFriendRequest: (...args: any[]) => mockSendFriendRequest(...args),
    };
});

jest.mock("@/services/auth/AuthProvider", () => ({
    useAuth: () => ({ user: { id: "current-user" } }),
}));

// MatchMakingCard uses supabase internally — the global mock from screen.setup handles it,
// but we also need the `from` chain for the major query
jest.mock("@/lib/supabase", () => ({
    __esModule: true,
    default: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => ({ data: { major: { name: "Computer Science" } }, error: null })),
                })),
            })),
        })),
        channel: jest.fn(() => ({
            on: jest.fn(() => ({ subscribe: jest.fn() })),
        })),
        removeChannel: jest.fn(),
    },
}));

const defaultParams = {
    display_name: "Alice",
    pp_url: "https://example.com/alice.png",
    major: "Computer Science",
    user_id: "u1",
    year: "Junior",
};

beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).__setRouteParams(defaultParams);
    mockCheckStatus.mockResolvedValue(FriendshipStatus.none);
});

describe("ViewProfile", () => {
    it("renders the profile card with route params", async () => {
        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
        });
    });

    it('shows "Add Friend" when status is none', async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.none);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Add Friend")).toBeTruthy();
        });
    });

    it('shows "Remove Friend" when status is friends', async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.friends);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Remove Friend")).toBeTruthy();
        });
    });

    it('shows "Pending" when status is pendingSent', async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.pendingSent);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Pending")).toBeTruthy();
        });
    });

    it('shows "Accept Request" when status is pendingAccept', async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.pendingAccept);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Accept Request")).toBeTruthy();
        });
    });

    it("shows no action button when status is error", async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.error);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(mockCheckStatus).toHaveBeenCalled();
        });

        expect(screen.queryByText("Add Friend")).toBeNull();
        expect(screen.queryByText("Remove Friend")).toBeNull();
        expect(screen.queryByText("Pending")).toBeNull();
        expect(screen.queryByText("Accept Request")).toBeNull();
    });

    it("sends friend request and updates to Pending on Add Friend press", async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.none);
        mockSendFriendRequest.mockResolvedValue(true);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Add Friend")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(screen.getByText("Add Friend"));
        });

        expect(mockSendFriendRequest).toHaveBeenCalledWith("u1");

        await waitFor(() => {
            expect(screen.getByText("Pending")).toBeTruthy();
        });
    });

    it("removes friend and updates to Add Friend on Remove Friend press", async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.friends);
        mockRemoveFriend.mockResolvedValue(true);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Remove Friend")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(screen.getByText("Remove Friend"));
        });

        expect(mockRemoveFriend).toHaveBeenCalledWith("u1");

        await waitFor(() => {
            expect(screen.getByText("Add Friend")).toBeTruthy();
        });
    });

    it("navigates to requests screen on Accept Request press", async () => {
        mockCheckStatus.mockResolvedValue(FriendshipStatus.pendingAccept);

        const screen = render(<ViewProfile />);

        await waitFor(() => {
            expect(screen.getByText("Accept Request")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(screen.getByText("Accept Request"));
        });

        expect(mockPush).toHaveBeenCalledWith("/(tabs)/social/requests");
    });
});
