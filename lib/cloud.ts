import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

import { createEmptyAppData } from "@/lib/demo-data";
import { AppData } from "@/lib/types";

export const CLOUD_MIGRATED_KEY = "ganpati-cloud-migrated-v1";

export const CLOUD_COLLECTIONS = [
  "users",
  "mandals",
  "memberships",
  "joinRequests",
  "donations",
  "expenses",
  "budgets",
  "events",
  "volunteers",
  "vendors",
  "inventory",
  "poojas",
  "prasads",
  "notifications",
  "activities",
  "financeCategories",
  "feedbacks",
] as const;

export type CloudCollection = (typeof CLOUD_COLLECTIONS)[number];

type SharedRecord = {
  collection: CloudCollection;
  id: string;
  payload: unknown;
  updated_at: string;
};

type CloudSnapshot = Pick<AppData, CloudCollection>;

type CloudPullResult = {
  data: CloudSnapshot;
  error?: string;
  skipped: boolean;
};

let client: SupabaseClient | null | undefined;
let syncInFlight: Promise<Omit<CloudPullResult, "skipped">> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPrev: AppData | null = null;
let pendingNext: AppData | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export function isCloudEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    client = null;
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function emptyCloudCollections(): Pick<AppData, CloudCollection> {
  const empty = createEmptyAppData();
  return {
    users: empty.users,
    mandals: empty.mandals,
    memberships: empty.memberships,
    joinRequests: empty.joinRequests,
    donations: empty.donations,
    expenses: empty.expenses,
    budgets: empty.budgets,
    events: empty.events,
    volunteers: empty.volunteers,
    vendors: empty.vendors,
    inventory: empty.inventory,
    poojas: empty.poojas,
    prasads: empty.prasads,
    notifications: empty.notifications,
    activities: empty.activities,
    financeCategories: empty.financeCategories,
    feedbacks: empty.feedbacks,
  };
}

function asCollectionData(rows: SharedRecord[]): Pick<AppData, CloudCollection> {
  const next = emptyCloudCollections();
  next.users = [];
  for (const row of rows) {
    if (!CLOUD_COLLECTIONS.includes(row.collection) || !row.payload || typeof row.payload !== "object") continue;
    const list = next[row.collection] as { id: string }[];
    list.push(row.payload as { id: string });
  }
  if (next.users.length === 0) {
    next.users = createEmptyAppData().users;
  }
  return next;
}

async function fetchAllRecords() {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: emptyCloudCollections(), error: "Cloud sync is not configured." };
  }

  const { data, error } = await supabase.from("shared_records").select("collection,id,payload,updated_at");
  if (error) {
    return {
      data: emptyCloudCollections(),
      error: error.message.includes("shared_records")
        ? "Cloud table is missing. Run supabase/schema.sql in the Supabase SQL editor."
        : error.message,
    };
  }

  return { data: asCollectionData((data ?? []) as SharedRecord[]), error: undefined };
}

async function upsertRecords(records: SharedRecord[]) {
  const supabase = getSupabase();
  if (!supabase || records.length === 0) return;
  const { error } = await supabase.from("shared_records").upsert(records, { onConflict: "collection,id" });
  if (error) throw error;
}

async function deleteRecords(records: Array<{ collection: CloudCollection; id: string }>) {
  const supabase = getSupabase();
  if (!supabase || records.length === 0) return;
  for (const record of records) {
    const { error } = await supabase
      .from("shared_records")
      .delete()
      .eq("collection", record.collection)
      .eq("id", record.id);
    if (error) throw error;
  }
}

function toRecords(collections: Pick<AppData, CloudCollection>) {
  const now = new Date().toISOString();
  const records: SharedRecord[] = [];
  for (const collection of CLOUD_COLLECTIONS) {
    for (const item of collections[collection] as { id: string }[]) {
      records.push({
        collection,
        id: item.id,
        payload: item,
        updated_at: now,
      });
    }
  }
  return records;
}

