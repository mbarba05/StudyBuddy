import ConversationScreen from "@/app/(app)/(tabs)/social/chat/[conversationId]";
import supabase from "@/lib/supabase";
import {
    getAttachmentSignedUrlCached,
    getChatHeaderState,
    getMessagesForConv,
    isImageMime,
    isImagePickerAsset,
    MessageAttachmentTable,
} from "@/services/messageService";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { act } from "react";
import React from "react";
import { View } from "react-native";

jest.mock("@/services/messageService", () => ({
    getMessagesForConv: jest.fn(),
    getAttachmentSignedUrlCached: jest.fn(),
    isImageMime: jest.fn(),
    isImagePickerAsset: jest.fn(),
    getChatHeaderState: jest.fn(),
}));

jest.mock("@/services/friendshipsService", () => ({
    removeFriend: jest.fn(),
    sendFriendRequest: jest.fn(),
}));

jest.mock("@/services/PushNotifications", () => ({
    sendPushNotification: jest.fn(),
}));

// Render the expo-router headerTitle into the test tree so the friend button is visible to tests
jest.mock("expo-router", () => {
    const React = require("react");
    const { View } = require("react-native");

    let routeParams = {
        conversationId: "conv-1",
        dmName: "Sam",
        ppPic: "https://example.com/pic.png",
    };

    let focusEffectCallback: null | (() => void | (() => void) | Promise<void | (() => void)>) = null;

    (globalThis as any).__setRouteParams = (params: any) => {
        routeParams = params;
    };

    (globalThis as any).__runFocusEffect = async () => {
        if (focusEffectCallback) {
            await focusEffectCallback();
        }
    };

    return {
        useLocalSearchParams: () => routeParams,
        useFocusEffect: (cb: any) => {
            focusEffectCallback = cb;
        },
        Stack: {
            Screen: ({ options }: any) => (
                <View testID="mock-header">
                    {typeof options?.headerTitle === "function" ? options.headerTitle() : null}
                </View>
            ),
        },
    };
});

const mockGetMessagesForConv = getMessagesForConv as jest.Mock;
const mockGetAttachmentSignedUrlCached = getAttachmentSignedUrlCached as jest.Mock;
const mockIsImageMime = isImageMime as jest.Mock;
const mockIsImagePickerAsset = isImagePickerAsset as unknown as jest.Mock;
const mockGetChatHeaderState = getChatHeaderState as jest.Mock;
const mockRemoveFriend = removeFriend as jest.Mock;
const mockSendFriendRequest = sendFriendRequest as jest.Mock;

let actionSheetCallback: ((selectedIndex?: number) => void) | null = null;

jest.mock("@expo/react-native-action-sheet", () => ({
    useActionSheet: () => ({
        showActionSheetWithOptions: jest.fn((_opts: any, cb: any) => {
            actionSheetCallback = cb;
        }),
    }),
}));

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
}));

