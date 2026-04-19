import { handleRequest } from "@/services/aiSummaryCore";
// mocking POST request to edge function
function mockReq(body: any) {
    return new Request("https://test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}
async function resJson(res: Response) {
    return await res.json();
}
//mocking Admin
function adminMock(opts: {
    rpcData: any[];
    cachedSummary: any | null;
    cachedErr?: any | null;
    upsertErr?: any | null;
}) {
    const maybeSingle = jest.fn().mockResolvedValue({
        data: opts.cachedSummary,
        error: opts.cachedErr ?? null,
    });

    const upsert = jest.fn().mockResolvedValue({
        error: opts.upsertErr ?? null,
    });

    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select, eq, maybeSingle, upsert }));

    const rpc = jest.fn().mockResolvedValue({
        data: opts.rpcData,
        error: null,
    });
    return {
        rpc,
        from,
        __mocks: { rpc, from, select, eq, maybeSingle, upsert },
    };
}

describe("aiSummary handleRequest", () => {
    test("1)No Reviews -> returns Summary Unavailable with count 0", async () => {
        const admin = adminMock({
            rpcData: [],
            cachedSummary: null,
        });

        const fetchFn = jest.fn();
        const apiKey = "test-key";

        const res = await handleRequest(mockReq({ profId: 10, professorName: "Test Professor" }), {
            admin,
            apiKey,
            fetchFn: fetchFn as any,
            updateSummaryTH: 7,
        });

        const out = await resJson(res);
        expect(res.status).toBe(200);
        expect(out.summary).toBe("Summary Unavailable");
        expect(out.review_count).toBe(0);
        expect(out.cachedSummary).toBe(true);

        expect(fetchFn).not.toHaveBeenCalled();
    });
    //test 2
    test("2) Saved summary returns due to not enough new Reviews", async () => {
        const reviews = Array.from({ length: 24 }, (_, i) => ({
            review: `Review ${i}`,
        }));
        const admin = adminMock({
            rpcData: reviews,
            cachedSummary: {
                summary: "Saved Summary",
                review_count: 20,
                updated_at: "2026-01-01",
            },
        });
        const fetchFn = jest.fn(); // Api doesnt get called
        const apiKey = "test-key";

        const res = await handleRequest(
            mockReq({
                profId: 10,
                professorName: "Test Professor",
            }),
            {
                admin,
                apiKey,
                fetchFn: fetchFn as any,
                updateSummaryTH: 7,
            },
        );
        const out = await resJson(res);

        expect(res.status).toBe(200);
        expect(out.summary).toBe("Saved Summary");
        expect(out.review_count).toBe(20);
        expect(out.cachedSummary).toBe(true);

        expect(fetchFn).not.toHaveBeenCalled();
    });
    //test 3
    test("3)New summary, Api is triggered/called when enough new reviews are added", async () => {
        const reviews = Array.from({ length: 30 }, (_, i) => ({
            review: `Review ${i}`,
        }));
        const admin = adminMock({
            rpcData: reviews,
            cachedSummary: {
                summary: "Old Saved summary is here",
                review_count: 20,
                updated_at: "2026-01-01",
            },
        });
        const apiKey = "test-key";

        //mocking api
        const fetchFn = jest.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    choices: [{ message: { content: "New Ai Summary" } }],
                }),
                { status: 200 },
            ),
        );
        const res = await handleRequest(
            mockReq({
                profId: 10,
                professorName: "Test Professor",
            }),
            {
                admin,
                apiKey,
                fetchFn,
                updateSummaryTH: 7,
            },
        );
        const out = await resJson(res);

        expect(res.status).toBe(200);
        expect(out.summary).toBe("New Ai Summary");
        expect(out.review_count).toBe(30);
        expect(out.cachedSummary).toBe(false);

        expect(fetchFn).toHaveBeenCalledTimes(1); //Ai is called
    });
});