export async function pullCloudState(): Promise<CloudPullResult> {
  if (!isCloudEnabled()) {
    return { data: emptyCloudCollections(), skipped: true };
  }
  if (syncInFlight) {
    const result = await syncInFlight;
    return { ...result, skipped: false };
  }

  syncInFlight = (async () => {
    try {
      return await fetchAllRecords();
    } catch (error) {
      return {
        data: emptyCloudCollections(),
        error: error instanceof Error ? error.message : "Could not load shared data.",
      };
    }
  })();

  try {
    const result = await syncInFlight;
    return { ...result, skipped: false };
  } finally {
    syncInFlight = null;
  }
}

export async function pushAllCollections(state: Pick<AppData, CloudCollection>) {
  if (!isCloudEnabled()) return;
  await upsertRecords(toRecords(state));
}

function diffCollections(prev: Pick<AppData, CloudCollection>, next: Pick<AppData, CloudCollection>) {
  const upserts: SharedRecord[] = [];
  const deletes: Array<{ collection: CloudCollection; id: string }> = [];
  const now = new Date().toISOString();

  for (const collection of CLOUD_COLLECTIONS) {
    const prevItems = prev[collection] as { id: string }[];
    const nextItems = next[collection] as { id: string }[];
    const prevMap = new Map(prevItems.map((item) => [item.id, item]));
    const nextMap = new Map(nextItems.map((item) => [item.id, item]));

    for (const [id, item] of nextMap) {
      const previous = prevMap.get(id);
      if (!previous || JSON.stringify(previous) !== JSON.stringify(item)) {
        upserts.push({ collection, id, payload: item, updated_at: now });
      }
    }
    for (const id of prevMap.keys()) {
      if (!nextMap.has(id)) deletes.push({ collection, id });
    }
  }

  return { upserts, deletes };
}

export function scheduleCloudPush(prev: AppData, next: AppData) {
  if (!isCloudEnabled()) return;
  if (!pendingPrev) pendingPrev = prev;
  pendingNext = next;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const from = pendingPrev;
    const to = pendingNext;
    pendingPrev = null;
    pendingNext = null;
    pushTimer = null;
    if (!from || !to) return;
    const { upserts, deletes } = diffCollections(from, to);
    void (async () => {
      try {
        await upsertRecords(upserts);
        await deleteRecords(deletes);
      } catch (error) {
        console.error("Cloud push failed", error);
      }
    })();
  }, 350);
}

export function subscribeToCloud(
  onChange: (change: {
    event: "INSERT" | "UPDATE" | "DELETE";
    collection: CloudCollection;
    id: string;
    payload?: { id: string };
  }) => void,
) {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel("shared-records")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shared_records" },
      (payload) => {
        const event = payload.eventType;
        const row = (event === "DELETE" ? payload.old : payload.new) as Partial<SharedRecord> | undefined;
        if (!row?.collection || !row.id || !CLOUD_COLLECTIONS.includes(row.collection as CloudCollection)) return;
        onChange({
          event,
          collection: row.collection as CloudCollection,
          id: row.id,
          payload: row.payload as { id: string } | undefined,
        });
      },
    )
    .subscribe();

  return () => {
    if (!realtimeChannel) return;
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  };
}

export function applyCloudRecordChange<T extends { id: string }>(
  items: T[],
  change: {
    event: "INSERT" | "UPDATE" | "DELETE";
    id: string;
    payload?: { id: string };
  },
) {
  if (change.event === "DELETE") {
    return items.filter((item) => item.id !== change.id);
  }
  if (!change.payload) return items;
  const nextItem = change.payload as T;
  const exists = items.some((item) => item.id === change.id);
  if (!exists) return [nextItem, ...items];
  return items.map((item) => (item.id === change.id ? nextItem : item));
}

export function markCloudMigrated() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOUD_MIGRATED_KEY, "1");
}

export function hasCloudMigrated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLOUD_MIGRATED_KEY) === "1";
}
