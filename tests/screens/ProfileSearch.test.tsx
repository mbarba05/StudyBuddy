import ProfileSearch from "@/app/(app)/(tabs)/matchmaking/search";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { mockPush } from "../setup/screen.setup";

// --- service mocks ---
const mockSearchForProfileWithMutuals = jest.fn();
const mockGetRecentSearches = jest.fn();
const mockUpsertRecentSearch = jest.fn();
const mockClearRecentSearch = jest.fn();

jest.mock("@/services/profileService", () => ({
    searchForProfileWithMutuals: (...args: any[]) => mockSearchForProfileWithMutuals(...args),
    getRecentSearches: (...args: any[]) => mockGetRecentSearches(...args),
    upsertRecentSearch: (...args: any[]) => mockUpsertRecentSearch(...args),
    clearRecentSearch: (...args: any[]) => mockClearRecentSearch(...args),
}));

// --- helpers ---
const makeProfile = (overrides: Record<string, any> = {}) => ({
    user_id: "u1",
    display_name: "Alice",
    pp_url: "https://example.com/alice.png",
    major: "Computer Science",
    year: "Junior",
    mutual_count: 0,
    mutual_friends: [],
    ...overrides,
});

const makeRecent = (overrides: Record<string, any> = {}) => ({
    id: 1,
    profile: {
        user_id: "u1",
        display_name: "Alice",
        pp_url: "https://example.com/alice.png",
        major: "Computer Science",
        year: "Junior",
    },
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetRecentSearches.mockResolvedValue([]);
    mockUpsertRecentSearch.mockResolvedValue(undefined);
    mockClearRecentSearch.mockResolvedValue(undefined);
});

afterEach(() => {
    jest.useRealTimers();
});

describe("ProfileSearch", () => {
    it("renders the search bar", () => {
        const screen = render(<ProfileSearch />);
        expect(screen.getByPlaceholderText("Search Users")).toBeTruthy();
    });

    it("shows recent searches on mount", async () => {
        mockGetRecentSearches.mockResolvedValue([
            makeRecent({ id: 1, profile: { ...makeRecent().profile, display_name: "Alice" } }),
            makeRecent({ id: 2, profile: { ...makeRecent().profile, user_id: "u2", display_name: "Bob" } }),
        ]);

        const screen = render(<ProfileSearch />);

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
            expect(screen.getByText("Bob")).toBeTruthy();
            expect(screen.getByText("Recent Searches")).toBeTruthy();
        });
    });

    it("searches and displays results after debounce", async () => {
        mockSearchForProfileWithMutuals.mockResolvedValue([
            makeProfile({ display_name: "Charlie" }),
            makeProfile({ user_id: "u2", display_name: "Diana" }),
        ]);

        const screen = render(<ProfileSearch />);

        await act(async () => {
            fireEvent.changeText(screen.getByPlaceholderText("Search Users"), "ch");
        });

        // Advance past the 300ms debounce
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText("Charlie")).toBeTruthy();
            expect(screen.getByText("Diana")).toBeTruthy();
        });

        expect(mockSearchForProfileWithMutuals).toHaveBeenCalledWith("ch");
    });

    it('shows "1 Mutual:" for a single mutual friend', async () => {
        mockSearchForProfileWithMutuals.mockResolvedValue([
            makeProfile({
                display_name: "Charlie",
                mutual_count: 1,
                mutual_friends: [{ friend_id: "f1", display_name: "Eve" }],
            }),
        ]);

        const screen = render(<ProfileSearch />);

        await act(async () => {
            fireEvent.changeText(screen.getByPlaceholderText("Search Users"), "ch");
        });

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText(/1 Mutual:/)).toBeTruthy();
        });
    });

    it("navigates to viewProfile on result press", async () => {
        const profile = makeProfile({ user_id: "u99", display_name: "Charlie", major: "Math", year: "Senior" });
        mockSearchForProfileWithMutuals.mockResolvedValue([profile]);

        const screen = render(<ProfileSearch />);

        await act(async () => {
            fireEvent.changeText(screen.getByPlaceholderText("Search Users"), "ch");
        });

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText("Charlie")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(screen.getByText("Charlie"));
        });

        expect(mockPush).toHaveBeenCalledWith({
            pathname: "/matchmaking/viewProfile",
            params: {
                display_name: "Charlie",
                major: "Math",
                user_id: "u99",
                pp_url: "https://example.com/alice.png",
                year: "Senior",
            },
        });
    });

    it("saves recent search on result press", async () => {
        mockSearchForProfileWithMutuals.mockResolvedValue([makeProfile({ user_id: "u99" })]);

        const screen = render(<ProfileSearch />);

        await act(async () => {
            fireEvent.changeText(screen.getByPlaceholderText("Search Users"), "al");
        });

        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(screen.getByText("Alice"));
        });

        expect(mockUpsertRecentSearch).toHaveBeenCalledWith("u99");
    });

    it("clears a recent search when X is pressed", async () => {
        mockGetRecentSearches.mockResolvedValue([makeRecent({ id: 42 })]);
        mockClearRecentSearch.mockResolvedValue(undefined);
        // Re-mock so the reload after clear returns empty
        mockGetRecentSearches.mockResolvedValueOnce([makeRecent({ id: 42 })]).mockResolvedValueOnce([]);

        const screen = render(<ProfileSearch />);

        await waitFor(() => {
            expect(screen.getByText("Alice")).toBeTruthy();
        });

        // The close icon renders as "icon" text. The recent item has two text nodes
        // plus the close button icon. We need to find the close icon specifically.
        const icons = screen.getAllByText("icon");
        // The last "icon" in a recent item row is the close button
        await act(async () => {
            fireEvent.press(icons[icons.length - 1]);
        });

        await waitFor(() => {
            expect(mockClearRecentSearch).toHaveBeenCalledWith(42);
        });

        await waitFor(() => {
            expect(screen.queryByText("Alice")).toBeNull();
        });
    });

    it("shows loading indicator while searching", async () => {
        // Never resolve so loading stays visible
        mockSearchForProfileWithMutuals.mockReturnValue(new Promise(() => {}));

        const screen = render(<ProfileSearch />);

        await act(async () => {
            fireEvent.changeText(screen.getByPlaceholderText("Search Users"), "test");
        });

        // ActivityIndicator should render while waiting for search results
        await waitFor(() => {
            expect(screen.UNSAFE_getByType(require("react-native").ActivityIndicator)).toBeTruthy();
        });
    });
});
