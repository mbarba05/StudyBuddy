import ConversationScreen from "@/app/(app)/(tabs)/social/chat/[conversationId]";
import supabase from "@/lib/subapase";
import {
    getAttachmentSignedUrlCached,
    getMessagesForConv,
    isImageMime,
    isImagePickerAsset,
    MessageAttachmentTable,
} from "@/services/messageService";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { act } from "react";

jest.mock("@/services/messageService", () => ({
    getMessagesForConv: jest.fn(),
    getAttachmentSignedUrlCached: jest.fn(),
    isImageMime: jest.fn(),
    isImagePickerAsset: jest.fn(),
}));

const mockGetMessagesForConv = getMessagesForConv as jest.Mock;
const mockGetAttachmentSignedUrlCached = getAttachmentSignedUrlCached as jest.Mock;
const mockIsImageMime = isImageMime as jest.Mock;
const mockIsImagePickerAsset = isImagePickerAsset as unknown as jest.Mock;

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

    it("opens photo library option and renders a picked attachment preview", async () => {
        const url = "file://picked.jpg";
        mockGetMessagesForConv.mockResolvedValueOnce([]);
        mockIsImagePickerAsset.mockReturnValue(true);

        (globalThis as any).__setRouteParams({
            conversationId: "conv-1",
            dmName: "Sam",
            ppPic: "https://example.com/pic.png",
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

        // “Select” Photo Library (index 0)
        await act(async () => {
            actionSheetCallback?.(0);
        });

        // Assert preview rendered
        await waitFor(() => {
            expect(screen.getByTestId(url)).toBeTruthy();
        });

        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
});

describe("[conversationId] realtime", () => {
    let messageInsertHandler: ((payload: any) => void) | undefined;
    let attachmentInsertHandler: ((payload: any) => void) | undefined;
    beforeEach(() => {
        jest.clearAllMocks();
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
        // 1) initial messages
        mockGetMessagesForConv.mockResolvedValueOnce([{ id: "m1", sender_id: "user-1", content: "hello", count: 999 }]);

        render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        await waitFor(() => {
            expect(mockGetMessagesForConv).toHaveBeenCalledWith("conv-1", 0);
        });

        expect(screen.getByText("hello")).toBeTruthy();
        expect(messageInsertHandler).toBeDefined();

        // 3) simulate another user sending a message (realtime INSERT)
        const newMessage = { id: "m2", sender_id: "user-2", content: "yo" };

        await act(async () => {
            messageInsertHandler!({ new: newMessage });
        });

        expect(screen.getByText("yo")).toBeTruthy();
    });

    it("should render an attatchment sent by another user", async () => {
        mockGetMessagesForConv.mockResolvedValueOnce([
            { id: "m1", sender_id: "user-1", content: "hello", attachments: [], count: 999 },
        ]);
        mockGetAttachmentSignedUrlCached.mockResolvedValueOnce("https://example.com/file.jpg");
        mockIsImageMime.mockReturnValue(true);

        render(<ConversationScreen />);

        await (globalThis as any).__runFocusEffect();

        expect(messageInsertHandler).toBeDefined();

        const url = "https://example.com/file.jpg";
        // 3) simulate another user sending a message with atachment (realtime INSERT)
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
        const newMessage = { id: "m2", sender_id: "user-2", content: "" };

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
