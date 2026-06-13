// Supabase Edge Function — called by QStash CRON every 5 minutes.
// Uses native Web Crypto API (no npm dependencies) for VAPID + push encryption.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY = (Deno.env.get("VAPID_PUBLIC_KEY") ?? "").trim();
const VAPID_PRIVATE_KEY = (Deno.env.get("VAPID_PRIVATE_KEY") ?? "").trim();
const VAPID_SUBJECT = "https://jmitsuominor-ux.github.io/peptide-reference/";

console.log(`[init] pub=${VAPID_PUBLIC_KEY.length}c priv=${VAPID_PRIVATE_KEY.length}c`);

// ── Crypto helpers ────────────────────────────────────────────────────────────

function b64u(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function from64u(s: string): Uint8Array {
  const b = s.trim().replace(/-/g, "+").replace(/_/g, "/");
  const p = b + "=".repeat((4 - (b.length % 4)) % 4);
  return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

async function hmac256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  len: number,
): Promise<Uint8Array> {
  const prk = await hmac256(salt, ikm);
  const n = Math.ceil(len / 32);
  const out = new Uint8Array(n * 32);
  let prev = new Uint8Array(0);
  for (let i = 0; i < n; i++) {
    prev = await hmac256(prk, concat(prev, info, new Uint8Array([i + 1])));
    out.set(prev, i * 32);
  }
  return out.slice(0, len);
}

async function buildVapidAuth(endpoint: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const te = new TextEncoder();
  const pubBytes = from64u(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC", crv: "P-256",
      x: b64u(pubBytes.slice(1, 33)),
      y: b64u(pubBytes.slice(33, 65)),
      d: VAPID_PRIVATE_KEY,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const hdr = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const pld = b64u(te.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUBJECT,
  })));
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      te.encode(`${hdr}.${pld}`),
    ),
  );
  return `vapid t=${hdr}.${pld}.${b64u(sig)},k=${VAPID_PUBLIC_KEY}`;
}

async function encryptPayload(
  plaintext: string,
  p256dhB64u: string,
  authB64u: string,
): Promise<{ body: Uint8Array; encoding: string }> {
  const te = new TextEncoder();
  const receiverPub = from64u(p256dhB64u);
  const authSecret = from64u(authB64u);

  const senderKP = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],
  );
  const senderPub = new Uint8Array(await crypto.subtle.exportKey("raw", senderKP.publicKey));

  const receiverKey = await crypto.subtle.importKey(
    "raw", receiverPub, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: receiverKey }, senderKP.privateKey, 256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyInfo = concat(te.encode("WebPush: info\x00"), receiverPub, senderPub);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\x00\x01"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\x00\x01"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      aesKey,
      concat(te.encode(plaintext), new Uint8Array([2])),
    ),
  );

  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, 4096, false);
  const body = concat(salt, rsBytes, new Uint8Array([senderPub.length]), senderPub, ciphertext);
  return { body, encoding: "aes128gcm" };
}

async function sendPush(
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object,
): Promise<number> {
  const auth = await buildVapidAuth(sub.endpoint);
  const { body, encoding } = await encryptPayload(
    JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth,
  );
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Encoding": encoding,
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body,
  });
  return res.status;
}

