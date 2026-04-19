import React from "react";
import { View } from "react-native";

export default function PagerView(props: any) {
    // Render children in a simple container for tests
    return <View {...props}>{props.children}</View>;
}
