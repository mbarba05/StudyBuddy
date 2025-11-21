import { Text } from "react-native";
import { StarIconProps } from "react-native-star-rating-widget";

export function DifficultyIcon({ index, size, type }: StarIconProps) {
    const faces = [
        "😇", // 1
        "😌", // 2
        "🙂", // 3
        "😐", // 4
        "😕", // 5
        "😬", // 6
        "😣", // 7
        "😫", // 8
        "😵‍💫", // 9
        "💀", // 10
    ];

    if (type === "empty") {
        return <Text style={{ fontSize: size }}>⚪</Text>;
    }

    // full = show selected emoji
    const emoji = faces[index] || "💀";

    return <Text style={{ fontSize: size }}>{emoji}</Text>;
}

export function ProfessorQualityIcon({ index, size, type }: StarIconProps) {
    const faces = [
        "😡", // 1
        "😠", // 2
        "☹️", // 3
        "😕", // 4
        "😐", // 5
        "🙂", // 6
        "😊", // 7
        "😄", // 8
        "🤩", // 9
        "🧠", // 10
    ];

    // Empty slot display
    if (type === "empty") {
        return <Text style={{ fontSize: size }}>⚪</Text>;
    }

    return <Text style={{ fontSize: size }}>{faces[index] ?? "🧠"}</Text>;
}
