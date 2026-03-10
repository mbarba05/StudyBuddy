import supabase from "@/lib/subapase";

//calling Edge Function and returning a string

export async function getProfessorSummary(
    profId: number,
    professorName?: string
): Promise<string> {
    try{
        const { data, error } = await supabase.functions.invoke("aiSummary", {
            body: {profId, professorName },
        });

        if(error){
            console.warn("Edge Function Error in aiSummary.ts", error.message);
            const res = (error as any).context as Response | undefined;
            try{
                // used for debugging 
               const status = res?.status;
                const reqId = res?.headers?.get?.("sb-request-id") ?? "(no request id)";
                const bodyText = res ? await res.text() : "(no response)"; 
                
                console.warn("edge function status:", status);
                console.warn("sb-request-id:", reqId);
                console.warn("edge function body:", bodyText);

            } catch (e) {
              console.warn("failed reading edge response body:", e);
            }
            return "Summary Unavailable";
        }

        const summary = data?.summary;
        if(typeof summary !== "string" || summary.trim().length === 0){
            return "Summary Unavailable";
        }
        return summary.trim();
    } catch(e){
        console.warn("aiSummary throws error: ", e);
        return "Summary Unavailable";
    }
}