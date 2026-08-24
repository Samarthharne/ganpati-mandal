export type Role =
  | "OWNER"
  | "COMMITTEE_MEMBER"
  | "MEMBER"
  | "ADMIN"
  | "TREASURER"
  | "EVENT_MANAGER";

export type ActivityActionType = "donation" | "expense" | "event" | "activity" | "system";

export type ActivityStatus =
  | "PENDING"
  | "OPEN"
  | "IN_PROGRESS"
  | "DONE"
  | "REJECTED";

export interface ActivityStatusLog {
  id: string;
  fromStatus: ActivityStatus | null;
  toStatus: ActivityStatus;
  comment: string;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export type MandalType =
  | "Public Mandal"
  | "Society Mandal"
  | "Private Mandal"
  | "College Mandal"
  | "Company Mandal";

export type PaymentMethod =
  | "Cash"
  | "UPI"
  | "Bank Transfer"
  | "Card"
  | "Cheque";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ExpenseStatus = "Paid" | "Pending" | "Partially Paid";
export type EventStatus = "Planned" | "Upcoming" | "Ongoing" | "Completed";
export type VolunteerStatus = "Available" | "Assigned" | "Busy";
export type NotificationTone = "success" | "warning" | "danger" | "info";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface Membership extends BaseEntity {
  mandalId: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface JoinRequest extends BaseEntity {
  mandalId: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  message?: string;
  status: RequestStatus;
  requestedAt: string;
}

export interface Donation extends BaseEntity {
  mandalId: string;
  donorName: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

export interface Expense extends BaseEntity {
  mandalId: string;
  title: string;
  amount: number;
  category: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  date: string;
  status: ExpenseStatus;
  notes?: string;
}

export interface BudgetItem extends BaseEntity {
  mandalId: string;
  category: string;
  allocated: number;
  spent: number;
}

export interface EventItem extends BaseEntity {
  mandalId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  budget: number;
  status: EventStatus;
  volunteerIds: string[];
  notes?: string;
}

export interface Volunteer extends BaseEntity {
  mandalId: string;
  name: string;
  department: string;
  status: VolunteerStatus;
  assignedEvents: string[];
}

export interface Vendor extends BaseEntity {
  mandalId: string;
  name: string;
  service: string;
  contractAmount: number;
  paidAmount: number;
}

export interface InventoryItem extends BaseEntity {
  mandalId: string;
  name: string;
  category: string;
  available: number;
  required: number;
}

export interface PoojaItem extends BaseEntity {
  mandalId: string;
  title: string;
  type: "Pooja" | "Aarti" | "Special Ritual" | "Bhajan";
  date: string;
  time: string;
}

export interface PrasadItem extends BaseEntity {
  mandalId: string;
  name: string;
  expectedPeople: number;
  quantity: string;
  cost: number;
  sponsor: string;
  status: "Planned" | "Ready" | "Served";
}

export interface ActivityItem extends BaseEntity {
  mandalId: string;
  title: string;
  description: string;
  status: ActivityStatus;
  submittedByUserId: string;
  submittedByName: string;
  submittedByRole: Role;
  actionType: ActivityActionType;
  payload?: string;
  statusHistory: ActivityStatusLog[];
}

export interface NotificationItem extends BaseEntity {
  mandalId?: string;
  title: string;
  description: string;
  tone: NotificationTone;
  target: string;
  read: boolean;
}

export interface FinanceCategory extends BaseEntity {
  mandalId: string;
  type: "donation" | "expense";
  name: string;
}

export interface Mandal extends BaseEntity {
  name: string;
  location: string;
  city: string;
  state: string;
  description: string;
  mandalType: MandalType;
  visibility: "Public" | "Private";
  expectedMembers: number;
  festivalDuration: number;
  festivalDay: number;
  logo: string;
  ownerId: string;
  joinCode: string;
}

export interface FeedbackItem extends BaseEntity {
  userId: string;
  userName: string;
  mandalId: string | null;
  message: string;
  rating: number;
}

export interface AppData {
  currentUserId: string | null;
  users: User[];
  currentMandalId: string | null;
  demoRole: Role;
  darkMode: boolean;
  mandals: Mandal[];
  memberships: Membership[];
  joinRequests: JoinRequest[];
  donations: Donation[];
  expenses: Expense[];
  budgets: BudgetItem[];
  events: EventItem[];
  volunteers: Volunteer[];
  vendors: Vendor[];
  inventory: InventoryItem[];
  poojas: PoojaItem[];
  prasads: PrasadItem[];
  notifications: NotificationItem[];
  activities: ActivityItem[];
  financeCategories: FinanceCategory[];
  feedbacks: FeedbackItem[];
}
