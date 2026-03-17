import SearchReviewsScreen from "@/components/features/reviews/SearchReviewsScreen";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockGetRecentSearchesForUser = jest.fn();
const mockGetPopularSearchesByMajor = jest.fn();
const mockUpdateRecentlyViewedRevForUser = jest.fn();
const mockUpdateRecentlyViewedRevGlobal = jest.fn();

jest.mock("@/services/reviewsService", () => ({
    getRecentSearchesForUser: (...args: any[]) => mockGetRecentSearchesForUser(...args),
    getPopularSearchesByMajor: (...args: any[]) => mockGetPopularSearchesByMajor(...args),
    updateRecentlyViewedRevForUser: (...args: any[]) => mockUpdateRecentlyViewedRevForUser(...args),
    updateRecentlyViewedRevGlobal: (...args: any[]) => mockUpdateRecentlyViewedRevGlobal(...args),
}));

describe("SearchReviewsScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render the most recently searched professors when nothing in input", async () => {
        mockGetRecentSearchesForUser.mockResolvedValue([
            { id: 1, name: "Thanos", reviewcount: 1 },
            { id: 2, name: "Thango", reviewcount: 2 },
            { id: 3, name: "Thancho", reviewcount: 3 },
        ]);

        mockGetPopularSearchesByMajor.mockResolvedValue([]);

        const screen = render(<SearchReviewsScreen />);

        await waitFor(() => {
            expect(mockGetRecentSearchesForUser).toHaveBeenCalled();
            expect(mockGetPopularSearchesByMajor).toHaveBeenCalled();
        });

        expect(await screen.findByText("Thanos")).toBeTruthy();
    });

    it("should render the most searched professors for a major when nothing in input", async () => {
        mockGetRecentSearchesForUser.mockResolvedValue([]);
        mockGetPopularSearchesByMajor.mockResolvedValue([{ id: 10, name: "Professor X", reviewcount: 12 }]);

        const screen = render(<SearchReviewsScreen />);

        expect(await screen.findByText("Professor X")).toBeTruthy();
    });

    it("should render no professors found when no recent searches", async () => {
        mockGetRecentSearchesForUser.mockResolvedValue([]);
        mockGetPopularSearchesByMajor.mockResolvedValue([{ id: 10, name: "Professor X", reviewcount: 12 }]);

        const screen = render(<SearchReviewsScreen />);

        expect(await screen.findByText("No professors found.")).toBeTruthy();
    });

    it("should render the professor you just chose in the recent searches", async () => {
        mockGetRecentSearchesForUser.mockResolvedValue([
            { id: 1, name: "Thanos", reviewcount: 1 },
            { id: 2, name: "Thango", reviewcount: 2 },
            { id: 3, name: "Thancho", reviewcount: 3 },
        ]);

        mockGetPopularSearchesByMajor.mockResolvedValue([{ id: 10, name: "Professor X", reviewcount: 12 }]);

        const screen = render(<SearchReviewsScreen />);

        const button = await screen.findByText("Professor X");

        fireEvent.press(button);

        const items = await screen.findAllByText("Professor X");
        expect(items).toHaveLength(2);
    });
});
