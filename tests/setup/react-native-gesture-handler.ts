function createGestureChain() {
    const chain: any = {};
    const chainMethods = [
        "activeOffsetX",
        "activeOffsetY",
        "failOffsetX",
        "failOffsetY",
        "minDistance",
        "maxDistance",
        "onBegin",
        "onStart",
        "onUpdate",
        "onChange",
        "onEnd",
        "onFinalize",
        "enabled",
        "simultaneousWithExternalGesture",
        "requireExternalGestureToFail",
        "withTestId",
        "hitSlop",
        "maxPointers",
        "shouldCancelWhenOutside",
    ];
    for (const m of chainMethods) chain[m] = () => chain;
    return chain;
}

const Gesture = {
    Pan: () => createGestureChain(),
    Tap: () => createGestureChain(),
    LongPress: () => createGestureChain(),
    Pinch: () => createGestureChain(),
    Rotation: () => createGestureChain(),
    Race: (...gestures: any[]) => gestures,
    Simultaneous: (...gestures: any[]) => gestures,
    Exclusive: (...gestures: any[]) => gestures,
};

const GestureDetector = ({ children }: any) => children;

module.exports = {
    Gesture,
    GestureDetector,
    State: {},
    Directions: {},
    gestureHandlerRootHOC: (C: any) => C,
};
