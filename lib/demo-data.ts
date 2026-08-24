import { AppData } from "@/lib/types";
import { generateId } from "@/lib/utils";

const now = new Date().toISOString();

export function createEmptyAppData(): AppData {
  return {
    currentUserId: null,
    users: [
      {
        id: "user-admin",
        name: "Admin",
        phone: "0000000000",
        email: "admin@ganpatimandal.app",
        createdAt: now,
        updatedAt: now,
        username: "admin",
        password: "pass1234",
        isAdmin: true,
      },
    ],
    currentMandalId: null,
    demoRole: "OWNER",
    darkMode: false,
    mandals: [],
    memberships: [],
    joinRequests: [],
    donations: [],
    expenses: [],
    budgets: [],
    events: [],
    volunteers: [],
    vendors: [],
    inventory: [],
    poojas: [],
    prasads: [],
    notifications: [],
    activities: [],
    financeCategories: [],
    feedbacks: [],
  };
}