function isDueToday(entry: Record<string, unknown>, localDow: number): boolean {
  const freq = entry.frequency as string;
  if (freq === "as_needed") return false;
  if (freq === "daily") return true;
  const days = entry.days_of_week as number[] | null;
  return Array.isArray(days) && days.includes(localDow);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const nowUtc = new Date();
  console.log(`[run] ${nowUtc.toISOString()}`);

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[fatal] VAPID keys missing from environment");
      return new Response("VAPID keys not configured", { status: 500 });
    }

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subsErr) {
      console.error("[db]", subsErr.message);
      return new Response("DB error: " + subsErr.message, { status: 500 });
    }

    const allSubs = subs ?? [];
    console.log(`[subs] active rows: ${allSubs.length}`);

    const validSubs = allSubs.filter((s) => {
      if (typeof s.subscription !== "string") {
        console.log(`[subs] ${s.user_id}: subscription not a string`);
        return false;
      }
      try {
        const p = JSON.parse(s.subscription);
        const ok = !!p.endpoint && !!p.keys?.p256dh && !!p.keys?.auth;
        if (!ok) console.log(`[subs] ${s.user_id}: missing endpoint or keys`);
        return ok;
      } catch {
        console.log(`[subs] ${s.user_id}: JSON parse failed`);
        return false;
      }
    });
    console.log(`[subs] valid: ${validSubs.length}`);

    const LOOKBACK = 6;
    const WINDOW = 5;
    let totalSent = 0;

    for (const sub of validSubs) {
      const subscriptionObj = JSON.parse(sub.subscription);
      const localNow = new Date(nowUtc.getTime() - sub.timezone_offset * 60 * 1000);
      const localHour = localNow.getUTCHours();
      const localMinute = localNow.getUTCMinutes();
      const localDow = localNow.getUTCDay();
      const localDate = `${localNow.getUTCFullYear()}-${
        String(localNow.getUTCMonth() + 1).padStart(2, "0")}-${
        String(localNow.getUTCDate()).padStart(2, "0")}`;
      const localTimeStr = `${String(localHour).padStart(2, "0")}:${String(localMinute).padStart(2, "0")}`;
      console.log(`[user] ${sub.user_id} tz=${sub.timezone_offset} local=${localTimeStr} dow=${localDow} date=${localDate}`);

      const { data: entries, error: entErr } = await supabase
        .from("schedule_entries")
        .select(
          "id, compound_name, dose, reminder_time, reminder_time_2, frequency, days_of_week, schedules!inner(is_active)",
        )
        .eq("user_id", sub.user_id)
        .eq("is_active", true)
        .eq("schedules.is_active", true);

      if (entErr) {
        console.log(`[user] ${sub.user_id} entries error: ${entErr.message}`);
        continue;
      }
      console.log(`[user] ${sub.user_id} entries: ${entries?.length ?? 0}`);
      if (!entries?.length) continue;

      const nowTotalMin = localHour * 60 + localMinute;
      type Slot = { entry: typeof entries[0]; reminder_time: string; slot: number };
      const slots: Slot[] = [];

      for (const e of entries) {
        if (!isDueToday(e, localDow)) {
          console.log(`[entry] ${e.compound_name}: not due today (freq=${e.frequency} days=${JSON.stringify(e.days_of_week)})`);
          continue;
        }
        for (
          const [idx, rt] of (
            [e.reminder_time || "20:00", e.reminder_time_2] as (string | null)[]
          ).entries()
        ) {
          if (!rt) continue;
          const [h, m] = rt.split(":").map(Number);
          const rem = h * 60 + m;
          const inWindow = rem >= nowTotalMin - LOOKBACK && rem < nowTotalMin + WINDOW;
          console.log(
            `[entry] ${e.compound_name} slot${idx + 1} @${rt}(${rem}) window=[${nowTotalMin - LOOKBACK},${nowTotalMin + WINDOW}) in=${inWindow}`,
          );
          if (inWindow) slots.push({ entry: e, reminder_time: rt, slot: idx + 1 });
        }
      }

      if (!slots.length) {
        console.log(`[user] ${sub.user_id}: no slots in current window`);
        continue;
      }

      const { data: alreadySent } = await supabase
        .from("notification_log")
        .select("entry_id, reminder_slot")
        .eq("user_id", sub.user_id)
        .eq("sent_date", localDate);

      const sentSet = new Set((alreadySent ?? []).map((r) => `${r.entry_id}:${r.reminder_slot ?? 1}`));
      const toSend = slots.filter((s) => !sentSet.has(`${s.entry.id}:${s.slot}`));
      if (!toSend.length) {
        console.log(`[user] ${sub.user_id}: all due slots already sent today`);
        continue;
      }

      const groups: Record<string, Slot[]> = {};
      toSend.forEach((s) => { (groups[s.reminder_time] ??= []).push(s); });

      for (const [time, groupSlots] of Object.entries(groups)) {
        const doses = groupSlots.map((s) => `${s.entry.compound_name}: ${s.entry.dose}`).join(" · ");
        try {
          console.log(`[push] → ${doses}`);
          const status = await sendPush(subscriptionObj, {
            title: "Time for your peptides 💉",
            body: doses,
            tag: `peptideref-${localDate}-${time.replace(":", "")}`,
          });
          console.log(`[push] status=${status}`);

          if (status === 200 || status === 201 || status === 204) {
            await supabase.from("notification_log").insert(
              groupSlots.map((s) => ({
                user_id: sub.user_id,
                entry_id: s.entry.id,
                sent_date: localDate,
                reminder_slot: s.slot,
              })),
            );
            console.log(`[push] ✅ sent+logged`);
            totalSent++;
          } else if (status === 410) {
            await supabase.from("push_subscriptions")
              .update({ is_active: false })
              .eq("user_id", sub.user_id);
            console.log(`[push] 410 subscription expired — marked inactive`);
          } else {
            console.error(`[push] ❌ unexpected status ${status}`);
          }
        } catch (err: unknown) {
          console.error(`[push] ❌ ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    console.log(`[done] sent=${totalSent}`);
    return new Response(`OK sent=${totalSent}`, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? `${err.message}\n${(err as Error).stack}` : String(err);
    console.error(`[fatal] ${msg}`);
    return new Response(`Error: ${msg}`, { status: 500 });
  }
});
