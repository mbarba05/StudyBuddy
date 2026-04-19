import { act, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { InAppNotificationProvider, useInAppNotifications } from "../../services/auth/inAppNotifications";

jest.useFakeTimers();

let mockCallbacks: any[] = [];

// Mock Supabase
jest.mock("@/lib/supabase", () => {
    const removeChannel = jest.fn();

    const channel = jest.fn(() => {
        const api: any = {
            on: jest.fn((event: any, filter: any, callback: any) => {
                mockCallbacks.push(callback);
                return api;
            }),
            subscribe: jest.fn(),
        };

        return api;
    });

    return {
        __esModule: true,
        default: {
            channel,
            removeChannel,
        },
    };
});

// Mock Auth
jest.mock("../../services/auth/AuthProvider", () => ({
    useAuth: () => ({
        user: { id: "test-user" },
    }),
}));

// Test component
const TestComponent = () => {
    const { currentNotification } = useInAppNotifications();

    return <>{currentNotification && <Text testID="notification">{currentNotification.message}</Text>}</>;
};

describe("InAppNotifications", () => {
    beforeEach(() => {
        mockCallbacks = [];
    });

    test("provider renders without crashing", () => {
        const tree = render(
            <InAppNotificationProvider>
                <TestComponent />
            </InAppNotificationProvider>,
        );

        expect(tree).toBeTruthy();
    });

    test("friend request realtime event creates notification", async () => {
        const { findByText } = render(
            <InAppNotificationProvider>
                <TestComponent />
            </InAppNotificationProvider>,
        );

        act(() => {
            mockCallbacks[0]({
                new: {
                    id: "1",
                    sender_name: "John",
                },
            });
        });

        const notification = await findByText("John sent you a friend request");
        expect(notification).toBeTruthy();
    });

    test("friend added realtime event creates notification", async () => {
        const { findByText } = render(
            <InAppNotificationProvider>
                <TestComponent />
            </InAppNotificationProvider>,
        );

        act(() => {
            mockCallbacks[1]({
                new: {
                    id: "2",
                },
            });
        });

        const notification = await findByText("You are now friends!");
        expect(notification).toBeTruthy();
    });

    test("notification disappears after timer", () => {
        const { queryByTestId } = render(
            <InAppNotificationProvider>
                <TestComponent />
            </InAppNotificationProvider>,
        );

        act(() => {
            mockCallbacks[0]({
                new: {
                    id: "3",
                    sender_name: "John",
                },
            });
        });

        act(() => {
            jest.advanceTimersByTime(6000);
        });

        expect(queryByTestId("notification")).toBeNull();
    });

    test("removes supabase channel on unmount", () => {
        const supabase = require("@/lib/supabase").default;

        const { unmount } = render(
            <InAppNotificationProvider>
                <TestComponent />
            </InAppNotificationProvider>,
        );

        unmount();

        expect(supabase.removeChannel).toHaveBeenCalled();
    });
});
