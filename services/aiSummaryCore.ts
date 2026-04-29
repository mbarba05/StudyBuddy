export type ReqBody = {
    profId: number | string;
    professorName?: string;
};

//helper functiont to simplify the message calling
// we just call return json({message: "ok" }); instead of rewrititng the whole time
export function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }, // data getting returning is json
    });
}

export async function handleRequest(
    req: Request,
    deps: {
        admin: any;
        apiKey: string;
        fetchFn: typeof fetch;
        updateSummaryTH?: number;
    },
) {
    try {
        if (req.method !== "POST") return json({ error: "Use POST" }, 405);
        const body = (await req.json()) as ReqBody; //converting incoing data into javaScript Obj
        //    console.log("body: ", body);

        const { profId, professorName } = body; //creates variables profId and professorName

        const profIdNum = typeof profId === "string" ? Number(profId) : profId;
        //    console.log("parsed: ", {profId, profIdNum, professorName });

        if (!Number.isFinite(profIdNum) || profIdNum <= 0) {
            //finiate (checks if its a valid number  and >= 0)
            return json({ error: "Invalid Professor ID" }, 400);
        }
        const admin = deps.admin;

        // grabbing reviews from supabase using a RPC call
        //    console.log("calling rpc with : ", {p_prof_id: profIdNum });
        const { data: reviewRows, error: reviewErr } = await admin.rpc("get_reviews_by_professor", {
            p_prof_id: profIdNum,
        });
        //    console.log("rpc results: ", {hasRows: Array.isArray(reviewRows), len: reviewRows?.length, reviewErr});
        //    console.log("first row sample:", reviewRows?.[0]);

        if (reviewErr) {
            return json({ error: "Fetching reviews failed", details: reviewErr.message }, 500);
        }

        // creating an array that has up to 120 valid, non-empty reviews
        const reviews: string[] = (reviewRows ?? [])
            .map((r: any) => (typeof r.review === "string" ? r.review : ""))
            .map((t: string) => t.trim())
            .filter(Boolean)
            .slice(0, 120);

        const currentReviewCount = reviews.length;

        //if no reviews, returns no summary unavailable
        if (currentReviewCount === 0) {
            return json({ summary: "Summary Unavailable", review_count: 0, cachedSummary: true });
        }

        // grabbing saved summaries
        const { data: cachedSummary, error: cachedErr } = await admin
            .from("professor_summaries")
            .select("summary, review_count, updated_at")
            .eq("prof_id", profIdNum)
            .maybeSingle();

        if (cachedErr) {
            return json({ error: "Can't read saved summary", details: cachedErr.message }, 500);
        }

        const updateSummary = deps.updateSummaryTH ?? 7;

        if (cachedSummary?.summary && currentReviewCount - cachedSummary.review_count < updateSummary) {
            return json({
                summary: cachedSummary.summary,
                review_count: cachedSummary.review_count,
                cachedSummary: true,
                updatedAt: cachedSummary.updated_at,
            });
        }

        //when calling groq api this is the promt it uses
        const joined = reviews.join("\n- ");
        const prompt = `
          You will summarize reviews about professors in a neutral tone and make it simple to understand.
          Professor: ${professorName ?? "unknown"}
          Write: 
          1). Summary is to be less than 3 sentences long.
          2). Provide a One Word discription for the professor. 
          3). Provde what are the common complaints in a list. If none, do not include.
        
          rules: 
          - Do not fabricate facts.
          - keep it 100% true to reviews.
          - do not sugar coat the facts.
          - If reviews conflict, remove it from the review.
        
        
          Reviews:
          -${joined}
          `.trim();
        const apiRes = await deps.fetchFn("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${deps.apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", //model being used
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4, //randomness of the model, 0.8+ more creative, >0.3 consistent, 0.4-0.7 balanced
                max_tokens: 250,
            }),
        });
        //making sure api is working
        if (!apiRes.ok) {
            const errText = await apiRes.text();
            return json({ error: "API request failed", details: errText }, 500);
        }
        const apiData = await apiRes.json();
        const summary: string | null = apiData?.choices?.[0]?.message?.content?.trim() ?? null;

        if (!summary) {
            return json({ summary: "Summary Unavailable", review_count: currentReviewCount, cachedSummary: false });
        }

        //upsert into table
        const { error: upsertErr } = await admin
            .from("professor_summaries")
            .upsert({ prof_id: profIdNum, summary, review_count: currentReviewCount }, { onConflict: "prof_id" });

        if (upsertErr) {
            return json({ error: "Summary saving Faled", details: upsertErr.message }, 500);
        }
        return json({ summary, review_count: currentReviewCount, cachedSummary: false });
    } catch (e) {
        return json({ error: String(e) }, 500);
    }
}