describe("[conversationId]", () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        mockGetMessagesForConv.mockReset();
        mockGetChatHeaderState.mockResolvedValue({
            conversation_id: "conv-1",
            other_user_id: "user-2",
            dm_name: "Sam",
            pp_url: "https://example.com/pic.png",
            is_friend: true,
        });

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
        });

        render(<ConversationScreen />);
    });

    it("fetches and renders the initial messages on focus", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m1",
                sender_id: "user-2",
                content: "hello",
                count: 2,
                created_at: "2026-03-01T18:00:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
            {
                id: "m2",
                sender_id: "user-1",
                content: "hi",
                count: 2,
                created_at: "2026-03-01T18:05:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
        ]);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        expect(screen.getByText("hello")).toBeTruthy();
        expect(screen.getByText("hi")).toBeTruthy();
    });

    it("loads later chats when scrolling up", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m2",
                sender_id: "user-2",
                content: "newest",
                count: 999,
                created_at: "2026-03-01T18:10:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
            {
                id: "m1",
                sender_id: "user-1",
                content: "newer",
                count: 999,
                created_at: "2026-03-01T18:00:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
        ]);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m0",
                sender_id: "user-2",
                content: "older",
                count: 999,
                created_at: "2026-02-28T18:00:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
        ]);

        const list = screen.getByTestId("chats");

        act(() => {
            fireEvent(list, "onEndReached");
        });

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 2);
        });

        expect(screen.getByText("older")).toBeTruthy();
    });

    it("opens photo library option and renders a picked attachment preview", async () => {
        const url = "file://picked.jpg";
        mockGetMessagesForConv.mockResolvedValueOnce([]);
        mockIsImagePickerAsset.mockReturnValue(true);

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "file://picked.jpg",
        });

        (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });

        (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
            canceled: false,
            assets: [{ uri: url, width: 200, height: 100 }],
        });

        render(<ConversationScreen />);
        await (globalThis as any).__runFocusEffect();

        const menuBtn = screen.getByTestId("attachmentMenu");

        await act(async () => {
            fireEvent.press(menuBtn);
        });

        await act(async () => {
            actionSheetCallback?.(0);
        });

        await waitFor(() => {
            expect(screen.getByTestId(url)).toBeTruthy();
        });

        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    it("should show date and time for messages new each day", async () => {
        const day1 = "2026-03-01T18:00:00.000Z";
        const day2 = "2026-03-02T09:30:00.000Z";

        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m1",
                sender_id: "user-1",
                content: "First day message",
                created_at: day1,
                attachments: [],
                count: 2,
                conversation_id: "conv-1",
            },
            {
                id: "m2",
                sender_id: "user-2",
                content: "Second day message",
                created_at: day2,
                attachments: [],
                count: 2,
                conversation_id: "conv-1",
            },
        ]);

        const screenLocal = render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        expect(await screenLocal.findByText("First day message")).toBeTruthy();
        expect(await screenLocal.findByText("Second day message")).toBeTruthy();

        expect(screenLocal.getByText("Sun, Mar 1, 2026")).toBeTruthy();
        expect(screenLocal.getByText("Mon, Mar 2, 2026")).toBeTruthy();
    });
});

describe("[conversationId] realtime", () => {
    let messageInsertHandler: ((payload: any) => void) | undefined;
    let attachmentInsertHandler: ((payload: any) => void) | undefined;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetChatHeaderState.mockResolvedValue({
            conversation_id: "conv-1",
            other_user_id: "user-2",
            dm_name: "Sam",
            pp_url: "https://example.com/pic.png",
            is_friend: true,
        });

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
        });

        (supabase.channel as jest.Mock).mockImplementation((_name: string) => ({
            on: jest.fn((_event: any, filter: any, cb: any) => {
                if (filter?.table === "messages") messageInsertHandler = cb;
                if (filter?.table === "message_attachments") attachmentInsertHandler = cb;
                return { subscribe: jest.fn(() => ({ id: "mock-channel" })) };
            }),
            subscribe: jest.fn(),
        }));
    });

    it("renders a message after it is inserted by another user via realtime", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m1",
                sender_id: "user-1",
                content: "hello",
                count: 999,
                created_at: "2026-03-01T18:00:00.000Z",
                attachments: [],
                conversation_id: "conv-1",
            },
        ]);

        render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        expect(screen.getByText("hello")).toBeTruthy();
        expect(messageInsertHandler).toBeDefined();

        const newMessage = {
            id: "m2",
            sender_id: "user-2",
            content: "yo",
            created_at: "2026-03-01T18:01:00.000Z",
            conversation_id: "conv-1",
        };

        await act(async () => {
            messageInsertHandler!({ new: newMessage });
        });

        expect(screen.getByText("yo")).toBeTruthy();
    });

    it("should render an attatchment sent by another user", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            {
                id: "m1",
                sender_id: "user-1",
                content: "hello",
                attachments: [],
                count: 999,
                created_at: "2026-03-01T18:00:00.000Z",
                conversation_id: "conv-1",
            },
        ]);
        mockGetAttachmentSignedUrlCached.mockResolvedValueOnce("file://picked.jpg");
        mockIsImageMime.mockReturnValue(true);

        render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        expect(messageInsertHandler).toBeDefined();

        const url = "file://picked.jpg";
        const newAtachment: MessageAttachmentTable = {
            id: "a2",
            conversation_id: "conv-1",
            message_id: "m2",
            sender_id: "user-2",
            path: url,
            mime_type: "image",
            aspect_ratio: 0.5,
            created_at: new Date().toISOString(),
        };
        const newMessage = {
            id: "m2",
            sender_id: "user-2",
            content: "",
            created_at: new Date().toISOString(),
            conversation_id: "conv-1",
        };

        await act(async () => {
            messageInsertHandler!({ new: newMessage });
        });

        await act(async () => {
            attachmentInsertHandler!({ new: newAtachment });
        });

        await waitFor(() => {
            expect(mockGetAttachmentSignedUrlCached).toHaveBeenCalledWith(url);
        });

        await waitFor(() => {
            const img = screen.getByTestId(url);
            const src = Array.isArray(img.props.source) ? img.props.source[0] : img.props.source;
            expect(src?.uri).toBe(url);
        });
    });
});

