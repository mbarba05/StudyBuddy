import SearchReviewsScreen from "@/components/features/reviews/SearchReviewsScreen";
import { render } from "@testing-library/react-native";

describe("SearchReviewsScreen", () => {
    it("should render the most recenly searched professors when nothing in input", () => {
        render(<SearchReviewsScreen />);
    });

    it("should render the most searched professors for a major when nothing in input", () => {
        render(<SearchReviewsScreen />);
    });
});
