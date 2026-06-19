// Schedules OneSignal Web Push notifications for the next 24h of timetable
// blocks. Cancels previously-scheduled notifications (tracked by the client)
// before creating new ones, so re-syncing on block edits never duplicates.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ONESIGNAL_APP_ID = "b48c9bb2-d747-419d-84e1-967c7bd24ab1";
const REST_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
const API = "https://api.onesignal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Block {
  id: string;
  title: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
}

interface Payload {
  subscriptionId: string;
  blocks: Block[];
  leadMinutes?: number;
  previousNotificationIds?: string[];
  tzOffsetMinutes: number; // browser's getTimezoneOffset (minutes WEST of UTC)
}

const fmtTime = (m: number) => {
  const h = Math.floor(m / 60), min = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!REST_KEY) {
    return new Response(JSON.stringify({ error: "ONESIGNAL_REST_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Payload;
    const { subscriptionId, blocks, leadMinutes = 0, previousNotificationIds = [], tzOffsetMinutes } = body;
    if (!subscriptionId) throw new Error("subscriptionId required");

    const headers = {
      "Authorization": `Key ${REST_KEY}`,
      "Content-Type": "application/json",
    };

    // Cancel previously-scheduled notifications.
    const cancelResults = await Promise.allSettled(
      previousNotificationIds.map((id) =>
        fetch(`${API}/notifications/${id}?app_id=${ONESIGNAL_APP_ID}`, { method: "DELETE", headers })
      )
    );

    // Build the list of fire times in UTC for the next 24h.
    const nowUtcMs = Date.now();
    const horizon = nowUtcMs + 24 * 60 * 60 * 1000;
    // tzOffsetMinutes: minutes WEST of UTC. So user-local time = UTC - tzOffsetMinutes.
    // For a given local Y/M/D HH:MM, the UTC ms = Date.UTC(Y,M,D,HH,MM) + tzOffsetMinutes*60000.
    const localNow = new Date(nowUtcMs - tzOffsetMinutes * 60_000);
    const items: Array<{ block: Block; sendAt: Date }> = [];
    for (let d = 0; d < 2; d++) {
      const localDay = new Date(localNow);
      localDay.setUTCDate(localDay.getUTCDate() + d);
      const dow = localDay.getUTCDay();
      const y = localDay.getUTCFullYear(), m = localDay.getUTCMonth(), day = localDay.getUTCDate();
      for (const b of blocks.filter((x) => x.day_of_week === dow)) {
        const targetMin = b.start_minute - leadMinutes;
        const fireUtc = Date.UTC(y, m, day, 0, targetMin) + tzOffsetMinutes * 60_000;
        if (fireUtc > nowUtcMs + 30_000 && fireUtc <= horizon) {
          items.push({ block: b, sendAt: new Date(fireUtc) });
        }
      }
    }

    const createdIds: string[] = [];
    for (const { block, sendAt } of items) {
      const lead = leadMinutes > 0 ? ` (in ${leadMinutes} min)` : "";
      const res = await fetch(`${API}/notifications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: [subscriptionId],
          target_channel: "push",
          headings: { en: `Time for ${block.title}!${lead}` },
          contents: { en: `${fmtTime(block.start_minute)} – ${fmtTime(block.end_minute)}` },
          send_after: sendAt.toISOString(),
          web_url: "/",
        }),
      });
      const json = await res.json();
      if (res.ok && json.id) createdIds.push(json.id);
      else console.error("OneSignal create failed:", res.status, json);
    }

    return new Response(
      JSON.stringify({
        scheduled: createdIds.length,
        cancelled: cancelResults.filter((r) => r.status === "fulfilled").length,
        notificationIds: createdIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("schedule-onesignal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