describe("[conversationId] friend button", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
        });

        mockGetMessagesForConv.mockResolvedValue([]);
    });

    it('shows "Remove Friend" when the users are friends', async () => {
        mockGetChatHeaderState.mockResolvedValue({
            conversation_id: "conv-1",
            other_user_id: "user-2",
            dm_name: "Sam",
            pp_url: "https://example.com/pic.png",
            is_friend: true,
        });

        render(<ConversationScreen />);

        await waitFor(() => {
            expect(screen.getByText("Remove Friend")).toBeTruthy();
        });
    });

    it('shows "Add Friend" and disables chatting when the users are not friends', async () => {
        mockGetChatHeaderState.mockResolvedValue({
            conversation_id: "conv-1",
            other_user_id: "user-2",
            dm_name: "Sam",
            pp_url: "https://example.com/pic.png",
            is_friend: false,
        });

        render(<ConversationScreen />);

        await waitFor(() => {
            expect(screen.getByText("Add Friend")).toBeTruthy();
        });

        await waitFor(() => {
            expect(
                screen.getByText("You can no longer message this user unless you become friends again."),
            ).toBeTruthy();
        });
    });

    it('pressing "Remove Friend" calls removeFriend with the other user id', async () => {
        mockGetChatHeaderState
            .mockResolvedValueOnce({
                conversation_id: "conv-1",
                other_user_id: "user-2",
                dm_name: "Sam",
                pp_url: "https://example.com/pic.png",
                is_friend: true,
            })
            .mockResolvedValueOnce({
                conversation_id: "conv-1",
                other_user_id: "user-2",
                dm_name: "Sam",
                pp_url: "https://example.com/pic.png",
                is_friend: false,
            });

        mockRemoveFriend.mockResolvedValue(true);

        render(<ConversationScreen />);

        const button = await screen.findByText("Remove Friend");
        fireEvent.press(button);

        await waitFor(() => {
            expect(mockRemoveFriend).toHaveBeenCalledWith("user-2");
        });
    });

    it('pressing "Add Friend" calls sendFriendRequest with the other user id', async () => {
        mockGetChatHeaderState
            .mockResolvedValueOnce({
                conversation_id: "conv-1",
                other_user_id: "user-2",
                dm_name: "Sam",
                pp_url: "https://example.com/pic.png",
                is_friend: false,
            })
            .mockResolvedValueOnce({
                conversation_id: "conv-1",
                other_user_id: "user-2",
                dm_name: "Sam",
                pp_url: "https://example.com/pic.png",
                is_friend: false,
            });

        mockSendFriendRequest.mockResolvedValue({
            id: 1,
            sender_id: "user-1",
            receiver_id: "user-2",
            status: "pending",
        });

        render(<ConversationScreen />);

        const button = await screen.findByText("Add Friend");
        fireEvent.press(button);

        await waitFor(() => {
            expect(mockSendFriendRequest).toHaveBeenCalledWith("user-2");
        });
    });
});

