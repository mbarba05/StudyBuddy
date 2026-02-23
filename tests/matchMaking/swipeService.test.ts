// functions for mocking supabase
jest.mock("@/lib/subapase", () => ({
    //mocking supabase
    __esModule: true, // means ES module syntax (export defualt)
    default: {
        from: jest.fn(), // creates a fake function called "from" that that i can edit later and mocks
        // the info supabase would otherwise provide

        // mocking auth
        auth: {
            getUser: jest.fn(),
        },
    },
}));
/*
jest.mock("@/services/swipeService", () => {
    const actual = jest.requireActual("@/services/swipeService");
    return {
        ...actual,
        swipeTracker: jest.fn(),
        swipeResetafter24: jest.fn(),
    };
});
*/
import * as swipeService from "@/services/swipeService"; // allows to spy
//import { getSwipeStatus, swipeResetafter24, swipeTracker, WINDOW_MS } from "@/services/swipeService";

const supabaseMock = jest.requireMock("@/lib/subapase").default as {
    from: jest.Mock;
    auth: {
        getUser: jest.Mock;
    };
};

// fake chain structure that mocks the supabase references .from().select()...
// what .from() returns
type supabaseFromReurn = {
    select: jest.Mock;
};
// what .eq() returns
type supabaseSelectReturn = {
    eq: jest.Mock;
};
// what .gte() returns
type supabaseEqReturn = {
    gte: jest.Mock;
};

// resetting all mock functions before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// testing with a swipe count of 5
test("returns swipe count 5", async () => {
    // created a async test since swipeTracker returns a Promise
    const gte = jest.fn().mockResolvedValue({ count: 5, error: null }); // creates a fake .gte() function with count value 5 and error returing null -> .gte("created_at",sameData)
    // mockResolveValue(..>) means it returns a Promise that resolves to that object
    // equivalent to => return Promisse.resolve({count: 5, error: null});
    const eq = jest.fn().mockReturnValue({ gte }); //  .eq("swipe_id", swiperId) with my mock data => {gte: Foo}
    const select = jest.fn().mockReturnValue({ eq });

    const fromMock = supabaseMock.from as unknown as jest.Mock;
    fromMock.mockReturnValue({ select });

    const result = await swipeService.swipeTracker("user-123");
    expect(result).toBe(5);
});

test("returns undefined when no swipes in record", async () => {
    // limit returns the final DB result
    const limit = jest.fn().mockResolvedValue({ data: [], error: null });
    const order = jest.fn().mockReturnValue({ limit });
    const gte = jest.fn().mockReturnValue({ order });
    const eq = jest.fn().mockReturnValue({ gte });
    const select = jest.fn().mockReturnValue({ eq });

    supabaseMock.from.mockReturnValue({ select });

    const result = await swipeService.swipeResetafter24("user-123");
    expect(result).toBeUndefined();
});

test("Returning the reset time countdown", async () => {
    //choosing a known created_at value
    const latestSwipe = "2026-02-17T18:09:03.821Z";

    const limit = jest.fn().mockResolvedValue({
        data: [{ created_at: latestSwipe }],
        error: null,
    });

    const order = jest.fn().mockReturnValue({ limit });
    const gte = jest.fn().mockReturnValue({ order });
    const eq = jest.fn().mockReturnValue({ gte });
    const select = jest.fn().mockReturnValue({ eq });

    supabaseMock.from.mockReturnValue({ select });

    const expected = new Date(new Date(latestSwipe).getTime() + swipeService.WINDOW_MS).toISOString();

    const result = await swipeService.swipeResetafter24("user-123");
    expect(result).toBe(expected);
});

test("throw when error is returned ", async () => {
    const limit = jest.fn().mockResolvedValue({
        data: null,
        error: new Error("DB fails"),
    });

    const order = jest.fn().mockReturnValue({ limit });
    const gte = jest.fn().mockReturnValue({ order });
    const eq = jest.fn().mockReturnValue({ gte });
    const select = jest.fn().mockReturnValue({ eq });

    supabaseMock.from.mockReturnValue({ select });

    await expect(swipeService.swipeResetafter24("user-123")).rejects.toThrow("DB fails");
});

test("throws when auth.getUser returns an error", async () => {
    //mocking auth.getUser to return an error
    supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Auth Failed"),
    });
    await expect(swipeService.getSwipeStatus()).rejects.toThrow("Auth Failed");
});
//testing when supabase returns no user
test("when no user, throw 'user not authenticated' error", async () => {
    //mocks user as null
    supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
    });
    //throws "user not authenticated" error
    await expect(swipeService.getSwipeStatus()).rejects.toThrow("User not Authenticated");
});
