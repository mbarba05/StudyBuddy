import SocialScreen from "@/app/(app)/(tabs)/social/index";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { mockPush } from "../setup/screen.setup";

const mockGetIncomingFriendRequests = jest.fn();
jest.mock("@/services/friendshipsService", () => ({
    getIncomingFriendRequests: (...args: any[]) => mockGetIncomingFriendRequests(...args),
}));

const mockGetChatsWithRecentMessage = jest.fn();
const mockUpdateReadMessage = jest.fn();
jest.mock("@/services/messageService", () => ({
    getChatsWithRecentMessage: (...args: any[]) => mockGetChatsWithRecentMessage(...args),
    updateReadMessage: (...args: any[]) => mockUpdateReadMessage(...args),
}));

jest.mock("@/lib/utillities", () => ({
    formatMessageTime: (t: string) => `FMT(${t})`,
}));

type DMConversation = {
    conversation_id: number;
    dm_name: string;
    pp_url: string;
    last_message: string;
    last_message_at?: string;
    last_message_id: number;
    read: boolean;
};

const dm = (overrides: Partial<DMConversation> = {}): DMConversation => ({
    conversation_id: 1,
    dm_name: "Alice",
    pp_url: "https://example.com/alice.png",
    last_message: "hey",
    last_message_at: "2026-02-09T12:00:00Z",
    last_message_id: 999,
    read: true,
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).__focusEffect = null;
});

describe("SocialScreen", () => {
    it("fetches requests + chats on focus and renders chat rows", async () => {
        mockGetIncomingFriendRequests.mockResolvedValue([]);
        mockGetChatsWithRecentMessage.mockResolvedValue([
            dm({ dm_name: "Alice" }),
            dm({ conversation_id: 2, dm_name: "Bob", last_message_id: 1002 }),
        ]);

        const screen = render(<SocialScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
            expect(screen.getByText("Bob")).toBeTruthy();
        });

        expect(mockGetIncomingFriendRequests).toHaveBeenCalledTimes(1);
        expect(mockGetChatsWithRecentMessage).toHaveBeenCalledTimes(1);
    });

    it("shows pending friend requests row when requests exist and navigates when pressed", async () => {
        mockGetIncomingFriendRequests.mockResolvedValue([{ id: "r1" }]);
        mockGetChatsWithRecentMessage.mockResolvedValue([dm()]);

        const screen = render(<SocialScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(screen.getByText(/requests/i)).toBeTruthy();
        });

        act(() => {
            fireEvent.press(screen.getByText(/requests/i));
        });

        expect(mockPush).toHaveBeenCalledWith("/(tabs)/social/requests");
    });

    it("pressing a chat marks it read and navigates to the chat screen", async () => {
        mockGetIncomingFriendRequests.mockResolvedValue([]);
        mockGetChatsWithRecentMessage.mockResolvedValue([
            dm({
                conversation_id: 10,
                dm_name: "Alice",
                read: false,
                last_message_id: 123,
            }),
        ]);
        mockUpdateReadMessage.mockResolvedValue(undefined);

        const screen = render(<SocialScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
        });

        act(() => {
            fireEvent.press(screen.getByText("Alice"));
        });

        await waitFor(() => {
            expect(mockUpdateReadMessage).toHaveBeenCalledWith(123, 10);
        });

        expect(mockPush).toHaveBeenCalledWith({
            pathname: "/social/chat/[conversationId]",
            params: {
                conversationId: 10,
                dmName: "Alice",
                ppPic: "https://example.com/alice.png",
            },
        });
    });

    it("filters chats via SearchBar input", async () => {
        mockGetIncomingFriendRequests.mockResolvedValue([]);
        mockGetChatsWithRecentMessage.mockResolvedValue([
            dm({ conversation_id: 1, dm_name: "Alice" }),
            dm({ conversation_id: 2, dm_name: "Bob", last_message_id: 2002 }),
        ]);

        const screen = render(<SocialScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
            expect(screen.getByText("Bob")).toBeTruthy();
        });

        const input = screen.getByPlaceholderText("Find Chat");

        await act(async () => {
            fireEvent.changeText(input, "ali");
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
            expect(screen.queryByText("Bob")).toBeNull();
        });

        await act(async () => {
            fireEvent.changeText(input, "");
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText("Bob")).toBeTruthy();
        });
    });
});
