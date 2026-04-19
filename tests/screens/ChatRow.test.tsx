import ChatRow from "@/components/features/chats/ChatRow";
import { render } from "@testing-library/react-native";
import React from "react";

// Make time deterministic
jest.mock("@/lib/utillities", () => ({
    formatTime: () => "10:00 AM",
}));

// Keep colors stable
jest.mock("@/assets/colors", () => ({
    colors: { textSecondary: "#999" },
}));

// Avoid pulling in other UI complexity

jest.mock("@/components/features/chats/AttachmentImage", () => {
    return () => null;
});

function getOpacity(styleProp: any) {
    if (!styleProp) return undefined;

    const styles = Array.isArray(styleProp) ? styleProp : [styleProp];

    // walk from the end so later styles win
    for (let i = styles.length - 1; i >= 0; i--) {
        const s = styles[i];
        if (s && typeof s === "object" && "opacity" in s) return s.opacity;
    }

    return undefined;
}

function getTranslateX(styleProp: any) {
    const flat = Array.isArray(styleProp) ? Object.assign({}, ...styleProp) : styleProp;
    const t = flat?.transform?.find((x: any) => x.translateX != null);
    return t?.translateX;
}

describe("ChatRow", () => {
    it("should show the time for each message when pulling screen to the left", () => {
        const item: any = {
            id: "m1",
            content: "hello",
            created_at: "2026-03-03T18:00:00.000Z",
            attachments: [],
        };

        const globalX = { value: 0 }; // SharedValue<number>-shape

        const { getByText, getByTestId, rerender } = render(
            <ChatRow item={item} isOwn={false} globalX={globalX as any} />,
        );

        // Time exists in the tree, but starts hidden (opacity 0 at x=0)
        const timeNode = getByText("10:00 AM");
        expect(getOpacity(timeNode.props.style)).toBe(0.7);

        // Content is not translated initially
        const bubble = getByTestId("bubble");
        expect(getTranslateX(bubble.parent?.props?.style)).toBeUndefined(); // bubble isn't the Animated.View

        // Re-render after "swipe left"
        globalX.value = -60;
        rerender(<ChatRow item={item} isOwn={false} globalX={globalX as any} />);

        const timeNode2 = getByText("10:00 AM");
        expect(getOpacity(timeNode2.props.style)).toBe(0.7);
    });
});
