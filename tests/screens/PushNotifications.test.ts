import { sendPushNotification } from "@/services/PushNotifications";

describe("Push Notification Service", () => {
    const mockToken = "ExponentPushToken[123456]";
    const mockMessage = "New message received";

    beforeEach(() => {
        // Mock environment variables
        process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

        // Mock fetch
        globalThis.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                statusText: "OK",
                json: () => Promise.resolve({ success: true }),
            }),
        ) as jest.Mock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("calls fetch with correct Expo push API URL", async () => {
        await sendPushNotification(mockToken, mockMessage);

        expect(fetch).toHaveBeenCalled();
    });

    test("sends correct body payload", async () => {
        await sendPushNotification(mockToken, mockMessage);

        const fetchCall = (fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body).toEqual({
            userId: mockToken,
            body: mockMessage,
        });
    });

    test("does not throw when called", async () => {
        await expect(sendPushNotification(mockToken, mockMessage)).resolves.not.toThrow();
    });
});
