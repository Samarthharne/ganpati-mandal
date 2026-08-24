import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createEmptyAppData } from "@/lib/demo-data";
import {
  ActivityItem,
  ActivityActionType,
  ActivityStatus,
  ActivityStatusLog,
  AppData,
  Donation,
  EventItem,
  Expense,
  FinanceCategory,
  InventoryItem,
  JoinRequest,
  Mandal,
  Membership,
  FeedbackItem,
  NotificationItem,
  PoojaItem,
  PrasadItem,
  Role,
  User,
  Vendor,
  Volunteer,
} from "@/lib/types";
import {
  DEFAULT_DONATION_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  generateId,
  generateJoinCode,
  formatCurrency,
} from "@/lib/utils";
import { canTransitionActivity, emailsMatch, joinRequestBelongsToUser, membershipBelongsToUser, migrateActivityStatus, needsActivityApproval, normalizeRole } from "@/lib/permissions";

type Submitter = { userId: string; name: string; role: Role };

type AppState = AppData & {
  login: (username: string, password: string) => User | null;
  register: (payload: { name: string; phone: string; email: string; username: string; password: string }) => User | null;
  logout: () => void;
  resetData: () => void;
  setCurrentMandal: (mandalId: string | null) => void;
  setDemoRole: (role: Role) => void;
  toggleTheme: () => void;
  createMandal: (payload: Omit<Mandal, "id" | "createdAt" | "updatedAt" | "festivalDay" | "logo" | "ownerId" | "joinCode">) => void;
  deleteMandal: (mandalId: string) => void;
  addMember: (payload: Omit<Membership, "id" | "createdAt" | "updatedAt" | "userId" | "mandalId" | "joinedAt"> & { mandalId: string }) => void;
  updateMemberRole: (membershipId: string, role: Role) => void;
  removeMember: (membershipId: string) => void;
  submitJoinRequest: (payload: Omit<JoinRequest, "id" | "createdAt" | "updatedAt" | "status" | "requestedAt">) => void;
  requestJoinByCode: (code: string) => "not_found" | "already_member" | "pending" | "owner" | "success";
  updateJoinRequestStatus: (requestId: string, status: "APPROVED" | "REJECTED") => void;
  addFinanceCategory: (mandalId: string, type: FinanceCategory["type"], name: string) => void;
  removeFinanceCategory: (categoryId: string) => void;
  addDonation: (payload: Omit<Donation, "id" | "createdAt" | "updatedAt">, submitter: Submitter) => "added" | "pending";
  addExpense: (payload: Omit<Expense, "id" | "createdAt" | "updatedAt">, submitter: Submitter) => "added" | "pending";
  deleteExpense: (expenseId: string) => void;
  addEvent: (payload: Omit<EventItem, "id" | "createdAt" | "updatedAt">, submitter: Submitter) => "added" | "pending";
  addMandalActivity: (payload: { mandalId: string; title: string; location?: string; notes: string }, submitter: Submitter) => "added" | "pending";
  updateActivityStatus: (activityId: string, status: ActivityStatus, comment: string, actor: Submitter) => boolean;
  addVolunteer: (payload: Omit<Volunteer, "id" | "createdAt" | "updatedAt">) => void;
  addVendor: (payload: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => void;
  addInventoryItem: (payload: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
  addPooja: (payload: Omit<PoojaItem, "id" | "createdAt" | "updatedAt">) => void;
  addPrasad: (payload: Omit<PrasadItem, "id" | "createdAt" | "updatedAt">) => void;
  markNotificationRead: (notificationId: string) => void;
  submitFeedback: (payload: { userId: string; userName: string; mandalId: string | null; message: string; rating: number }) => void;
};

const initialData = createEmptyAppData();

const LEGACY_DEFAULT_CATEGORY_NAMES = new Set([
  ...DEFAULT_DONATION_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
]);

function ensureJoinCode(mandal: Mandal, existingCodes: Set<string>): Mandal {
  if (mandal.joinCode) return mandal;
  let joinCode = generateJoinCode();
  while (existingCodes.has(joinCode)) {
    joinCode = generateJoinCode();
  }
  existingCodes.add(joinCode);
  return { ...mandal, joinCode };
}

function migrateAppData(data: Partial<AppData>): AppData {
  const base = createEmptyAppData();
  const merged: AppData = {
    ...base,
    ...data,
    users: data.users?.length ? data.users : base.users,
    mandals: Array.isArray(data.mandals) ? data.mandals : [],
    memberships: Array.isArray(data.memberships) ? data.memberships : [],
    joinRequests: Array.isArray(data.joinRequests) ? data.joinRequests : [],
    donations: Array.isArray(data.donations) ? data.donations : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    budgets: Array.isArray(data.budgets) ? data.budgets : [],
    events: Array.isArray(data.events) ? data.events : [],
    volunteers: Array.isArray(data.volunteers) ? data.volunteers : [],
    vendors: Array.isArray(data.vendors) ? data.vendors : [],
    inventory: Array.isArray(data.inventory) ? data.inventory : [],
    poojas: Array.isArray(data.poojas) ? data.poojas : [],
    prasads: Array.isArray(data.prasads) ? data.prasads : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    activities: Array.isArray(data.activities) ? data.activities : [],
    financeCategories: Array.isArray(data.financeCategories) ? data.financeCategories : [],
    feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : [],
  };

  const existingCodes = new Set<string>();
  merged.mandals = merged.mandals.map((mandal) => ensureJoinCode(mandal, existingCodes));

  merged.financeCategories = merged.financeCategories.filter(
    (category) => !LEGACY_DEFAULT_CATEGORY_NAMES.has(category.name),
  );

  merged.memberships = merged.memberships.map((membership) => ({
    ...membership,
    role: normalizeRole(membership.role),
  }));

  merged.activities = merged.activities.map((item) => {
    const status = migrateActivityStatus(item.status as string);
    const history = Array.isArray(item.statusHistory) && item.statusHistory.length
      ? item.statusHistory
      : [{
          id: generateId("log"),
          fromStatus: null,
          toStatus: status,
          comment: "Migrated activity record",
          changedByUserId: item.submittedByUserId ?? "system",
          changedByName: item.submittedByName ?? "System",
          changedAt: item.createdAt ?? new Date().toISOString(),
        }];
    return {
      ...item,
      status,
      submittedByUserId: item.submittedByUserId ?? "system",
      submittedByName: item.submittedByName ?? "System",
      submittedByRole: normalizeRole(item.submittedByRole ?? "OWNER"),
      actionType: item.actionType ?? "system",
      statusHistory: history,
    };
  });

  return merged;
}

function sanitizePersistedData(persisted: unknown): AppData {
  const data = persisted as Partial<AppData> & { user?: unknown };

  if (!data || typeof data !== "object" || "user" in data || !Array.isArray(data.users)) {
    return createEmptyAppData();
  }

  return migrateAppData(data);
}

function meta(prefix: string) {
  const stamp = new Date().toISOString();
  return {
    id: generateId(prefix),
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function statusLog(
  fromStatus: ActivityStatus | null,
  toStatus: ActivityStatus,
  comment: string,
  actor: Submitter,
): ActivityStatusLog {
  return {
    id: generateId("log"),
    fromStatus,
    toStatus,
    comment,
    changedByUserId: actor.userId,
    changedByName: actor.name,
    changedAt: new Date().toISOString(),
  };
}

function actorFromState(state: AppData, mandalId?: string): Submitter {
  const currentUser = state.users.find((u) => u.id === state.currentUserId);
  if (!currentUser) {
    return { userId: "system", name: "System", role: "OWNER" };
  }
  const targetMandalId = mandalId ?? state.currentMandalId ?? undefined;
  const membership = targetMandalId
    ? state.memberships.find((m) => m.mandalId === targetMandalId && m.userId === currentUser.id)
    : undefined;
  if (membership) {
    return {
      userId: currentUser.id,
      name: currentUser.name,
      role: normalizeRole(membership.role),
    };
  }
  if (currentUser.isAdmin) {
    return { userId: currentUser.id, name: currentUser.name, role: "OWNER" };
  }
  return { userId: currentUser.id, name: currentUser.name, role: "MEMBER" };
}

function activity(
  mandalId: string,
  title: string,
  description: string,
  submitter: Submitter = { userId: "system", name: "System", role: "OWNER" },
  options?: {
    status?: ActivityStatus;
    actionType?: ActivityActionType;
    payload?: string;
    initialComment?: string;
  },
): ActivityItem {
  const status = options?.status ?? "DONE";
  const initialComment = options?.initialComment ?? "Activity created";
  return {
    ...meta("activity"),
    mandalId,
    title,
    description,
    status,
    submittedByUserId: submitter.userId,
    submittedByName: submitter.name,
    submittedByRole: normalizeRole(submitter.role),
    actionType: options?.actionType ?? "system",
    payload: options?.payload,
    statusHistory: [statusLog(null, status, initialComment, submitter)],
  };
}

function addDonationRecord(state: AppData, payload: Omit<Donation, "id" | "createdAt" | "updatedAt">) {
  return {
    donations: [{ ...meta("donation"), ...payload }, ...state.donations],
  };
}

function addExpenseRecord(state: AppData, payload: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  return {
    expenses: [{ ...meta("expense"), ...payload }, ...state.expenses],
  };
}

function addEventRecord(state: AppData, payload: Omit<EventItem, "id" | "createdAt" | "updatedAt">) {
  return {
    events: [{ ...meta("event"), ...payload }, ...state.events],
  };
}

function notification(
  mandalId: string,
  title: string,
  description: string,
  tone: NotificationItem["tone"],
  target: string,
): NotificationItem {
  return { ...meta("notification"), mandalId, title, description, tone, target, read: false };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password,
        );
        if (user) {
          set({ currentUserId: user.id, currentMandalId: null });
          return user;
        }
        return null;
      },

      register: (payload) => {
        const existing = get().users.find((u) => u.username === payload.username);
        if (existing) return null;
        const user: User = {
          ...meta("user"),
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          username: payload.username,
          password: payload.password,
          isAdmin: false,
        };
        set((state) => ({
          users: [...state.users, user],
          currentUserId: user.id,
          currentMandalId: null,
        }));
        return user;
      },

      logout: () => set({ currentUserId: null, currentMandalId: null }),

      resetData: () => set(createEmptyAppData()),

      setCurrentMandal: (mandalId) => set({ currentMandalId: mandalId }),
      setDemoRole: (role) => set({ demoRole: role }),
      toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),

      createMandal: (payload) =>
        set((state) => {
          const currentUser = state.users.find((u) => u.id === state.currentUserId);
          if (!currentUser) return state;
          const mandalId = generateId("mandal");
          const existingCodes = new Set(state.mandals.map((mandal) => mandal.joinCode).filter(Boolean));
          let joinCode = generateJoinCode();
          while (existingCodes.has(joinCode)) {
            joinCode = generateJoinCode();
          }
          const mandal: Mandal = {
            ...meta("mandal"),
            id: mandalId,
            festivalDay: 1,
            logo: "🕉️",
            ownerId: currentUser.id,
            ...payload,
            joinCode,
          };
          const membership: Membership = {
            ...meta("membership"),
            mandalId,
            userId: currentUser.id,
            name: currentUser.name,
            phone: currentUser.phone,
            email: currentUser.email,
            role: "OWNER",
            joinedAt: new Date().toISOString(),
          };
          return {
            mandals: [mandal, ...state.mandals],
            memberships: [membership, ...state.memberships],
            currentMandalId: mandalId,
            activities: [
              activity(
                mandalId,
                "Mandal created",
                `${payload.name} was created successfully.`,
                { userId: currentUser.id, name: currentUser.name, role: "OWNER" },
              ),
              ...state.activities,
            ],
            notifications: [
              notification(mandalId, "Your Mandal is ready", `Share join code ${joinCode} so members can request to join.`, "success", "requests"),
              ...state.notifications,
            ],
          };
        }),

      deleteMandal: (mandalId) =>
        set((state) => ({
          mandals: state.mandals.filter((m) => m.id !== mandalId),
          memberships: state.memberships.filter((m) => m.mandalId !== mandalId),
          joinRequests: state.joinRequests.filter((r) => r.mandalId !== mandalId),
          donations: state.donations.filter((d) => d.mandalId !== mandalId),
          expenses: state.expenses.filter((e) => e.mandalId !== mandalId),
          budgets: state.budgets.filter((b) => b.mandalId !== mandalId),
          events: state.events.filter((e) => e.mandalId !== mandalId),
          volunteers: state.volunteers.filter((v) => v.mandalId !== mandalId),
          vendors: state.vendors.filter((v) => v.mandalId !== mandalId),
          inventory: state.inventory.filter((i) => i.mandalId !== mandalId),
          poojas: state.poojas.filter((p) => p.mandalId !== mandalId),
          prasads: state.prasads.filter((p) => p.mandalId !== mandalId),
          notifications: state.notifications.filter((n) => n.mandalId !== mandalId),
          activities: state.activities.filter((a) => a.mandalId !== mandalId),
          financeCategories: state.financeCategories.filter((c) => c.mandalId !== mandalId),
          currentMandalId: state.currentMandalId === mandalId ? null : state.currentMandalId,
        })),

      addMember: (payload) =>
        set((state) => {
          const actor = actorFromState(state, payload.mandalId);
          return {
            memberships: [
              {
                ...meta("membership"),
                mandalId: payload.mandalId,
                userId: generateId("user"),
                name: payload.name,
                phone: payload.phone,
                email: payload.email,
                role: payload.role,
                joinedAt: new Date().toISOString(),
              },
              ...state.memberships,
            ],
            activities: [
              activity(
                payload.mandalId,
                `${payload.name} added as member`,
                `Role assigned: ${payload.role.replace("_", " ")}.`,
                actor,
              ),
              ...state.activities,
            ],
          };
        }),
      updateMemberRole: (membershipId, role) =>
        set((state) => {
          const member = state.memberships.find((item) => item.id === membershipId);
          if (!member || member.role === "OWNER") return state;
          const nextRole = normalizeRole(role);
          if (nextRole === "OWNER") return state;
          if (!["MEMBER", "COMMITTEE_MEMBER"].includes(nextRole)) return state;
          const actor = actorFromState(state, member.mandalId);
          return {
            memberships: state.memberships.map((item) =>
              item.id === membershipId ? { ...item, role: nextRole, updatedAt: new Date().toISOString() } : item,
            ),
            activities: [
              activity(
                member.mandalId,
                `${member.name} role updated`,
                `Role changed to ${nextRole === "COMMITTEE_MEMBER" ? "Committee Member" : "Member"}.`,
                actor,
              ),
              ...state.activities,
            ],
          };
        }),
      removeMember: (membershipId) =>
        set((state) => ({
          memberships: state.memberships.filter((member) => member.id !== membershipId),
        })),
      submitJoinRequest: (payload) =>
        set((state) => ({
          joinRequests: [
            {
              ...meta("request"),
              ...payload,
              status: "PENDING",
              requestedAt: new Date().toISOString(),
            },
            ...state.joinRequests,
          ],
          notifications: [
            notification(payload.mandalId, `${payload.name} requested to join`, "A new join request needs review.", "info", "requests"),
            ...state.notifications,
          ],
        })),
      requestJoinByCode: (code) => {
        const state = get();
        const currentUser = state.users.find((u) => u.id === state.currentUserId);
        if (!currentUser) return "not_found" as const;

        const mandal = state.mandals.find((item) => item.joinCode?.toUpperCase() === code.trim().toUpperCase());
        if (!mandal) return "not_found" as const;
        if (mandal.ownerId === currentUser.id) return "owner" as const;

        const membership = state.memberships.find(
          (item) => item.mandalId === mandal.id && membershipBelongsToUser(item, currentUser),
        );
        if (membership) return "already_member" as const;

        const pending = state.joinRequests.find(
          (item) =>
            item.mandalId === mandal.id &&
            item.status === "PENDING" &&
            joinRequestBelongsToUser(item, currentUser),
        );
        if (pending) return "pending" as const;

        get().submitJoinRequest({
          mandalId: mandal.id,
          userId: currentUser.id,
          name: currentUser.name,
          phone: currentUser.phone,
          email: currentUser.email,
          message: `Requested to join using Mandal code ${mandal.joinCode}.`,
        });
        return "success" as const;
      },
      updateJoinRequestStatus: (requestId, status) =>
        set((state) => {
          const request = state.joinRequests.find((item) => item.id === requestId);
          if (!request) return state;
          const actor = actorFromState(state, request.mandalId);

          const nextRequests = state.joinRequests.map((item) =>
            item.id === requestId ? { ...item, status, updatedAt: new Date().toISOString() } : item,
          );

          const nextMemberships =
            status === "APPROVED"
              ? [
                  {
                    ...meta("membership"),
                    mandalId: request.mandalId,
                    userId:
                      request.userId ??
                      (request.email?.trim()
                        ? state.users.find((user) => emailsMatch(user.email, request.email))?.id
                        : undefined) ??
                      generateId("user"),
                    name: request.name,
                    phone: request.phone,
                    email: request.email,
                    role: "MEMBER" as Role,
                    joinedAt: new Date().toISOString(),
                  },
                  ...state.memberships,
                ]
              : state.memberships;

          return {
            joinRequests: nextRequests,
            memberships: nextMemberships,
            activities: [
              activity(
                request.mandalId,
                status === "APPROVED" ? `${request.name} joined the Mandal` : `${request.name} request rejected`,
                status === "APPROVED"
                  ? "The join request was approved and the member was added."
                  : "The join request was reviewed and rejected.",
                actor,
              ),
              ...state.activities,
            ],
          };
        }),
      addDonation: (payload, submitter) => {
        const comment = payload.notes?.trim() || "Donation submitted for approval.";
        set((state) => ({
          activities: [
            activity(
              payload.mandalId,
              `Donation request: ${payload.donorName}`,
              `${formatCurrency(payload.amount)} under ${payload.category} awaiting approval.`,
              submitter,
              {
                status: "PENDING",
                actionType: "donation",
                payload: JSON.stringify(payload),
                initialComment: comment,
              },
            ),
            ...state.activities,
          ],
          notifications: [
            notification(payload.mandalId, "Donation needs approval", `${submitter.name} submitted a donation.`, "info", "activities"),
            ...state.notifications,
          ],
        }));
        return "pending";
      },
      addExpense: (payload, submitter) => {
        const comment = payload.notes?.trim() || "Expense submitted for approval.";
        set((state) => ({
          activities: [
            activity(
              payload.mandalId,
              `Expense request: ${payload.title}`,
              `${formatCurrency(payload.amount)} for ${payload.category} awaiting approval.`,
              submitter,
              {
                status: "PENDING",
                actionType: "expense",
                payload: JSON.stringify(payload),
                initialComment: comment,
              },
            ),
            ...state.activities,
          ],
          notifications: [
            notification(payload.mandalId, "Expense needs approval", `${submitter.name} submitted an expense.`, "info", "activities"),
            ...state.notifications,
          ],
        }));
        return "pending";
      },
      deleteExpense: (expenseId) =>
        set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== expenseId) })),
      addEvent: (payload, submitter) => {
        const upcomingPayload: Omit<EventItem, "id" | "createdAt" | "updatedAt"> = {
          ...payload,
          budget: 0,
          status: payload.status === "Upcoming" ? "Upcoming" : "Planned",
          volunteerIds: payload.volunteerIds ?? [],
        };
        const comment = upcomingPayload.notes?.trim() || "Upcoming event submitted.";
        if (needsActivityApproval(submitter.role)) {
          set((state) => ({
            activities: [
              activity(
                upcomingPayload.mandalId,
                `Upcoming event: ${upcomingPayload.title}`,
                `${upcomingPayload.title} scheduled for ${upcomingPayload.date}.`,
                submitter,
                {
                  status: "PENDING",
                  actionType: "event",
                  payload: JSON.stringify(upcomingPayload),
                  initialComment: comment,
                },
              ),
              ...state.activities,
            ],
            notifications: [
              notification(upcomingPayload.mandalId, "Upcoming event needs approval", `${submitter.name} submitted an event.`, "info", "activities"),
              ...state.notifications,
            ],
          }));
          return "pending";
        }
        set((state) => ({
          ...addEventRecord(state, upcomingPayload),
          activities: [
            activity(upcomingPayload.mandalId, `Upcoming event: ${upcomingPayload.title}`, "Event added to the upcoming schedule.", submitter, { actionType: "event", status: "DONE", initialComment: comment }),
            ...state.activities,
          ],
        }));
        return "added";
      },
      addMandalActivity: (payload, submitter) => {
        const comment = payload.notes.trim() || "Current activity submitted.";
        const activityPayload = JSON.stringify(payload);
        if (needsActivityApproval(submitter.role)) {
          set((state) => ({
            activities: [
              activity(
                payload.mandalId,
                `Activity: ${payload.title}`,
                payload.location ? `${payload.title} at ${payload.location}` : payload.title,
                submitter,
                {
                  status: "PENDING",
                  actionType: "activity",
                  payload: activityPayload,
                  initialComment: comment,
                },
              ),
              ...state.activities,
            ],
            notifications: [
              notification(payload.mandalId, "Activity needs approval", `${submitter.name} submitted a current activity.`, "info", "activities"),
              ...state.notifications,
            ],
          }));
          return "pending";
        }
        set((state) => ({
          activities: [
            activity(
              payload.mandalId,
              `Activity: ${payload.title}`,
              payload.location ? `${payload.title} at ${payload.location}` : payload.title,
              submitter,
              {
                status: "OPEN",
                actionType: "activity",
                payload: activityPayload,
                initialComment: comment,
              },
            ),
            ...state.activities,
          ],
        }));
        return "added";
      },
      updateActivityStatus: (activityId, toStatus, comment, actor) => {
        const trimmed = comment.trim();
        if (!trimmed) return false;

        let success = false;
        set((state) => {
          const current = state.activities.find((item) => item.id === activityId);
          if (!current) return state;
          if (!canTransitionActivity(actor.role, actor.userId, current, toStatus)) return state;

          success = true;
          let nextState: AppData = { ...state };

          if (toStatus === "DONE" && current.status === "PENDING" && current.payload) {
            if (current.actionType === "donation") {
              const donation = JSON.parse(current.payload) as Omit<Donation, "id" | "createdAt" | "updatedAt">;
              nextState = { ...nextState, ...addDonationRecord(nextState, donation) };
            } else if (current.actionType === "expense") {
              const expense = JSON.parse(current.payload) as Omit<Expense, "id" | "createdAt" | "updatedAt">;
              nextState = { ...nextState, ...addExpenseRecord(nextState, expense) };
            }
          }

          if (toStatus === "OPEN" && current.payload) {
            if (current.actionType === "donation" || current.actionType === "expense") {
              // Paid items use Accept (DONE) instead of OPEN.
            } else if (current.actionType === "event") {
              const event = JSON.parse(current.payload) as Omit<EventItem, "id" | "createdAt" | "updatedAt">;
              nextState = { ...nextState, ...addEventRecord(nextState, event) };
            }
          }

          return {
            ...nextState,
            activities: nextState.activities.map((item) =>
              item.id === activityId
                ? {
                    ...item,
                    status: toStatus,
                    statusHistory: [
                      statusLog(item.status, toStatus, trimmed, actor),
                      ...item.statusHistory,
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          };
        });
        return success;
      },
      addVolunteer: (payload) =>
        set((state) => ({ volunteers: [{ ...meta("volunteer"), ...payload }, ...state.volunteers] })),
      addVendor: (payload) =>
        set((state) => ({ vendors: [{ ...meta("vendor"), ...payload }, ...state.vendors] })),
      addInventoryItem: (payload) =>
        set((state) => ({ inventory: [{ ...meta("inventory"), ...payload }, ...state.inventory] })),
      addPooja: (payload) =>
        set((state) => ({ poojas: [{ ...meta("pooja"), ...payload }, ...state.poojas] })),
      addPrasad: (payload) =>
        set((state) => ({ prasads: [{ ...meta("prasad"), ...payload }, ...state.prasads] })),
      addFinanceCategory: (mandalId, type, name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return state;
          const exists = state.financeCategories.some(
            (category) =>
              category.mandalId === mandalId &&
              category.type === type &&
              category.name.toLowerCase() === trimmed.toLowerCase(),
          );
          if (exists) return state;
          const category: FinanceCategory = {
            ...meta("category"),
            mandalId,
            type,
            name: trimmed,
          };
          return { financeCategories: [category, ...state.financeCategories] };
        }),
      removeFinanceCategory: (categoryId) =>
        set((state) => ({
          financeCategories: state.financeCategories.filter((category) => category.id !== categoryId),
        })),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true, updatedAt: new Date().toISOString() } : item,
          ),
        })),
      submitFeedback: (payload) =>
        set((state) => {
          const entry: FeedbackItem = {
            ...meta("feedback"),
            userId: payload.userId,
            userName: payload.userName,
            mandalId: payload.mandalId,
            message: payload.message.trim(),
            rating: payload.rating,
          };
          return { feedbacks: [entry, ...state.feedbacks] };
        }),
    }),
    {
      name: "ganpati-mandal-storage",
      version: 9,
      migrate: (persistedState) => sanitizePersistedData(persistedState),
    },
  ),
);
