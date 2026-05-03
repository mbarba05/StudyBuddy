const RN = require("react-native");

type SharedValue<T> = { value: T };

const useSharedValue = <T>(initial: T): SharedValue<T> => ({ value: initial });

const withSpring = <T>(toValue: T) => toValue;
const withTiming = <T>(toValue: T) => toValue;

const runOnJS = (fn: any) => fn;
const interpolate = (value: number, inputRange?: number[], outputRange?: number[], _extrapolate?: any) => {
    if (!inputRange || !outputRange) return value;

    const [in0, in1] = inputRange;
    const [out0, out1] = outputRange;

    const minIn = Math.min(in0, in1);
    const maxIn = Math.max(in0, in1);

    // clamp (works for increasing or decreasing ranges)
    if (value <= minIn) return in0 < in1 ? out0 : out1;
    if (value >= maxIn) return in0 < in1 ? out1 : out0;

    const t = (value - in0) / (in1 - in0);
    return out0 + t * (out1 - out0);
};

const useAnimatedStyle = (updater: any) => {
    // Return a "live" style object that recomputes on property access.
    // This makes tests reflect latest shared values without a native worklet runtime.
    return new Proxy(
        {},
        {
            get(_target, prop) {
                const current = typeof updater === "function" ? updater() : updater;
                return current?.[prop as any];
            },
            ownKeys() {
                const current = typeof updater === "function" ? updater() : updater;
                return current ? Reflect.ownKeys(current) : [];
            },
            getOwnPropertyDescriptor() {
                return { enumerable: true, configurable: true };
            },
        },
    );
};

const Extrapolation = {
    CLAMP: "clamp",
    EXTEND: "extend",
    IDENTITY: "identity",
};

const AnimatedDefault = {
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
};

const createAnimatedComponent = (Component: any) => Component;

module.exports = {
    __esModule: true,
    default: AnimatedDefault,

    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
    createAnimatedComponent,
};
