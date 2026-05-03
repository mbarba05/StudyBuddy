import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { from_user_id, to_user_id, fromUserName } = await req.json();

    // Insert friend request
    const { error } = await supabase
      .from("friend_requests")
      .insert({ from_user_id, to_user_id });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    // Get recipient push token
    const { data: recipient } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", to_user_id)
      .single();

    // Send Native Notify push
    if (recipient?.push_token) {
      await fetch("https://app.nativenotify.com/api/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appId: parseInt(Deno.env.get("EXPO_PUBLIC_NATIVE_NOTIFY_APP_ID")!),
          appToken: Deno.env.get("EXPO_PUBLIC_NATIVE_NOTIFY_APP_TOKEN"),
          title: "StudyBuddy",
          body: `${fromUserName} sent you a friend request!`,
          userIds: [to_user_id]
        })
      });
    }

    return new Response(JSON.stringify({ success: true }));

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});