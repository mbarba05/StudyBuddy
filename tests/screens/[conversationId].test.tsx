import supabase from "@/lib/subapase";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("@/services/messageService", () => ({
    getMessagesForConv: jest.fn(),
}));

import ConversationScreen from "@/app/(app)/(tabs)/social/chat/[conversationId]";
import { getMessagesForConv } from "@/services/messageService";
import { act } from "react";

const mockGetMessagesForConv = getMessagesForConv as jest.Mock;

describe("[conversationId]", () => {
    beforeEach(async () => {
        mockGetMessagesForConv.mockReset();
        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
        });
        render(<ConversationScreen />);
    });

    it("fetches and renders the initial messages on focus", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            { id: "m1", sender_id: "user-2", content: "hello", count: 2 },
            { id: "m2", sender_id: "user-1", content: "hi", count: 2 },
        ]);

        //simulate the screen gaining focus, inside awaited act()
        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        expect(screen.getByText("hello")).toBeTruthy();
        expect(screen.getByText("hi")).toBeTruthy();
    });

    it("loads later chats when scrolling up", async () => {
        //initial page
        mockGetMessagesForConv.mockResolvedValueOnce([
            { id: "m2", sender_id: "user-2", content: "newest", count: 999 },
            { id: "m1", sender_id: "user-1", content: "newer", count: 999 },
        ]);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        mockGetMessagesForConv.mockResolvedValueOnce([{ id: "m0", sender_id: "user-2", content: "older", count: 999 }]);

        const list = screen.getByTestId("chats");

        act(() => {
            fireEvent(list, "onEndReached");
        });

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 2);
        });

        expect(screen.getByText("older")).toBeTruthy();
    });

    it("renders a message the user sends", () => {});
});

describe("[conversationId] realtime", () => {
    beforeEach(() => {
        mockGetMessagesForConv.mockReset();

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
        });
    });

    it("renders a message after it is inserted by another user via realtime", async () => {
        // 1) initial messages
        mockGetMessagesForConv.mockResolvedValueOnce([{ id: "m1", sender_id: "user-1", content: "hello", count: 999 }]);

        // 2) override supabase.channel to capture the INSERT handler
        let insertHandler: ((payload: any) => void) | undefined;

        (supabase.channel as jest.Mock).mockReturnValue({
            on: jest.fn((_event: any, _filter: any, cb: any) => {
                insertHandler = cb;
                return {
                    subscribe: jest.fn(() => ({ id: "mock-channel" })),
                };
            }),
        });

        render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        expect(screen.getByText("hello")).toBeTruthy();
        expect(insertHandler).toBeDefined();

        // 3) simulate another user sending a message (realtime INSERT)
        const newMessage = { id: "m2", sender_id: "user-2", content: "yo" };

        await act(async () => {
            insertHandler!({ new: newMessage });
        });

        expect(screen.getByText("yo")).toBeTruthy();
    });
});
