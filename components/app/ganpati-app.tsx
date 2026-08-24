"use client";

import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  CircleDot,
  ClipboardList,
  Copy,
  Eye,
  EyeOff,
  HandCoins,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Toaster, toast } from "sonner";

import { useAppStore } from "@/lib/storage";
import {
  BudgetItem,
  Donation,
  EventItem,
  Expense,
  FinanceCategory,
  ActivityItem,
  ActivityStatus,
  FeedbackItem,
  JoinRequest,
  Mandal,
  Membership,
  NotificationItem,
  Role,
  User,
} from "@/lib/types";
import { cn, formatCurrency, formatDate, formatShortDate, getInitials } from "@/lib/utils";
import {
  ACTIVITY_STATUS_LABELS,
  assignableMemberRoles,
  canApproveActivities,
  canManageCategories,
  canManageFinance,
  canManageMembers,
  canViewJoinCode,
  canTransitionActivity,
  getNextActivityStatuses,
  isPaidActionType,
  joinRequestBelongsToUser,
  membershipBelongsToUser,
  normalizeRole,
} from "@/lib/permissions";

type BottomTab = "home" | "finance" | "manage" | "profile";
type ManageTab = "members" | "requests" | "activities" | "events";

const roleLabels: Record<Role, string> = {
  OWNER: "Owner",
  COMMITTEE_MEMBER: "Committee Member",
  MEMBER: "Member",
  ADMIN: "Committee Member",
  TREASURER: "Committee Member",
  EVENT_MANAGER: "Committee Member",
};

const memberRoleOptions = assignableMemberRoles();
const paymentMethods = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque"] as const;

function canManageEvents(role: Role) {
  return canApproveActivities(role);
}

export function GanpatiApp() {
  const store = useAppStore();
  const currentUser = useMemo(
    () => store.users.find((u) => u.id === store.currentUserId) ?? null,
    [store.users, store.currentUserId],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", store.darkMode);
  }, [store.darkMode]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <MainApp user={currentUser} />;
}

function LoginScreen() {
  const store = useAppStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    const user = store.login(username, password);
    if (!user) {
      setError("Invalid username or password.");
    } else {
      toast.success(`Welcome back, ${user.name}!`);
    }
  };

  const handleRegister = () => {
    setError("");
    if (!name || !username || !password) {
      setError("Name, username, and password are required.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    const user = store.register({ name, phone, email, username, password });
    if (!user) {
      setError("Username already taken. Try a different one.");
    } else {
      toast.success(`Account created! Welcome, ${user.name}.`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-4">
      <Toaster richColors position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[var(--saffron-gradient)] text-4xl text-white shadow-lg">🕉️</div>
          <h1 className="mt-5 text-3xl font-bold text-[var(--foreground)]">Ganpati Mandal</h1>
          <p className="mt-2 text-[var(--muted)]">Manage your Mandal community</p>
        </div>

        <Card>
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={cn("flex-1 rounded-2xl py-3 text-sm font-semibold transition", mode === "login" ? "bg-[var(--foreground)] text-white" : "bg-white/60 text-[var(--muted)]")}
            >
              Login
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={cn("flex-1 rounded-2xl py-3 text-sm font-semibold transition", mode === "register" ? "bg-[var(--foreground)] text-white" : "bg-white/60 text-[var(--muted)]")}
            >
              Register
            </button>
          </div>

          {mode === "register" && (
            <div className="mb-3 grid gap-3">
              <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <Input label="Phone" value={phone} onChange={setPhone} placeholder="9876543210" />
              <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
            </div>
          )}

          <div className="grid gap-3">
            <Input label="Username" value={username} onChange={setUsername} placeholder="Enter username" />
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Password</span>
              <div className="flex items-center gap-2 rounded-[20px] border border-[var(--border)] bg-white px-4 py-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-transparent outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister(); }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--muted)]">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </motion.p>
          )}

          <PrimaryButton
            label={mode === "login" ? "Login" : "Create Account"}
            onClick={mode === "login" ? handleLogin : handleRegister}
            className="mt-5 w-full"
          />
        </Card>
      </motion.div>
    </div>
  );
}

function MainApp({ user }: { user: User }) {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<BottomTab>("home");
  const [manageTab, setManageTab] = useState<ManageTab>("members");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCreateMandal, setShowCreateMandal] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [selectedMandalId, setSelectedMandalId] = useState<string | null>(store.currentMandalId);
  const [showAddPaid, setShowAddPaid] = useState(false);
  const [paidSheetInitialType, setPaidSheetInitialType] = useState<"donation" | "expense">("donation");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddCategories, setShowAddCategories] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const memberships = useMemo(
    () => store.memberships.filter((item) => membershipBelongsToUser(item, user)),
    [store.memberships, user],
  );
  const currentMandal = useMemo(
    () => store.mandals.find((mandal) => mandal.id === store.currentMandalId) ?? null,
    [store.mandals, store.currentMandalId],
  );
  const currentMandalId = currentMandal?.id ?? null;

  const currentMandalMembers = useMemo(
    () => store.memberships.filter((member) => member.mandalId === currentMandalId),
    [store.memberships, currentMandalId],
  );
  const currentJoinRequests = useMemo(
    () => store.joinRequests.filter((request) => request.mandalId === currentMandalId),
    [store.joinRequests, currentMandalId],
  );
  const currentDonations = useMemo(
    () => store.donations.filter((item) => item.mandalId === currentMandalId),
    [store.donations, currentMandalId],
  );
  const currentExpenses = useMemo(
    () => store.expenses.filter((item) => item.mandalId === currentMandalId),
    [store.expenses, currentMandalId],
  );
  const currentBudgets = useMemo(
    () => store.budgets.filter((item) => item.mandalId === currentMandalId),
    [store.budgets, currentMandalId],
  );
  const currentEvents = useMemo(
    () => store.events.filter((item) => item.mandalId === currentMandalId),
    [store.events, currentMandalId],
  );
  const currentNotifications = useMemo(
    () => store.notifications.filter((item) => item.mandalId === currentMandalId),
    [store.notifications, currentMandalId],
  );
  const currentActivities = useMemo(
    () => store.activities.filter((item) => item.mandalId === currentMandalId),
    [store.activities, currentMandalId],
  );
  const pendingActivities = useMemo(
    () => currentActivities.filter((item) => item.status === "PENDING"),
    [currentActivities],
  );
  const currentFinanceCategories = useMemo(
    () => store.financeCategories.filter((item) => item.mandalId === currentMandalId),
    [store.financeCategories, currentMandalId],
  );
  const donationCategoryNames = useMemo(
    () => currentFinanceCategories.filter((item) => item.type === "donation").map((item) => item.name),
    [currentFinanceCategories],
  );
  const expenseCategoryNames = useMemo(
    () => currentFinanceCategories.filter((item) => item.type === "expense").map((item) => item.name),
    [currentFinanceCategories],
  );
  const currentMembership = useMemo(
    () => currentMandalMembers.find((item) => membershipBelongsToUser(item, user)),
    [currentMandalMembers, user],
  );
  const effectiveRole = normalizeRole(currentMembership?.role ?? "MEMBER");
  const insideMandal = !!currentMandal && (!!currentMembership || user.isAdmin);

  useEffect(() => {
    if (
      store.currentMandalId &&
      !user.isAdmin &&
      !memberships.some((item) => item.mandalId === store.currentMandalId)
    ) {
      store.setCurrentMandal(null);
    }
  }, [store.currentMandalId, memberships, user.isAdmin, store]);

  const enterMandal = (mandalId: string) => {
    const hasAccess = user.isAdmin || memberships.some((item) => item.mandalId === mandalId);
    if (!hasAccess) {
      toast.error("You must join and be approved before opening this Mandal.");
      return;
    }
    store.setCurrentMandal(mandalId);
    setActiveTab("home");
  };

  const exitMandal = () => {
    store.setCurrentMandal(null);
    setActiveTab("home");
    toast.success("Back to your Mandals.");
  };

  const openNotifications = () => {
    if (insideMandal) {
      setShowNotifications(true);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    store.markNotificationRead(n.id);
    setShowNotifications(false);
    if (n.target === "finance") setActiveTab("finance");
    if (n.target === "events") { setActiveTab("manage"); setManageTab("events"); }
    if (n.target === "requests") { setActiveTab("manage"); setManageTab("requests"); }
    if (n.target === "activities") { setActiveTab("manage"); setManageTab("activities"); }
  };

  const totals = {
    donations: currentDonations.reduce((sum, item) => sum + item.amount, 0),
    expenses: currentExpenses.reduce((sum, item) => sum + item.amount, 0),
    budget: currentBudgets.reduce((sum, item) => sum + item.allocated, 0),
  };
  const availableBalance = totals.donations - totals.expenses;
  const pendingRequests = currentJoinRequests.filter((item) => item.status === "PENDING");

  const openPaidSheet = (type: "donation" | "expense") => {
    setPaidSheetInitialType(type);
    setShowAddPaid(true);
  };

  const goHome = () => setActiveTab("home");

  const transitionActivity = (id: string, status: ActivityStatus, comment: string) => {
    const item = currentActivities.find((activity) => activity.id === id);
    const ok = store.updateActivityStatus(id, status, comment, { userId: user.id, name: user.name, role: effectiveRole });
    if (ok) {
      if (item && isPaidActionType(item.actionType)) {
        if (status === "DONE") toast.success("Payment accepted and recorded.");
        else if (status === "REJECTED") toast.success("Payment rejected.");
        else toast.success(`Payment updated to ${ACTIVITY_STATUS_LABELS[status]}.`);
      } else {
        toast.success(`Activity moved to ${ACTIVITY_STATUS_LABELS[status]}.`);
      }
    } else toast.error("Could not update activity. Add a comment and check permissions.");
    return ok;
  };

  const renderHome = () => {
    if (!insideMandal) {
      return (
        <MandalLandingScreen
          user={user}
          mandals={store.mandals}
          memberships={memberships}
          allMemberships={store.memberships}
          joinRequests={store.joinRequests}
          donations={store.donations}
          events={store.events}
          feedbacks={store.feedbacks}
          onCreate={() => setShowCreateMandal(true)}
          onJoinByCode={() => setShowJoinByCode(true)}
          onOpenAdminPanel={() => setShowAdminPanel(true)}
          onEnterMandal={enterMandal}
          onFeedback={() => setShowFeedback(true)}
        />
      );
    }
    if (!currentMandal) return null;
    return (
      <DashboardScreen
        role={effectiveRole}
        mandal={currentMandal}
        memberships={memberships}
        currentMembership={currentMembership}
        members={currentMandalMembers}
        pendingRequests={pendingRequests}
        activities={currentActivities}
        pendingActivities={pendingActivities}
        currentUserId={user.id}
        onTransitionActivity={transitionActivity}
        onOpenActivities={() => { setActiveTab("manage"); setManageTab("activities"); }}
        availableBalance={availableBalance}
        recentCollection={currentDonations.slice(0, 3).reduce((sum, item) => sum + item.amount, 0)}
        events={currentEvents}
        onApproveRequest={(id) => {
          store.updateJoinRequestStatus(id, "APPROVED");
          toast.success("Member added to the Mandal.");
        }}
        onOpenRequests={() => { setActiveTab("manage"); setManageTab("requests"); }}
        onOpenMemberRequests={() => { setActiveTab("manage"); setManageTab("requests"); }}
        onAddActivity={() => setShowAddActivity(true)}
        onAddEvent={() => setShowAddEvent(true)}
        onAddPaid={() => openPaidSheet("donation")}
        onAddCategories={() => setShowAddCategories(true)}
        onCreateMandal={() => setShowCreateMandal(true)}
        onExplore={() => setShowExplore(true)}
        onSwitchMandal={enterMandal}
        onBackToList={exitMandal}
        isAdmin={user.isAdmin}
        onDeleteMandal={(mandalId) => {
          store.deleteMandal(mandalId);
          toast.success("Mandal deleted by admin.");
          if (store.currentMandalId === mandalId) exitMandal();
        }}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        allMandals={store.mandals.filter((mandal) => memberships.some((membership) => membership.mandalId === mandal.id))}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--foreground)]">
      <Toaster richColors position="top-center" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        {insideMandal && <DesktopRail activeTab={activeTab} setActiveTab={setActiveTab} />}
        <main className={cn("flex min-h-screen flex-1 flex-col lg:pb-8", insideMandal ? "pb-24" : "pb-8")}>
          <TopBar
            title={
              !insideMandal
                ? "Your Mandals"
                : activeTab === "home"
                  ? currentMandal?.name ?? "Ganpati Mandal"
                  : activeTab === "finance"
                    ? "Finance"
                    : activeTab === "manage"
                      ? "Manage"
                      : "Profile"
            }
            user={user}
            notifications={insideMandal ? currentNotifications.filter((item) => !item.read).length : 0}
            showNotifications={insideMandal}
            onBack={insideMandal ? exitMandal : undefined}
            onCloseToHome={insideMandal && activeTab !== "home" ? goHome : undefined}
            onNotificationsClick={openNotifications}
            onFeedbackClick={() => setShowFeedback(true)}
            onProfileClick={() => setActiveTab("profile")}
            onAdminPanel={user.isAdmin ? () => setShowAdminPanel(true) : undefined}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${manageTab}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24 }}
              className="flex-1 px-4 pb-6 pt-4 sm:px-6"
            >
              {activeTab === "home" && renderHome()}
              {activeTab === "finance" && insideMandal && currentMandal && (
                <FinanceScreen
                  role={effectiveRole}
                  donations={currentDonations}
                  expenses={currentExpenses}
                  budgets={currentBudgets}
                  totals={totals}
                  financeCategories={currentFinanceCategories}
                  onAddDonation={() => openPaidSheet("donation")}
                  onAddExpense={() => openPaidSheet("expense")}
                  onDeleteExpense={(id) => { store.deleteExpense(id); toast.success("Expense deleted."); }}
                  onAddCategory={(type, name) => { store.addFinanceCategory(currentMandal.id, type, name); toast.success("Category added."); }}
                  onRemoveCategory={(id) => { store.removeFinanceCategory(id); toast.success("Category removed."); }}
                />
              )}
              {activeTab === "manage" && insideMandal && currentMandal && (
                <ManageScreen
                  activeTab={manageTab}
                  setActiveTab={setManageTab}
                  role={effectiveRole}
                  mandal={currentMandal}
                  members={currentMandalMembers}
                  requests={currentJoinRequests}
                  events={currentEvents}
                  onRoleChange={(membershipId, role) => { store.updateMemberRole(membershipId, role); toast.success("Member role updated."); }}
                  onRemoveMember={(membershipId) => { store.removeMember(membershipId); toast.success("Member removed."); }}
                  onApprove={(requestId) => { store.updateJoinRequestStatus(requestId, "APPROVED"); toast.success("Join request approved."); }}
                  onReject={(requestId) => { store.updateJoinRequestStatus(requestId, "REJECTED"); toast.success("Join request rejected."); }}
                  onAddEvent={() => setShowAddEvent(true)}
                  activities={currentActivities}
                  pendingActivities={pendingActivities}
                  currentUserId={user.id}
                  isAdmin={user.isAdmin}
                  onTransitionActivity={transitionActivity}
                />
              )}
              {activeTab === "profile" && (
                <ProfileScreen
                  user={user}
                  mandals={store.mandals}
                  memberships={memberships}
                  currentMandalId={store.currentMandalId}
                  darkMode={store.darkMode}
                  onSwitchMandal={enterMandal}
                  onCreate={() => setShowCreateMandal(true)}
                  onExplore={() => setShowExplore(true)}
                  onOpenAdminPanel={() => setShowAdminPanel(true)}
                  onDeleteMandal={(mandalId) => {
                    store.deleteMandal(mandalId);
                    toast.success("Mandal deleted by admin.");
                  }}
                  onToggleTheme={() => store.toggleTheme()}
                  onFeedback={() => setShowFeedback(true)}
                  onLogout={() => { store.logout(); toast.success("Logged out."); }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {insideMandal && <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} onCenterPress={() => setShowQuickActions(true)} />}

      <QuickActionsSheet
        open={showQuickActions}
        onOpenChange={setShowQuickActions}
        actions={[
          { label: "Activity", icon: CircleDot, onClick: () => setShowAddActivity(true) },
          { label: "Event", icon: CalendarDays, onClick: () => setShowAddEvent(true) },
          { label: "Paid", icon: HandCoins, onClick: () => openPaidSheet("donation") },
          { label: "Member Requests", icon: UserPlus, onClick: () => { setActiveTab("manage"); setManageTab("requests"); } },
          ...(canManageCategories(effectiveRole)
            ? [{ label: "Add Categories", icon: ClipboardList, onClick: () => setShowAddCategories(true) }]
            : []),
        ]}
      />

      <CreateMandalSheet open={showCreateMandal} onOpenChange={setShowCreateMandal} onSubmit={(payload) => { store.createMandal(payload); toast.success("Your Mandal has been created successfully! 🕉️"); setActiveTab("home"); }} />
      <JoinByCodeSheet
        open={showJoinByCode}
        onOpenChange={setShowJoinByCode}
        onSubmit={(code) => {
          const result = store.requestJoinByCode(code);
          if (result === "success") toast.success("Join request sent. Wait for admin approval.");
          else if (result === "pending") toast.info("You already have a pending request for this Mandal.");
          else if (result === "already_member") toast.info("You are already a member of this Mandal.");
          else if (result === "owner") toast.info("You own this Mandal. Open it from your Mandal list.");
          else toast.error("Invalid Mandal code. Please check and try again.");
          return result === "success";
        }}
      />
      <ExploreMandalsSheet open={showExplore} onOpenChange={setShowExplore} currentUser={user} mandals={store.mandals} memberships={store.memberships} joinRequests={store.joinRequests} selectedMandalId={selectedMandalId} onSelectMandal={setSelectedMandalId} onRequestJoin={(payload) => { store.submitJoinRequest(payload); toast.success("Request sent successfully."); }} onOpenMandal={(mandalId) => { setShowExplore(false); enterMandal(mandalId); }} />
      <NotificationsSheet
        open={showNotifications}
        onOpenChange={setShowNotifications}
        notifications={currentNotifications}
        onNotificationClick={handleNotificationClick}
      />
      <FeedbackSheet
        open={showFeedback}
        onOpenChange={setShowFeedback}
        onSubmit={(message, rating) => {
          store.submitFeedback({ userId: user.id, userName: user.name, mandalId: currentMandalId, message, rating });
          toast.success("Thank you for your feedback!");
        }}
      />

      {user.isAdmin && (
      <AdminPanelSheet
        open={showAdminPanel}
        onOpenChange={setShowAdminPanel}
        mandals={store.mandals}
        users={store.users}
        feedbacks={store.feedbacks}
        onDeleteMandal={(mandalId) => {
            store.deleteMandal(mandalId);
            toast.success("Mandal deleted by admin.");
            if (store.currentMandalId === mandalId) exitMandal();
          }}
        />
      )}

      {currentMandalId && (
        <Fragment>
          <AddPaidSheet
            open={showAddPaid}
            onOpenChange={setShowAddPaid}
            initialType={paidSheetInitialType}
            donationCategories={donationCategoryNames}
            expenseCategories={expenseCategoryNames}
            onSubmitDonation={(payload) => {
              store.addDonation({ ...payload, mandalId: currentMandalId }, { userId: user.id, name: user.name, role: effectiveRole });
              toast.success("Donation submitted for approval.");
            }}
            onSubmitExpense={(payload) => {
              store.addExpense({ ...payload, mandalId: currentMandalId }, { userId: user.id, name: user.name, role: effectiveRole });
              toast.success("Expense submitted for approval.");
            }}
          />
          <AddActivitySheet
            open={showAddActivity}
            onOpenChange={setShowAddActivity}
            onSubmit={(payload) => {
              const result = store.addMandalActivity({ ...payload, mandalId: currentMandalId }, { userId: user.id, name: user.name, role: effectiveRole });
              toast.success(result === "pending" ? "Activity submitted for approval." : "Activity started.");
            }}
          />
          <AddCategoriesSheet
            open={showAddCategories}
            onOpenChange={setShowAddCategories}
            role={effectiveRole}
            financeCategories={currentFinanceCategories}
            onAddCategory={(type, name) => { store.addFinanceCategory(currentMandalId, type, name); toast.success("Category added."); }}
            onRemoveCategory={(id) => { store.removeFinanceCategory(id); toast.success("Category removed."); }}
          />
          <AddEventSheet open={showAddEvent} onOpenChange={setShowAddEvent} onSubmit={(payload) => {
            const result = store.addEvent({ ...payload, mandalId: currentMandalId }, { userId: user.id, name: user.name, role: effectiveRole });
            toast.success(result === "pending" ? "Event submitted for approval." : "Upcoming event added.");
          }} />
        </Fragment>
      )}
    </div>
  );
}

function TopBar({
  title,
  user,
  notifications,
  showNotifications = false,
  onBack,
  onCloseToHome,
  onNotificationsClick,
  onFeedbackClick,
  onProfileClick,
  onAdminPanel,
}: {
  title: string;
  user: User;
  notifications: number;
  showNotifications?: boolean;
  onBack?: () => void;
  onCloseToHome?: () => void;
  onNotificationsClick?: () => void;
  onFeedbackClick?: () => void;
  onProfileClick?: () => void;
  onAdminPanel?: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/60 bg-[var(--app-bg)]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Back to Your Mandals"
              aria-label="Back to Your Mandals"
              className="mt-0.5 grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted)]">Ganpati Mandal</p>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCloseToHome && (
            <button
              type="button"
              onClick={onCloseToHome}
              title="Back to Home"
              aria-label="Back to Home"
              className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm"
            >
              <X className="size-5 text-[var(--muted)]" />
            </button>
          )}
          {showNotifications && onNotificationsClick && (
            <button
              type="button"
              onClick={onNotificationsClick}
              title="Notifications"
              aria-label="Notifications"
              className="relative grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm"
            >
              <Bell className="size-5 text-[var(--foreground)]" />
              {notifications > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--danger)]" />}
            </button>
          )}
          {onFeedbackClick && (
            <button
              type="button"
              onClick={onFeedbackClick}
              title="Send Feedback"
              aria-label="Send Feedback"
              className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm"
            >
              <MessageSquare className="size-5 text-[var(--primary)]" />
            </button>
          )}
          {user.isAdmin && onAdminPanel && (
            <button type="button" onClick={onAdminPanel} className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-white/80 shadow-sm" title="Admin Panel">
              <Shield className="size-5 text-[var(--primary)]" />
            </button>
          )}
          {onProfileClick && (
            <button
              type="button"
              onClick={onProfileClick}
              title="Profile"
              aria-label="Profile"
              className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--soft-orange)] text-sm font-bold shadow-sm"
            >
              {getInitials(user.name)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPanelSheet({
  open,
  onOpenChange,
  mandals,
  users,
  feedbacks,
  onDeleteMandal,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  mandals: Mandal[];
  users: User[];
  feedbacks: FeedbackItem[];
  onDeleteMandal: (mandalId: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Admin Panel" description="Manage Mandals, users, and user feedback.">
      <div className="grid gap-5">
        <div>
          <SectionTitle title="User Feedback" subtitle={`${feedbacks.length} feedback submissions`} />
          <div className="mt-3 grid gap-3">
            {feedbacks.length === 0 && <EmptyState title="No Feedback Yet" description="User feedback will appear here." />}
            {feedbacks.map((item) => {
              const mandal = item.mandalId ? mandals.find((m) => m.id === item.mandalId) : null;
              return (
                <div key={item.id} className="rounded-[22px] border border-[var(--border)] bg-white/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.userName}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Rating: {item.rating}/5 • {formatDate(item.createdAt)}
                        {mandal ? ` • ${mandal.name}` : ""}
                      </p>
                    </div>
                    <Badge className="bg-[var(--soft-orange)] text-[var(--primary)]">{item.rating} ★</Badge>
                  </div>
                  <p className="mt-3 text-sm">{item.message}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle title="Registered Users" subtitle={`${users.length} total users (including admin)`} />
          <div className="mt-3 grid gap-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-[22px] border border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-[var(--soft-orange)] text-sm font-bold">{getInitials(u.name)}</div>
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-[var(--muted)]">@{u.username} {u.isAdmin && "• Admin"}</p>
                  </div>
                </div>
                {u.isAdmin && <Badge className="bg-[var(--saffron-gradient)] text-white border-transparent">Admin</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="All Mandals" subtitle={`${mandals.length} mandals created by users`} />
          <div className="mt-3 grid gap-3">
            {mandals.length === 0 && (
              <EmptyState title="No Mandals" description="No mandals have been created yet." />
            )}
            {mandals.map((mandal) => {
              const owner = users.find((u) => u.id === mandal.ownerId);
              return (
                <div key={mandal.id} className="rounded-[24px] border border-[var(--border)] bg-white/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{mandal.logo} {mandal.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{mandal.city}, {mandal.state}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Owner: {owner?.name ?? "Unknown"} (@{owner?.username ?? "?"})</p>
                    </div>
                    {confirmId === mandal.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={() => setConfirmId(null)} className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium">Cancel</button>
                        <button onClick={() => { onDeleteMandal(mandal.id); setConfirmId(null); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white">
                          <Trash2 className="size-4" /> Delete Mandal
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(mandal.id)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-[var(--danger)]">
                        <Trash2 className="size-4" /> Delete Mandal
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

function MandalLandingScreen({
  user,
  mandals,
  memberships,
  allMemberships,
  joinRequests,
  donations,
  events,
  feedbacks,
  onCreate,
  onJoinByCode,
  onOpenAdminPanel,
  onEnterMandal,
  onFeedback,
}: {
  user: User;
  mandals: Mandal[];
  memberships: Membership[];
  allMemberships: Membership[];
  joinRequests: JoinRequest[];
  donations: Donation[];
  events: EventItem[];
  feedbacks: FeedbackItem[];
  onCreate: () => void;
  onJoinByCode: () => void;
  onOpenAdminPanel: () => void;
  onEnterMandal: (id: string) => void;
  onFeedback: () => void;
}) {
  const myMandals = mandals.filter((mandal) => memberships.some((item) => item.mandalId === mandal.id));
  const pendingJoins = joinRequests.filter(
    (request) => joinRequestBelongsToUser(request, user) && request.status === "PENDING",
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      {user.isAdmin && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-[var(--danger)]" />
                <p className="text-lg font-semibold text-red-900">Admin Controls</p>
              </div>
              <p className="mt-2 text-sm text-red-800">Manage Mandals, view user feedback, and delete any Mandal.</p>
            </div>
            <button onClick={onOpenAdminPanel} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-3 text-sm font-semibold text-white">
              <Shield className="size-4" /> Open Admin Panel
            </button>
          </div>
          {feedbacks.length > 0 && (
            <div className="mt-4 grid gap-3">
              <SectionTitle title="Recent Feedback" subtitle={`${feedbacks.length} total submissions`} />
              {feedbacks.slice(0, 3).map((item) => {
                const mandal = item.mandalId ? mandals.find((m) => m.id === item.mandalId) : null;
                return (
                  <div key={item.id} className="rounded-[22px] border border-red-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.userName}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.rating}/5 • {formatDate(item.createdAt)}
                          {mandal ? ` • ${mandal.name}` : ""}
                        </p>
                      </div>
                      <Badge>{item.rating} ★</Badge>
                    </div>
                    <p className="mt-2 text-sm">{item.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <HeroCard
        title={`Welcome, ${user.name.split(" ")[0]} 👋`}
        subtitle="Join an existing Mandal, create your own, or open one you've already joined."
        body={
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={onJoinByCode} className="rounded-[24px] bg-white px-4 py-4 text-left text-[var(--foreground)] shadow-sm">
              <p className="font-semibold">Join Mandal</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Enter the 6-character join code</p>
            </button>
            <button onClick={onCreate} className="rounded-[24px] bg-white px-4 py-4 text-left text-[var(--foreground)] shadow-sm">
              <p className="font-semibold">Create Mandal</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Start your own group</p>
            </button>
          </div>
        }
      />

      <SectionTitle title="My Mandals" subtitle={myMandals.length ? "Tap a Mandal to open its workspace." : "You have not joined or created a Mandal yet."} />
      {myMandals.length === 0 ? (
        <EmptyState title="No Mandals yet" description="Create a Mandal or request to join one. After you enter it, you will see only that Mandal’s data." actionLabel="Create Mandal" onAction={onCreate} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {myMandals.map((mandal) => {
            const membership = memberships.find((item) => item.mandalId === mandal.id);
            const memberCount = allMemberships.filter((item) => item.mandalId === mandal.id).length;
            const donationTotal = donations.filter((item) => item.mandalId === mandal.id).reduce((sum, item) => sum + item.amount, 0);
            const eventCount = events.filter((item) => item.mandalId === mandal.id).length;
            return (
              <button
                key={mandal.id}
                onClick={() => onEnterMandal(mandal.id)}
                className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold">{mandal.logo} {mandal.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{mandal.location}, {mandal.city}</p>
                  </div>
                  <Badge>{roleLabels[membership?.role ?? "MEMBER"]}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{mandal.description || "No description added yet."}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatPill label="Members" value={String(memberCount)} />
                  <StatPill label="Donations" value={formatCurrency(donationTotal)} />
                  <StatPill label="Events" value={String(eventCount)} />
                </div>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  Open Mandal <ArrowRight className="size-4" />
                </p>
              </button>
            );
          })}
        </div>
      )}

      {pendingJoins.length > 0 && (
        <Card>
          <SectionTitle title="Pending Join Requests" subtitle="Waiting for admin approval." />
          <div className="mt-4 grid gap-3">
            {pendingJoins.map((request) => {
              const mandal = mandals.find((item) => item.id === request.mandalId);
              return (
                <div key={request.id} className="rounded-[22px] bg-[var(--soft-orange)] p-4">
                  <p className="font-semibold">{mandal?.name ?? "Mandal"}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Request sent {formatDate(request.requestedAt)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionTitle title="Share Your Thoughts" subtitle="Help us improve Ganpati Mandal with your feedback." />
          </div>
          <SecondaryButton label="Send Feedback" icon={MessageSquare} onClick={onFeedback} />
        </div>
      </Card>
    </div>
  );
}

function DashboardScreen({ role, mandal, memberships, currentMembership, members, pendingRequests, activities, pendingActivities, currentUserId, availableBalance, recentCollection, events, onApproveRequest, onOpenRequests, onOpenMemberRequests, onOpenActivities, onTransitionActivity, onAddActivity, onAddEvent, onAddPaid, onAddCategories, onCreateMandal, onExplore, onSwitchMandal, onBackToList, isAdmin, onDeleteMandal, onOpenAdminPanel, allMandals }: { role: Role; mandal: Mandal; memberships: Membership[]; currentMembership?: Membership; members: Membership[]; pendingRequests: JoinRequest[]; activities: ActivityItem[]; pendingActivities: ActivityItem[]; currentUserId: string; availableBalance: number; recentCollection: number; events: EventItem[]; onApproveRequest: (id: string) => void; onOpenRequests: () => void; onOpenMemberRequests: () => void; onOpenActivities: () => void; onTransitionActivity: (id: string, status: ActivityStatus, comment: string) => boolean; onAddActivity: () => void; onAddEvent: () => void; onAddPaid: () => void; onAddCategories: () => void; onCreateMandal: () => void; onExplore: () => void; onSwitchMandal: (id: string) => void; onBackToList: () => void; isAdmin: boolean; onDeleteMandal: (mandalId: string) => void; onOpenAdminPanel: () => void; allMandals: Mandal[] }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const showJoinCode = canViewJoinCode(role) || isAdmin;
  const upcomingEvents = events.filter((event) => event.status === "Planned" || event.status === "Upcoming");
  const nextEvent = upcomingEvents[0];
  const currentActivity = activities.find((item) => item.actionType === "activity" && (item.status === "OPEN" || item.status === "IN_PROGRESS"));
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="rounded-[28px] bg-saffron-gradient p-5 text-white shadow-[0_30px_80px_rgba(182,81,20,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{mandal.logo}</span>
              <span className="text-2xl font-bold">{mandal.name}</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm text-white/90"><MapPin className="size-4" />{mandal.location ? `${mandal.location}, ` : ""}{mandal.city}, {mandal.state}</p>
            <p className="mt-2 text-sm text-white/90">Festival Day {mandal.festivalDay} of {mandal.festivalDuration}</p>
          </div>
          <Badge className="border-white/20 bg-white/15 text-white">{roleLabels[currentMembership?.role ?? role]}</Badge>
        </div>
        {showJoinCode && (
          <div className="mt-4 rounded-[20px] bg-white/15 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">Mandal Join Code</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-2xl font-bold tracking-[0.35em]">{mandal.joinCode?.trim() || "------"}</p>
              <MandalCodeCopyButton joinCode={mandal.joinCode} variant="light" />
            </div>
            <p className="mt-2 text-xs text-white/80">Share this code so others can request to join.</p>
          </div>
        )}
      </div>

      {allMandals.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {allMandals.map((m) => { const ms = memberships.find((i) => i.mandalId === m.id); return (
            <button key={m.id} onClick={() => onSwitchMandal(m.id)} className={cn("min-w-[190px] rounded-3xl border p-4 text-left shadow-sm transition", m.id === mandal.id ? "border-transparent bg-[var(--foreground)] text-white" : "border-[var(--border)] bg-white/80")}>
              <p className="font-semibold">{m.logo} {m.name}</p>
              <p className={cn("mt-1 text-sm", m.id === mandal.id ? "text-white/70" : "text-[var(--muted)]")}>Role: {roleLabels[ms?.role ?? "MEMBER"]}</p>
            </button>
          ); })}
          <button onClick={onCreateMandal} className="rounded-3xl border border-dashed border-[var(--border)] px-5 py-4 text-left"><p className="font-semibold">+ Create Mandal</p><p className="text-sm text-[var(--muted)]">Start another group</p></button>
          <button onClick={onExplore} className="rounded-3xl border border-dashed border-[var(--border)] px-5 py-4 text-left"><p className="font-semibold">Explore Mandals</p><p className="text-sm text-[var(--muted)]">Join more communities</p></button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><Label>Available Balance</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(availableBalance)}</div><p className="mt-2 text-sm text-emerald-700">↑ {formatCurrency(recentCollection)} collected recently</p></Card>
        <Card>
          <Label>Current Activity</Label>
          {currentActivity ? (
            <div className="mt-2">
              <p className="text-lg font-semibold">{currentActivity.title.replace(/^Activity: /, "")}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{ACTIVITY_STATUS_LABELS[currentActivity.status]}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{currentActivity.description}</p>
            </div>
          ) : (
            <EmptyCompact text="No current activity in progress." />
          )}
        </Card>
        <Card><Label>Upcoming Event</Label>{nextEvent ? (<div className="mt-2"><p className="text-lg font-semibold">{nextEvent.title}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatDate(nextEvent.date)} • {nextEvent.time}</p><p className="mt-1 text-sm text-[var(--muted)]">{nextEvent.location}</p></div>) : (<EmptyCompact text="No upcoming event scheduled." />)}</Card>
      </div>

      <Card>
        <SectionTitle title="Quick Actions" subtitle="Activity = current work • Event = upcoming • Paid = money only." />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <QuickActionButton icon={CircleDot} label="Activity" onClick={onAddActivity} prominent />
          <QuickActionButton icon={CalendarDays} label="Event" onClick={onAddEvent} />
          <QuickActionButton icon={HandCoins} label="Paid" onClick={onAddPaid} />
          <QuickActionButton icon={UserPlus} label="Member Requests" onClick={onOpenMemberRequests} />
          {canManageCategories(role) && (
            <QuickActionButton icon={ClipboardList} label="Add Categories" onClick={onAddCategories} />
          )}
        </div>
      </Card>

      {canApproveActivities(role) && pendingActivities.length > 0 && (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <SectionTitle title="Pending Activities" subtitle={`${pendingActivities.length} items need approval`} />
            <button onClick={onOpenActivities} className="text-sm font-semibold text-[var(--primary)]">View All</button>
          </div>
          <div className="mt-4 grid gap-3">
            {pendingActivities.slice(0, 3).map((item) => (
              <ActivityLifecycleCard
                key={item.id}
                activity={item}
                role={role}
                currentUserId={currentUserId}
                onTransition={onTransitionActivity}
              />
            ))}
          </div>
        </Card>
      )}

      {canManageMembers(role) && (
        <Card>
          <div className="flex items-start justify-between gap-3"><div><SectionTitle title="Join Requests" subtitle={`${pendingRequests.length} pending requests`} /></div><button onClick={onOpenRequests} className="text-sm font-semibold text-[var(--primary)]">View All Requests</button></div>
          <div className="mt-4 grid gap-3">
            {pendingRequests.length ? pendingRequests.slice(0, 2).map((r) => (<JoinRequestPreview key={r.id} request={r} onApprove={() => onApproveRequest(r.id)} />)) : (<EmptyState title="No Pending Requests" description="🎉 All join requests have been reviewed." />)}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionTitle title="Member Snapshot" subtitle="The Mandal and its members stay at the center." />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatPill label="Total Members" value={String(members.length)} />
            <StatPill label="Committee" value={String(members.filter((i) => normalizeRole(i.role) === "COMMITTEE_MEMBER").length)} />
            <StatPill label="Members" value={String(members.filter((i) => normalizeRole(i.role) === "MEMBER").length)} />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Recent Activity" subtitle="Live updates from approvals, money, and planning." />
          <div className="mt-4 space-y-4">
            {activities.filter((a) => a.status === "DONE").slice(0, 8).length === 0 && <EmptyCompact text="No activity yet." />}
            {activities.filter((a) => a.status === "DONE").slice(0, 8).map((a, index, list) => (
              <div key={a.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="mt-1 size-3 rounded-full bg-[var(--primary)]" />{index !== list.length - 1 && <div className="mt-1 h-full w-px bg-[var(--border)]" />}</div><div className="pb-4"><p className="font-medium">{a.title}</p><p className="mt-1 text-sm text-[var(--muted)]">{a.description}</p><p className="mt-1 text-xs text-[var(--muted)]">By {a.submittedByName}</p></div></div>
            ))}
          </div>
        </Card>
      </div>

      {isAdmin && (
        <Card className="border-red-200 bg-red-50">
          <SectionTitle title="Admin: Delete Mandal" subtitle="Permanently remove this Mandal and all its data." />
          <div className="mt-4 flex flex-wrap gap-3">
            {confirmDelete ? (
              <>
                <button onClick={() => setConfirmDelete(false)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold">Cancel</button>
                <button onClick={() => { onDeleteMandal(mandal.id); setConfirmDelete(false); }} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-3 text-sm font-semibold text-white">
                  <Trash2 className="size-4" /> Confirm Delete Mandal
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-3 text-sm font-semibold text-white">
                  <Trash2 className="size-4" /> Delete This Mandal
                </button>
                <button onClick={onOpenAdminPanel} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                  <Shield className="size-4" /> All Mandals
                </button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function FinanceScreen({ role, donations, expenses, budgets, totals, financeCategories, onAddDonation, onAddExpense, onDeleteExpense, onAddCategory, onRemoveCategory }: { role: Role; donations: Donation[]; expenses: Expense[]; budgets: BudgetItem[]; totals: { donations: number; expenses: number; budget: number }; financeCategories: FinanceCategory[]; onAddDonation: () => void; onAddExpense: () => void; onDeleteExpense: (id: string) => void; onAddCategory: (type: FinanceCategory["type"], name: string) => void; onRemoveCategory: (id: string) => void }) {
  const [tab, setTab] = useState<"donations" | "expenses" | "budget" | "categories">("donations");
  const [newDonationCategory, setNewDonationCategory] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const remaining = totals.budget > 0 ? totals.budget - totals.expenses : totals.donations - totals.expenses;
  const savings = totals.donations - totals.expenses;
  const availableBalance = remaining;
  const donationCats = financeCategories.filter((item) => item.type === "donation");
  const expenseCats = financeCategories.filter((item) => item.type === "expense");
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><Label>Total Collected</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(totals.donations)}</div><p className="mt-2 text-sm text-[var(--muted)]">All donations received</p></Card>
        <Card><Label>Available Balance</Label><div className={cn("mt-2 text-3xl font-bold", availableBalance >= 0 ? "text-emerald-700" : "text-red-700")}>{formatCurrency(availableBalance)}</div><p className="mt-2 text-sm text-[var(--muted)]">{totals.budget > 0 ? "Budget minus expenses" : "Donations minus expenses"}</p></Card>
        <Card><Label>Savings</Label><div className={cn("mt-2 text-3xl font-bold", savings >= 0 ? "text-emerald-700" : "text-red-700")}>{formatCurrency(savings)}</div><p className="mt-2 text-sm text-[var(--muted)]">Donations minus expenses</p></Card>
      </div>
      <TabPills value={tab} options={[{ value: "donations", label: "Donations" }, { value: "expenses", label: "Expenses" }, { value: "budget", label: "Budget" }, { value: "categories", label: "Categories" }]} onChange={(v) => setTab(v as "donations" | "expenses" | "budget" | "categories")} />
      {tab === "donations" && (<><Card><div className="flex items-start justify-between gap-4"><div><Label>Total Collected (Paid)</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(totals.donations)}</div></div><PrimaryButton label="Add Paid" icon={Plus} onClick={onAddDonation} /></div></Card><div className="grid gap-4">{donations.length === 0 && <EmptyState title="No Payments" description="No donation payments recorded yet." actionLabel="Add Paid" onAction={onAddDonation} />}{donations.map((d) => (<MobileMoneyCard key={d.id} title={d.donorName} amount={d.amount} subtitle={d.category} meta={`${d.paymentMethod} • ${formatShortDate(d.date)}`} />))}</div></>)}
      {tab === "expenses" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Label>Total Budget</Label>
              <div className="mt-2 text-3xl font-bold">{formatCurrency(totals.budget)}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{totals.budget > 0 ? "Planned spending limit" : "Add budgets in the Budget tab"}</p>
            </Card>
            <Card>
              <Label>Total Paid Out</Label>
              <div className="mt-2 text-3xl font-bold">{formatCurrency(totals.expenses)}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Approved expense payments</p>
            </Card>
            <Card>
              <Label>Available Balance</Label>
              <div className={cn("mt-2 text-3xl font-bold", availableBalance >= 0 ? "text-emerald-700" : "text-red-700")}>{formatCurrency(availableBalance)}</div>
              <p className="mt-2 text-sm text-[var(--muted)]">{totals.budget > 0 ? "Budget minus paid expenses" : "Donations minus paid expenses"}</p>
            </Card>
          </div>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionTitle title="Expense Payments" subtitle="Each approved expense reduces budget and available balance." />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton label="Add Paid" icon={Plus} onClick={onAddDonation} />
                <SecondaryButton label="Add Expense" icon={Plus} onClick={onAddExpense} />
              </div>
            </div>
          </Card>
          <div className="grid gap-4">
            {expenses.length ? expenses.map((e) => (
              <div key={e.id} className="rounded-[24px] border border-[var(--border)] bg-white/90 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{e.title}</p>
                    <div className="mt-2 text-2xl font-bold">{formatCurrency(e.amount)}</div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{e.category}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{e.status} • {formatDate(e.date)}</p>
                  </div>
                  {canManageFinance(role) && (
                    <button title="Delete expense" aria-label="Delete expense" className="rounded-2xl p-2 text-[var(--danger)]" onClick={() => onDeleteExpense(e.id)}>
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <EmptyState
                title="No Expenses Yet"
                description="Record a paid donation or add an expense. Approved items update your available balance."
                actionLabel="Add Expense"
                onAction={onAddExpense}
              />
            )}
          </div>
        </>
      )}
      {tab === "budget" && (<div className="grid gap-4"><div className="grid gap-4 md:grid-cols-3"><Card><Label>Total Budget</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(totals.budget)}</div></Card><Card><Label>Spent</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(totals.expenses)}</div></Card><Card><Label>Remaining</Label><div className="mt-2 text-3xl font-bold">{formatCurrency(remaining)}</div></Card></div>{budgets.length > 0 && <Card><SectionTitle title="Budget vs Actual" subtitle="Category-level spending health." /><div className="mt-4 h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgets.map((i) => ({ category: i.category, budget: i.allocated, spent: i.spent }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="category" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(v) => `₹${Number(v) / 1000}k`} tick={{ fontSize: 12 }} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Bar dataKey="budget" fill="#f5a623" radius={[8, 8, 0, 0]} /><Bar dataKey="spent" fill="#8b1e3f" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>}<div className="grid gap-4">{budgets.map((i) => (<BudgetCard key={i.id} item={i} />))}</div></div>)}
      {tab === "categories" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Donation Categories" subtitle="Add your own categories for donations." />
            {canManageCategories(role) && (
              <div className="mt-4 flex gap-2">
                <Input value={newDonationCategory} onChange={setNewDonationCategory} placeholder="New donation category" />
                <PrimaryButton label="Add" onClick={() => { if (newDonationCategory.trim()) { onAddCategory("donation", newDonationCategory); setNewDonationCategory(""); } }} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {donationCats.length === 0 && <EmptyCompact text="No donation categories yet. Add your own below." />}
              {donationCats.map((item) => (
                <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm">
                  {item.name}
                  {canManageCategories(role) && (
                    <button title="Remove category" aria-label="Remove category" onClick={() => onRemoveCategory(item.id)} className="text-[var(--danger)]"><Trash2 className="size-3.5" /></button>
                  )}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Expense Categories" subtitle="Used when recording expenses." />
            {canManageCategories(role) && (
              <div className="mt-4 flex gap-2">
                <Input value={newExpenseCategory} onChange={setNewExpenseCategory} placeholder="New expense category" />
                <PrimaryButton label="Add" onClick={() => { if (newExpenseCategory.trim()) { onAddCategory("expense", newExpenseCategory); setNewExpenseCategory(""); } }} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {expenseCats.length === 0 && <EmptyCompact text="No expense categories yet. Add your own below." />}
              {expenseCats.map((item) => (
                <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm">
                  {item.name}
                  {canManageCategories(role) && (
                    <button title="Remove category" aria-label="Remove category" onClick={() => onRemoveCategory(item.id)} className="text-[var(--danger)]"><Trash2 className="size-3.5" /></button>
                  )}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ManageScreen({ activeTab, setActiveTab, role, mandal, members, requests, activities, pendingActivities, currentUserId, isAdmin, events, onRoleChange, onRemoveMember, onApprove, onReject, onTransitionActivity, onAddEvent }: { activeTab: ManageTab; setActiveTab: (v: ManageTab) => void; role: Role; mandal: Mandal; members: Membership[]; requests: JoinRequest[]; activities: ActivityItem[]; pendingActivities: ActivityItem[]; currentUserId: string; isAdmin: boolean; events: EventItem[]; onRoleChange: (id: string, role: Role) => void; onRemoveMember: (id: string) => void; onApprove: (id: string) => void; onReject: (id: string) => void; onTransitionActivity: (id: string, status: ActivityStatus, comment: string) => boolean; onAddEvent: () => void }) {
  const [memberFilter, setMemberFilter] = useState("All");
  const [memberSearch, setMemberSearch] = useState("");
  const [requestTab, setRequestTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [activityTab, setActivityTab] = useState<"PENDING" | "ACTIVE" | "DONE" | "REJECTED">("PENDING");
  const [eventView, setEventView] = useState<"list" | "calendar">("list");
  const filteredMembers = members.filter((m) => {
    const s = m.name.toLowerCase().includes(memberSearch.toLowerCase());
    const normalized = normalizeRole(m.role);
    const f =
      memberFilter === "All" ||
      (memberFilter === "Owner" && normalized === "OWNER") ||
      (memberFilter === "Committee" && normalized === "COMMITTEE_MEMBER") ||
      (memberFilter === "Members" && normalized === "MEMBER");
    return s && f;
  });
  const upcomingEvents = events.filter((event) => event.status === "Planned" || event.status === "Upcoming");
  const filteredActivities = activities.filter((item) => {
    if (activityTab === "PENDING") return item.status === "PENDING";
    if (activityTab === "ACTIVE") return item.status === "OPEN" || item.status === "IN_PROGRESS";
    if (activityTab === "DONE") return item.status === "DONE";
    return item.status === "REJECTED";
  });
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="overflow-x-auto"><div className="flex min-w-max gap-2">{[["members", "Members"], ["requests", "Requests"], ["activities", "Activities"], ["events", "Events"]].map(([v, l]) => (<button key={v} onClick={() => setActiveTab(v as ManageTab)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", activeTab === v ? "bg-[var(--foreground)] text-white" : "bg-white/80 text-[var(--muted)]")}>{l}</button>))}</div></div>
      {activeTab === "members" && (<div className="grid gap-4">{(canViewJoinCode(role) || isAdmin) && <MandalCodeCard joinCode={mandal.joinCode} />}<Card><div className="flex flex-wrap items-start justify-between gap-3"><div><SectionTitle title="Members" subtitle={`Total Members: ${members.length}. Owner can promote members to Committee.`} /></div></div><div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><Input value={memberSearch} onChange={setMemberSearch} placeholder="Search members" icon={Search} /><TabPills value={memberFilter} onChange={setMemberFilter} options={[{ value: "All", label: "All" }, { value: "Owner", label: "Owner" }, { value: "Committee", label: "Committee" }, { value: "Members", label: "Members" }]} /></div></Card><div className="grid gap-4 md:grid-cols-2">{filteredMembers.length === 0 && <EmptyState title="No Members" description="Share your Mandal join code so people can request to join." />}{filteredMembers.map((m) => (<MemberCard key={m.id} member={m} canManage={canManageMembers(role)} onRoleChange={onRoleChange} onRemove={onRemoveMember} />))}</div></div>)}
      {activeTab === "requests" && (<div className="grid gap-4"><Card><SectionTitle title="Member Requests" subtitle="Approve or reject requests quickly." /><div className="mt-4"><TabPills value={requestTab} onChange={(v) => setRequestTab(v as "PENDING" | "APPROVED" | "REJECTED")} options={[{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} /></div></Card><div className="grid gap-4">{requests.filter((r) => r.status === requestTab).length ? requests.filter((r) => r.status === requestTab).map((r) => <JoinRequestCard key={r.id} request={r} onApprove={onApprove} onReject={onReject} />) : (<EmptyState title="No Requests Here" description="There are no requests in this section right now." />)}</div></div>)}
      {activeTab === "activities" && (
        <div className="grid gap-4">
          <Card>
            <SectionTitle title="Activities" subtitle="Current work only. Activity, Event, and Paid items share this lifecycle — payments are recorded separately via Paid." />
            <div className="mt-4"><TabPills value={activityTab} onChange={(v) => setActivityTab(v as "PENDING" | "ACTIVE" | "DONE" | "REJECTED")} options={[{ value: "PENDING", label: `Pending (${pendingActivities.length})` }, { value: "ACTIVE", label: "Active" }, { value: "DONE", label: "Done" }, { value: "REJECTED", label: "Rejected" }]} /></div>
          </Card>
          <div className="grid gap-4">
            {filteredActivities.length === 0 && <EmptyState title="No Activities" description="No activities in this section." />}
            {filteredActivities.map((item) => (
              <ActivityLifecycleCard
                key={item.id}
                activity={item}
                role={role}
                currentUserId={currentUserId}
                onTransition={onTransitionActivity}
              />
            ))}
          </div>
        </div>
      )}
      {activeTab === "events" && (<div className="grid gap-4"><Card><div className="flex flex-wrap items-start justify-between gap-3"><SectionTitle title="Upcoming Events" subtitle="Scheduled events only. No payment fields here — use Paid for money." /><div className="flex items-center gap-2"><TabPills value={eventView} onChange={(v) => setEventView(v as "list" | "calendar")} options={[{ value: "list", label: "List" }, { value: "calendar", label: "Calendar" }]} />{canManageEvents(role) && <PrimaryButton label="Add Event" icon={Plus} onClick={onAddEvent} />}</div></div></Card>{eventView === "calendar" ? (<Card><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{upcomingEvents.map((e) => (<div key={e.id} className="rounded-[24px] bg-[var(--soft-orange)] p-4"><p className="text-sm text-[var(--muted)]">{formatShortDate(e.date)}</p><p className="mt-2 font-semibold">{e.title}</p><p className="mt-1 text-sm text-[var(--muted)]">{e.time}</p></div>))}</div></Card>) : (<div className="grid gap-4">{upcomingEvents.length === 0 && <EmptyState title="No Upcoming Events" description="Schedule an event from Quick Actions or the button above." actionLabel="Add Event" onAction={onAddEvent} />}{upcomingEvents.map((e) => <EventCard key={e.id} event={e} />)}</div>)}</div>)}
    </div>
  );
}

function ProfileScreen({ user, mandals, memberships, currentMandalId, darkMode, onSwitchMandal, onCreate, onExplore, onOpenAdminPanel, onDeleteMandal, onToggleTheme, onFeedback, onLogout }: { user: User; mandals: Mandal[]; memberships: Membership[]; currentMandalId: string | null; darkMode: boolean; onSwitchMandal: (id: string) => void; onCreate: () => void; onExplore: () => void; onOpenAdminPanel: () => void; onDeleteMandal: (mandalId: string) => void; onToggleTheme: () => void; onFeedback: () => void; onLogout: () => void }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const userMandals = mandals.filter((m) => memberships.some((ms) => ms.mandalId === m.id));
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Card className="bg-saffron-gradient text-white">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-3xl bg-white/15 text-xl font-bold">{getInitials(user.name)}</div>
          <div>
            <p className="text-2xl font-semibold">{user.name}</p>
            <p className="text-white/80">@{user.username} {user.isAdmin && "• Admin"}</p>
            <p className="text-white/80">{user.email}</p>
          </div>
        </div>
      </Card>
      {user.isAdmin && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionTitle title="Admin Panel" subtitle="Delete any Mandal from the system." />
            </div>
            <button onClick={onOpenAdminPanel} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-3 text-sm font-semibold text-white">
              <Shield className="size-4" /> Open Admin Panel
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {mandals.length === 0 && <EmptyCompact text="No Mandals to manage." />}
            {mandals.map((mandal) => (
              <div key={mandal.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-red-200 bg-white p-4">
                <div>
                  <p className="font-semibold">{mandal.logo} {mandal.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{mandal.city}, {mandal.state}</p>
                </div>
                {confirmDeleteId === mandal.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} className="rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium">Cancel</button>
                    <button onClick={() => { onDeleteMandal(mandal.id); setConfirmDeleteId(null); }} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-3 py-2 text-sm font-semibold text-white">
                      <Trash2 className="size-4" /> Delete
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(mandal.id)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
                    <Trash2 className="size-4" /> Delete Mandal
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <div className="flex items-center justify-between gap-3"><SectionTitle title="My Mandals" subtitle="Open a Mandal to see only its related items." /><div className="flex gap-2"><PrimaryButton label="Create" icon={Plus} onClick={onCreate} /><SecondaryButton label="Explore" icon={Search} onClick={onExplore} /></div></div>
        <div className="mt-4 grid gap-3">
          {userMandals.length === 0 && <EmptyCompact text="You haven't joined or created any Mandals yet." />}
          {userMandals.map((m) => { const ms = memberships.find((i) => i.mandalId === m.id); return (
            <button key={m.id} onClick={() => onSwitchMandal(m.id)} className={cn("rounded-[24px] border p-4 text-left", currentMandalId === m.id ? "border-transparent bg-[var(--foreground)] text-white" : "border-[var(--border)] bg-white/80")}>
              <p className="font-semibold">{m.logo} {m.name}</p>
              <p className={cn("mt-1 text-sm", currentMandalId === m.id ? "text-white/70" : "text-[var(--muted)]")}>
                Role: {roleLabels[ms?.role ?? "MEMBER"]} • Tap to open
              </p>
            </button>
          ); })}
        </div>
      </Card>
      <Card>
        <SectionTitle title="Settings" subtitle="Theme and account controls." />
        <div className="mt-4 grid gap-3">
          <SettingsRow title="Theme" description={darkMode ? "Dark mode enabled" : "Light mode enabled"} action={<SecondaryButton label={darkMode ? "Use Light" : "Use Dark"} onClick={onToggleTheme} />} />
          <SettingsRow title="Feedback" description="Share suggestions or report issues." action={<SecondaryButton label="Send Feedback" icon={MessageSquare} onClick={onFeedback} />} />
          <SettingsRow title="Logout" description="Sign out of your account." action={<button onClick={onLogout} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"><LogOut className="size-4" />Logout</button>} />
        </div>
      </Card>
    </div>
  );
}

function DesktopRail({ activeTab, setActiveTab }: { activeTab: BottomTab; setActiveTab: (tab: BottomTab) => void }) {
  const items: { value: BottomTab; icon: typeof Home; label: string }[] = [
    { value: "home", icon: Home, label: "Home" },
    { value: "finance", icon: CircleDollarSign, label: "Finance" },
    { value: "manage", icon: ClipboardList, label: "Manage" },
    { value: "profile", icon: Users, label: "Profile" },
  ];
  return (
    <aside className="hidden w-24 flex-col items-center gap-3 border-r border-[var(--border)] bg-white/70 p-4 lg:flex">
      <div className="mt-2 grid size-14 place-items-center rounded-3xl bg-[var(--saffron-gradient)] text-2xl text-white shadow-lg">🕉️</div>
      {items.map(({ value, icon: Icon, label }) => (
        <button key={value} onClick={() => setActiveTab(value)} className={cn("flex w-full flex-col items-center gap-2 rounded-3xl px-3 py-4 text-xs font-medium transition", activeTab === value ? "bg-[var(--foreground)] text-white" : "text-[var(--muted)] hover:bg-[var(--soft-orange)]")}><Icon className="size-5" />{label}</button>
      ))}
    </aside>
  );
}

function BottomNavigation({ activeTab, setActiveTab, onCenterPress }: { activeTab: BottomTab; setActiveTab: (tab: BottomTab) => void; onCenterPress: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-2">
        <NavButton active={activeTab === "home"} icon={Home} label="Home" onClick={() => setActiveTab("home")} />
        <NavButton active={activeTab === "finance"} icon={CircleDollarSign} label="Finance" onClick={() => setActiveTab("finance")} />
        <button title="Open quick actions" aria-label="Open quick actions" onClick={onCenterPress} className="-mt-8 grid size-16 place-items-center rounded-full bg-[var(--saffron-gradient)] text-white shadow-[0_20px_40px_rgba(182,81,20,0.35)]"><Plus className="size-7" /></button>
        <NavButton active={activeTab === "manage"} icon={ClipboardList} label="Manage" onClick={() => setActiveTab("manage")} />
        <NavButton active={activeTab === "profile"} icon={Users} label="Profile" onClick={() => setActiveTab("profile")} />
      </div>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Home; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn("flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium", active ? "text-[var(--primary)]" : "text-[var(--muted)]")}><Icon className="size-5" />{label}</button>;
}

function QuickActionsSheet({ open, onOpenChange, actions }: { open: boolean; onOpenChange: (v: boolean) => void; actions: { label: string; icon: typeof Plus; onClick: () => void }[] }) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Quick Actions" description="Add key Mandal items quickly.">
      <div className="grid gap-3">{actions.map((a) => (<button key={a.label} onClick={() => { a.onClick(); onOpenChange(false); }} className="flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-white/90 px-4 py-4 text-left shadow-sm"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[var(--soft-orange)] text-[var(--primary)]"><a.icon className="size-5" /></div><span className="font-medium">{a.label}</span></div><ArrowRight className="size-4 text-[var(--muted)]" /></button>))}</div>
    </BottomSheet>
  );
}

function CreateMandalSheet({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (p: Omit<Mandal, "id" | "createdAt" | "updatedAt" | "festivalDay" | "logo" | "ownerId" | "joinCode">) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", location: "", city: "", state: "Maharashtra", description: "", mandalType: "Public Mandal" as Mandal["mandalType"], visibility: "Public" as "Public" | "Private", expectedMembers: 50, festivalDuration: 10 });
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Create Mandal" description={`Step ${step} of 3`}>
      {step === 1 && (<div className="grid gap-3"><Input label="Mandal Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Shree Ganesh Mandal" /><Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Sadashiv Peth" /><Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Pune" /><Input label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} placeholder="Maharashtra" /><TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe your Mandal" /></div>)}
      {step === 2 && (<div className="grid gap-3"><Select label="Mandal Type" value={form.mandalType} onChange={(v) => setForm({ ...form, mandalType: v as Mandal["mandalType"] })} options={["Public Mandal", "Society Mandal", "Private Mandal", "College Mandal", "Company Mandal"]} /><Select label="Visibility" value={form.visibility} onChange={(v) => setForm({ ...form, visibility: v as "Public" | "Private" })} options={["Public", "Private"]} /><Input label="Expected Number of Members" type="number" value={String(form.expectedMembers)} onChange={(v) => setForm({ ...form, expectedMembers: Number(v) })} /><Input label="Festival Duration (Days)" type="number" value={String(form.festivalDuration)} onChange={(v) => setForm({ ...form, festivalDuration: Number(v) })} /></div>)}
      {step === 3 && (<Card className="border-dashed"><div className="space-y-3 text-sm"><ReviewRow label="Mandal Name" value={form.name} /><ReviewRow label="Location" value={`${form.location}, ${form.city}, ${form.state}`} /><ReviewRow label="Description" value={form.description} /><ReviewRow label="Mandal Type" value={form.mandalType} /><ReviewRow label="Visibility" value={form.visibility} /><ReviewRow label="Expected Members" value={String(form.expectedMembers)} /><ReviewRow label="Festival Duration" value={`${form.festivalDuration} days`} /></div></Card>)}
      <div className="mt-5 flex gap-3">
        {step > 1 && <SecondaryButton label="Back" onClick={() => setStep(step - 1)} className="flex-1" />}
        {step < 3 ? (<PrimaryButton label="Next" onClick={() => setStep(step + 1)} className="flex-1" />) : (<PrimaryButton label="Create Mandal" onClick={() => { onSubmit(form); onOpenChange(false); setStep(1); setForm({ name: "", location: "", city: "", state: "Maharashtra", description: "", mandalType: "Public Mandal", visibility: "Public", expectedMembers: 50, festivalDuration: 10 }); }} className="flex-1" />)}
      </div>
    </BottomSheet>
  );
}

function ExploreMandalsSheet({ open, onOpenChange, currentUser, mandals, memberships, joinRequests, selectedMandalId, onSelectMandal, onRequestJoin, onOpenMandal }: { open: boolean; onOpenChange: (v: boolean) => void; currentUser: User; mandals: Mandal[]; memberships: Membership[]; joinRequests: JoinRequest[]; selectedMandalId: string | null; onSelectMandal: (id: string | null) => void; onRequestJoin: (p: Omit<JoinRequest, "id" | "createdAt" | "updatedAt" | "status" | "requestedAt">) => void; onOpenMandal: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [visibility, setVisibility] = useState("All");
  const [joinForm, setJoinForm] = useState({ name: "", phone: "", email: "", message: "I would like to join and participate in the Mandal activities." });

  useEffect(() => {
    if (!open) return;
    setJoinForm({
      name: currentUser.name,
      phone: currentUser.phone,
      email: currentUser.email,
      message: "I would like to join and participate in the Mandal activities.",
    });
  }, [currentUser, open]);

  const filtered = mandals.filter((m) => { const s = `${m.name} ${m.location}`.toLowerCase().includes(search.toLowerCase()); const c = cityFilter === "All" || m.city === cityFilter; const t = typeFilter === "All" || m.mandalType === typeFilter; const v = visibility === "All" || m.visibility === visibility; return s && c && t && v; });
  const selected = mandals.find((m) => m.id === selectedMandalId) ?? filtered[0];
  const memberCount = selected ? memberships.filter((i) => i.mandalId === selected.id).length : 0;
  const selectedRequest = selected ? joinRequests.find((r) => r.mandalId === selected.id && joinRequestBelongsToUser(r, currentUser)) : null;
  const selectedMembership = selected ? memberships.find((m) => m.mandalId === selected.id && membershipBelongsToUser(m, currentUser)) : null;
  const isOwner = selected?.ownerId === currentUser.id;
  const alreadyJoined = !!selectedMembership;
  const canRequestJoin = !!selected && !isOwner && !alreadyJoined && selectedRequest?.status !== "PENDING";
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Explore Mandals" description="Search, filter, and request to join.">
      <div className="grid gap-3">
        <Input value={search} onChange={setSearch} placeholder="Search by Mandal name or location" icon={Search} />
        <div className="grid grid-cols-3 gap-2"><Select value={cityFilter} onChange={setCityFilter} options={["All", ...Array.from(new Set(mandals.map((m) => m.city)))]} /><Select value={typeFilter} onChange={setTypeFilter} options={["All", "Public Mandal", "Society Mandal", "Private Mandal", "College Mandal", "Company Mandal"]} /><Select value={visibility} onChange={setVisibility} options={["All", "Public", "Private"]} /></div>
        <div className="grid gap-3">{filtered.length === 0 && <EmptyCompact text="No Mandals found." />}{filtered.map((m) => (<button key={m.id} onClick={() => onSelectMandal(m.id)} className={cn("rounded-[24px] border p-4 text-left", selected?.id === m.id ? "border-[var(--primary)] bg-[var(--soft-orange)]" : "border-[var(--border)] bg-white/90")}><p className="font-semibold">{m.logo} {m.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{m.city}, {m.state}</p><p className="mt-2 text-sm text-[var(--muted)]">{memberships.filter((ms) => ms.mandalId === m.id).length} Members • {m.visibility}</p></button>))}</div>
      </div>
      {selected && (
        <Card className="mt-5">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-[var(--soft-orange)] text-2xl">{selected.logo}</div>
            <div>
              <p className="text-xl font-semibold">{selected.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{selected.location}, {selected.city}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">{selected.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatPill label="Members" value={String(memberCount)} />
            <StatPill label="Type" value={selected.mandalType} />
          </div>

          {(isOwner || alreadyJoined || selectedRequest?.status === "PENDING") && (
            <div className="mt-4">
              {isOwner && (
                <div className="grid gap-3">
                  <Card className="bg-emerald-50">
                    <p className="font-semibold text-emerald-800">You are the owner of this Mandal.</p>
                    <p className="mt-1 text-sm text-emerald-700">Open it to see members, donations, expenses, events, and other items for this Mandal only.</p>
                  </Card>
                  <PrimaryButton label="Open Mandal" onClick={() => onOpenMandal(selected.id)} className="w-full" />
                </div>
              )}
              {!isOwner && alreadyJoined && (
                <div className="grid gap-3">
                  <Card className="bg-sky-50">
                    <p className="font-semibold text-sky-800">You are already a member of this Mandal.</p>
                    <p className="mt-1 text-sm text-sky-700">Open it to view this Mandal’s related items.</p>
                  </Card>
                  <PrimaryButton label="Open Mandal" onClick={() => onOpenMandal(selected.id)} className="w-full" />
                </div>
              )}
              {!isOwner && !alreadyJoined && selectedRequest?.status === "PENDING" && (
                <Card className="bg-amber-50">
                  <div className="flex items-center gap-3 text-amber-800">
                    <Check className="size-5" />
                    <div>
                      <p className="font-semibold">Request Sent Successfully</p>
                      <p className="text-sm">Your request is pending approval from the Mandal administrator.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {canRequestJoin && (
            <>
              <div className="mt-5 grid gap-3">
                <Input label="Name" value={joinForm.name} onChange={(v) => setJoinForm({ ...joinForm, name: v })} placeholder="Your name" />
                <Input label="Phone Number" value={joinForm.phone} onChange={(v) => setJoinForm({ ...joinForm, phone: v })} placeholder="9876543210" />
                <Input label="Email" value={joinForm.email} onChange={(v) => setJoinForm({ ...joinForm, email: v })} placeholder="you@example.com" />
                <TextArea label="Optional Message" value={joinForm.message} onChange={(v) => setJoinForm({ ...joinForm, message: v })} />
              </div>
              <div className="mt-4">
                <PrimaryButton
                  label="Request to Join"
                  onClick={() => {
                    onRequestJoin({ mandalId: selected.id, userId: currentUser.id, ...joinForm });
                  }}
                  className="w-full"
                />
              </div>
            </>
          )}
        </Card>
      )}
    </BottomSheet>
  );
}

function AddPaidSheet({
  open,
  onOpenChange,
  initialType = "donation",
  donationCategories,
  expenseCategories,
  onSubmitDonation,
  onSubmitExpense,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialType?: "donation" | "expense";
  donationCategories: string[];
  expenseCategories: string[];
  onSubmitDonation: (p: Omit<Donation, "id" | "createdAt" | "updatedAt" | "mandalId">) => void;
  onSubmitExpense: (p: Omit<Expense, "id" | "createdAt" | "updatedAt" | "mandalId">) => void;
}) {
  const [paidType, setPaidType] = useState<"donation" | "expense">(initialType);
  const [donationForm, setDonationForm] = useState({ donorName: "", amount: 5000, category: donationCategories[0] ?? "", paymentMethod: "UPI", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: 10000, category: expenseCategories[0] ?? "", vendor: "", paymentMethod: "UPI", date: new Date().toISOString().slice(0, 10), status: "Paid" as Expense["status"], notes: "" });

  useEffect(() => {
    if (!open) return;
    setPaidType(initialType);
    setDonationForm({ donorName: "", amount: 5000, category: donationCategories[0] ?? "", paymentMethod: "UPI", date: new Date().toISOString().slice(0, 10), notes: "" });
    setExpenseForm({ title: "", amount: 10000, category: expenseCategories[0] ?? "", vendor: "", paymentMethod: "UPI", date: new Date().toISOString().slice(0, 10), status: "Paid", notes: "" });
  }, [open, initialType, donationCategories, expenseCategories]);

  const categories = paidType === "donation" ? donationCategories : expenseCategories;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={paidType === "expense" ? "Add Expense" : "Add Paid"}
      description="Donations and expenses need owner or committee Accept / Reject before they are recorded."
    >
      <div className="grid gap-3">
        <TabPills value={paidType} onChange={(v) => setPaidType(v as "donation" | "expense")} options={[{ value: "donation", label: "Donation In" }, { value: "expense", label: "Expense Out" }]} />
        {categories.length === 0 && <EmptyCompact text="Add categories first from Finance → Categories or Quick Actions → Add Categories." />}
        {paidType === "donation" ? (
          <>
            <Input label="Donor Name" value={donationForm.donorName} onChange={(v) => setDonationForm({ ...donationForm, donorName: v })} />
            <Input label="Amount" type="number" value={String(donationForm.amount)} onChange={(v) => setDonationForm({ ...donationForm, amount: Number(v) })} />
            <Select label="Category" value={donationForm.category} onChange={(v) => setDonationForm({ ...donationForm, category: v })} options={donationCategories.length ? donationCategories : ["No categories added"]} />
            <Select label="Payment Method" value={donationForm.paymentMethod} onChange={(v) => setDonationForm({ ...donationForm, paymentMethod: v })} options={[...paymentMethods]} />
            <Input label="Date" type="date" value={donationForm.date} onChange={(v) => setDonationForm({ ...donationForm, date: v })} />
            <TextArea label="Comment (required)" value={donationForm.notes} onChange={(v) => setDonationForm({ ...donationForm, notes: v })} placeholder="Why is this donation being recorded?" />
          </>
        ) : (
          <>
            <Input label="Title" value={expenseForm.title} onChange={(v) => setExpenseForm({ ...expenseForm, title: v })} />
            <Input label="Amount" type="number" value={String(expenseForm.amount)} onChange={(v) => setExpenseForm({ ...expenseForm, amount: Number(v) })} />
            <Select label="Category" value={expenseForm.category} onChange={(v) => setExpenseForm({ ...expenseForm, category: v })} options={expenseCategories.length ? expenseCategories : ["No categories added"]} />
            <Input label="Vendor" value={expenseForm.vendor} onChange={(v) => setExpenseForm({ ...expenseForm, vendor: v })} />
            <Select label="Payment Method" value={expenseForm.paymentMethod} onChange={(v) => setExpenseForm({ ...expenseForm, paymentMethod: v })} options={[...paymentMethods]} />
            <Input label="Date" type="date" value={expenseForm.date} onChange={(v) => setExpenseForm({ ...expenseForm, date: v })} />
            <Select label="Payment Status" value={expenseForm.status} onChange={(v) => setExpenseForm({ ...expenseForm, status: v as Expense["status"] })} options={["Paid", "Pending", "Partially Paid"]} />
            <TextArea label="Comment (required)" value={expenseForm.notes} onChange={(v) => setExpenseForm({ ...expenseForm, notes: v })} placeholder="Why is this expense being recorded?" />
          </>
        )}
      </div>
      <PrimaryButton
        label="Save Payment"
        className="mt-5 w-full"
        onClick={() => {
          if (!categories.length) {
            toast.error("Please add a category first.");
            return;
          }
          if (paidType === "donation") {
            if (!donationForm.donorName.trim()) {
              toast.error("Please enter donor name.");
              return;
            }
            if (!donationForm.notes.trim()) {
              toast.error("Please add a comment before submitting.");
              return;
            }
            onSubmitDonation({ ...donationForm, donorName: donationForm.donorName.trim(), notes: donationForm.notes.trim(), paymentMethod: donationForm.paymentMethod as Donation["paymentMethod"], date: new Date(donationForm.date).toISOString() });
          } else {
            if (!expenseForm.title.trim()) {
              toast.error("Please enter a title.");
              return;
            }
            if (!expenseForm.notes.trim()) {
              toast.error("Please add a comment before submitting.");
              return;
            }
            onSubmitExpense({ ...expenseForm, title: expenseForm.title.trim(), notes: expenseForm.notes.trim(), paymentMethod: expenseForm.paymentMethod as Expense["paymentMethod"], date: new Date(expenseForm.date).toISOString() });
          }
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

function AddActivitySheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: { title: string; location?: string; notes: string }) => void;
}) {
  const [form, setForm] = useState({ title: "", location: "", notes: "" });
  useEffect(() => {
    if (!open) setForm({ title: "", location: "", notes: "" });
  }, [open]);
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add Activity" description="Current work happening now. No payment fields here.">
      <div className="grid gap-3">
        <Input label="Activity Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Decoration setup" />
        <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Where is this happening?" />
        <TextArea label="Comment" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Describe the current activity..." />
      </div>
      <PrimaryButton
        label="Submit Activity"
        className="mt-5 w-full"
        onClick={() => {
          if (!form.title.trim()) {
            toast.error("Please enter an activity title.");
            return;
          }
          if (!form.notes.trim()) {
            toast.error("Please add a comment.");
            return;
          }
          onSubmit({ title: form.title.trim(), location: form.location.trim() || undefined, notes: form.notes.trim() });
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

function AddEventSheet({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (p: Omit<EventItem, "id" | "createdAt" | "updatedAt" | "mandalId">) => void }) {
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10), time: "7:00 PM", location: "Main Stage", status: "Planned" as EventItem["status"], notes: "" });
  useEffect(() => {
    if (!open) {
      setForm({ title: "", date: new Date().toISOString().slice(0, 10), time: "7:00 PM", location: "Main Stage", status: "Planned", notes: "" });
    }
  }, [open]);
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add Event" description="Schedule upcoming events. No payment options here.">
      <div className="grid gap-3">
        <Input label="Event Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Input label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <Input label="Time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v as EventItem["status"] })} options={["Planned", "Upcoming"]} />
        <TextArea label="Comment" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Notes for this upcoming event..." />
      </div>
      <PrimaryButton
        label="Save Event"
        className="mt-5 w-full"
        onClick={() => {
          if (!form.title.trim()) {
            toast.error("Please enter a title.");
            return;
          }
          if (!form.notes.trim()) {
            toast.error("Please add a comment before submitting.");
            return;
          }
          onSubmit({
            title: form.title.trim(),
            date: new Date(form.date).toISOString(),
            time: form.time,
            location: form.location,
            budget: 0,
            status: form.status,
            volunteerIds: [],
            notes: form.notes.trim(),
          });
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

function NotificationsSheet({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  notifications: NotificationItem[];
  onNotificationClick: (n: NotificationItem) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Notifications" description="Tap a notification to open the related section.">
      <div className="grid gap-3">
        {notifications.length === 0 && <EmptyState title="No Notifications" description="All clear! Nothing to see here." />}
        {notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onNotificationClick(n)}
            className="rounded-[24px] border border-[var(--border)] bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{n.description}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(n.createdAt)}</p>
              </div>
              <Badge className={cn(n.read ? "bg-zinc-100 text-zinc-600" : "bg-[var(--soft-orange)] text-[var(--primary)]")}>
                {n.read ? "Read" : "New"}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

function FeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (message: string, rating: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setRating(5);
    }
  }, [open]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Send Feedback" description="Tell us what you like or what we can improve.">
      <div className="grid gap-4">
        <div>
          <Label>Rating</Label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={cn(
                  "grid size-11 place-items-center rounded-2xl border text-sm font-semibold",
                  rating >= value ? "border-[var(--primary)] bg-[var(--soft-orange)] text-[var(--primary)]" : "border-[var(--border)] bg-white/80 text-[var(--muted)]",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <TextArea label="Your feedback" value={message} onChange={setMessage} placeholder="Share your experience, suggestions, or issues..." />
      </div>
      <PrimaryButton
        label="Submit Feedback"
        className="mt-5 w-full"
        onClick={() => {
          if (!message.trim()) {
            toast.error("Please write your feedback before submitting.");
            return;
          }
          onSubmit(message.trim(), rating);
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

function JoinByCodeSheet({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (code: string) => boolean }) {
  const [code, setCode] = useState("");
  useEffect(() => {
    if (!open) setCode("");
  }, [open]);
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Join with Mandal Code" description="Enter the 6-character code shared by the Mandal admin.">
      <div className="grid gap-3">
        <Input label="Mandal Code" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="ABC123" />
        <p className="text-sm text-[var(--muted)]">Your join request will be sent for admin approval.</p>
      </div>
      <PrimaryButton
        label="Send Join Request"
        className="mt-5 w-full"
        onClick={() => {
          if (!code.trim()) {
            toast.error("Please enter a Mandal code.");
            return;
          }
          const success = onSubmit(code.trim());
          if (success) onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

function MandalCodeCopyButton({ joinCode, variant = "dark" }: { joinCode: string; variant?: "dark" | "light" }) {
  const copyCode = async () => {
    if (!joinCode?.trim()) {
      toast.error("Join code is not available for this Mandal.");
      return;
    }
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success("Mandal code copied.");
    } catch {
      toast.error("Could not copy code.");
    }
  };
  return (
    <button
      type="button"
      onClick={copyCode}
      disabled={!joinCode?.trim()}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50",
        variant === "light" ? "bg-white text-[var(--foreground)]" : "bg-[var(--foreground)] text-white",
      )}
    >
      <Copy className="size-4" /> Copy
    </button>
  );
}

function MandalCodeCard({ joinCode }: { joinCode: string }) {
  const displayCode = joinCode?.trim() || "------";
  return (
    <Card>
      <SectionTitle title="Mandal Join Code" subtitle="Also available at the top of Home. Share this code so people can request to join." />
      <div className="mt-4 flex items-center justify-between gap-3 rounded-[24px] bg-[var(--soft-orange)] px-4 py-4">
        <p className="text-2xl font-bold tracking-[0.35em]">{displayCode}</p>
        <MandalCodeCopyButton joinCode={joinCode} />
      </div>
      {!joinCode?.trim() && (
        <p className="mt-2 text-sm text-[var(--muted)]">Join code is missing. Try refreshing or contact support.</p>
      )}
    </Card>
  );
}

function AddCategoriesSheet({ open, onOpenChange, role, financeCategories, onAddCategory, onRemoveCategory }: { open: boolean; onOpenChange: (v: boolean) => void; role: Role; financeCategories: FinanceCategory[]; onAddCategory: (type: FinanceCategory["type"], name: string) => void; onRemoveCategory: (id: string) => void }) {
  const [newDonationCategory, setNewDonationCategory] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const donationCats = financeCategories.filter((item) => item.type === "donation");
  const expenseCats = financeCategories.filter((item) => item.type === "expense");
  useEffect(() => {
    if (!open) {
      setNewDonationCategory("");
      setNewExpenseCategory("");
    }
  }, [open]);
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add Categories" description="Categories you add here appear in donation and expense dropdowns.">
      <div className="grid gap-4">
        <Card>
          <SectionTitle title="Donation Categories" subtitle="Add your own categories for donations." />
          {canManageCategories(role) && (
            <div className="mt-4 flex gap-2">
              <Input value={newDonationCategory} onChange={setNewDonationCategory} placeholder="New donation category" />
              <PrimaryButton label="Add" onClick={() => { if (newDonationCategory.trim()) { onAddCategory("donation", newDonationCategory); setNewDonationCategory(""); } }} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {donationCats.length === 0 && <EmptyCompact text="No donation categories yet. Add your own above." />}
            {donationCats.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm">
                {item.name}
                {canManageCategories(role) && (
                  <button title="Remove category" aria-label="Remove category" onClick={() => onRemoveCategory(item.id)} className="text-[var(--danger)]"><Trash2 className="size-3.5" /></button>
                )}
              </span>
            ))}
          </div>
        </Card>
          <Card>
            <SectionTitle title="Expense Categories" subtitle="Add your own categories for expenses." />
            {canManageCategories(role) && (
              <div className="mt-4 flex gap-2">
                <Input value={newExpenseCategory} onChange={setNewExpenseCategory} placeholder="New expense category" />
                <PrimaryButton label="Add" onClick={() => { if (newExpenseCategory.trim()) { onAddCategory("expense", newExpenseCategory); setNewExpenseCategory(""); } }} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {expenseCats.length === 0 && <EmptyCompact text="No expense categories yet. Add your own below." />}
              {expenseCats.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm">
                {item.name}
                {canManageCategories(role) && (
                  <button title="Remove category" aria-label="Remove category" onClick={() => onRemoveCategory(item.id)} className="text-[var(--danger)]"><Trash2 className="size-3.5" /></button>
                )}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </BottomSheet>
  );
}

function BottomSheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return (<AnimatePresence>{open && (<><motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40" onClick={() => onOpenChange(false)} /><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-[var(--app-bg)] p-5 shadow-2xl"><div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--border)]" /><div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{title}</h3>{description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}</div><button onClick={() => onOpenChange(false)} title="Close" aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-white/80"><X className="size-4 text-[var(--muted)]" /></button></div>{children}</motion.div></>)}</AnimatePresence>);
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[28px] border border-[var(--border)] bg-white/88 p-5 shadow-[0_16px_40px_rgba(67,24,8,0.08)] backdrop-blur", className)}>{children}</div>;
}
function Label({ children }: { children: ReactNode }) { return <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{children}</p>; }
function Badge({ children, className }: { children: ReactNode; className?: string }) { return <span className={cn("inline-flex rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold", className)}>{children}</span>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return (<div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p></div>); }
function StatPill({ label, value }: { label: string; value: string }) { return <div className="rounded-[22px] bg-[var(--soft-orange)] p-4"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>; }
function HeroCard({ title, subtitle, body }: { title: string; subtitle: string; body: ReactNode }) { return <Card className="bg-hero-gradient text-white"><p className="text-3xl font-semibold">{title}</p><p className="mt-2 text-white/80">{subtitle}</p><div className="mt-5">{body}</div></Card>; }
function FeaturePanel({ icon: Icon, title, description, actionLabel, onAction }: { icon: typeof Building2; title: string; description: string; actionLabel: string; onAction: () => void }) { return <div className="rounded-[24px] bg-white/14 p-4"><div className="grid size-12 place-items-center rounded-2xl bg-white/15"><Icon className="size-5" /></div><p className="mt-4 text-lg font-semibold">{title}</p><p className="mt-2 text-sm text-white/80">{description}</p><button onClick={onAction} className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)]">{actionLabel}</button></div>; }
function MandalCard({ mandal, onClick }: { mandal: Mandal; onClick: () => void }) { return <button onClick={onClick} className="rounded-[28px] border border-[var(--border)] bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold">{mandal.logo} {mandal.name}</p><p className="mt-1 text-sm text-[var(--muted)]">📍 {mandal.city}, {mandal.state}</p><p className="mt-3 text-sm text-[var(--muted)]">{mandal.description}</p></div><ArrowRight className="size-5 text-[var(--muted)]" /></div><div className="mt-4"><Badge>{mandal.mandalType}</Badge></div></button>; }
function JoinRequestPreview({ request, onApprove }: { request: JoinRequest; onApprove: () => void }) { return <div className="flex items-center justify-between rounded-[22px] bg-[var(--soft-orange)] p-4"><div><p className="font-semibold">{request.name}</p><p className="text-sm text-[var(--muted)]">Wants to join your Mandal</p></div><button onClick={onApprove} className="rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white">Approve</button></div>; }
function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) { return <Card className="border-dashed text-center"><p className="text-lg font-semibold">{title}</p><p className="mt-2 text-sm text-[var(--muted)]">{description}</p>{actionLabel && onAction && <button onClick={onAction} className="mt-4 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-white">{actionLabel}</button>}</Card>; }
function EmptyCompact({ text }: { text: string }) { return <p className="mt-3 text-sm text-[var(--muted)]">{text}</p>; }
function QuickActionButton({ icon: Icon, label, onClick, prominent }: { icon: typeof Plus; label: string; onClick: () => void; prominent?: boolean }) { return <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className={cn("rounded-[24px] p-4 text-left shadow-sm", prominent ? "bg-[var(--foreground)] text-white" : "bg-[var(--soft-orange)] text-[var(--foreground)]")}><Icon className="size-5" /><p className="mt-3 text-base font-semibold">{label}</p></motion.button>; }
function PrimaryButton({ label, onClick, icon: Icon, className }: { label: string; onClick: () => void; icon?: typeof Plus; className?: string }) { return <button onClick={onClick} className={cn("inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-white", className)}>{Icon && <Icon className="size-4" />}{label}</button>; }
function SecondaryButton({ label, onClick, icon: Icon, className }: { label: string; onClick: () => void; icon?: typeof Search; className?: string }) { return <button onClick={onClick} className={cn("inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold", className)}>{Icon && <Icon className="size-4" />}{label}</button>; }
function SettingsRow({ title, description, action }: { title: string; description: string; action: ReactNode }) { return <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] p-4"><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{description}</p></div>{action}</div>; }
function BudgetCard({ item }: { item: BudgetItem }) { const r = item.allocated ? (item.spent / item.allocated) * 100 : 0; const t = r > 100 ? "bg-red-500" : r > 80 ? "bg-amber-500" : "bg-emerald-500"; return <Card><div className="flex items-center justify-between gap-3"><div><p className="text-lg font-semibold">{item.category}</p><p className="mt-2 text-sm text-[var(--muted)]">{formatCurrency(item.spent)} / {formatCurrency(item.allocated)}</p></div><Badge>{Math.round(r)}%</Badge></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100"><div className={cn("h-full rounded-full", t)} style={{ width: `${Math.min(r, 100)}%` }} /></div></Card>; }
function Input({ label, value, onChange, placeholder, type = "text", icon: Icon }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: typeof Search }) { return <label className="grid gap-2 text-sm"><span className="font-medium">{label}</span><div className="flex items-center gap-2 rounded-[20px] border border-[var(--border)] bg-white px-4 py-3">{Icon && <Icon className="size-4 text-[var(--muted)]" />}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none" /></div></label>; }
function TextArea({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) { return <label className="grid gap-2 text-sm"><span className="font-medium">{label}</span><textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-3 outline-none" /></label>; }
function Select({ label, value, onChange, options, optionLabels }: { label?: string; value: string; onChange: (v: string) => void; options: string[]; optionLabels?: Record<string, string> }) { return <label className="grid gap-2 text-sm"><span className="font-medium">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-3 outline-none">{options.map((o) => <option key={o} value={o}>{optionLabels?.[o] ?? o ?? "Select"}</option>)}</select></label>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4"><span className="text-[var(--muted)]">{label}</span><span className="max-w-[60%] text-right font-medium">{value}</span></div>; }
function TabPills({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) { return <div className="flex flex-wrap gap-2">{options.map((o) => <button key={o.value} onClick={() => onChange(o.value)} className={cn("rounded-full px-4 py-2 text-sm font-medium", value === o.value ? "bg-[var(--foreground)] text-white" : "bg-white/80 text-[var(--muted)]")}>{o.label}</button>)}</div>; }
function MemberCard({ member, canManage, onRoleChange, onRemove }: { member: Membership; canManage: boolean; onRoleChange: (id: string, role: Role) => void; onRemove: (id: string) => void }) {
  const normalizedRole = normalizeRole(member.role);
  const isOwnerMember = normalizedRole === "OWNER";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--soft-orange)] font-semibold">{getInitials(member.name)}</div>
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-sm text-[var(--muted)]">Role: {roleLabels[normalizedRole]}</p>
            <p className="text-sm text-[var(--muted)]">Joined: {formatDate(member.joinedAt)}</p>
          </div>
        </div>
        {canManage && !isOwnerMember && (
          <button title="Remove member" aria-label="Remove member" onClick={() => onRemove(member.id)} className="rounded-2xl p-2 text-[var(--danger)]">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      {canManage && !isOwnerMember && (
        <div className="mt-4">
          <Select
            value={normalizedRole}
            onChange={(v) => onRoleChange(member.id, v as Role)}
            options={memberRoleOptions}
            optionLabels={roleLabels}
          />
        </div>
      )}
    </Card>
  );
}
function ActivityLifecycleCard({ activity, role, currentUserId, onTransition }: { activity: ActivityItem; role: Role; currentUserId: string; onTransition: (id: string, status: ActivityStatus, comment: string) => boolean }) {
  const [comment, setComment] = useState("");
  const isPaid = isPaidActionType(activity.actionType);
  const nextStatuses = getNextActivityStatuses(activity.status, activity.actionType);
  const allowed = nextStatuses.filter((status) => canTransitionActivity(role, currentUserId, activity, status));

  const actionLabel: Record<ActivityStatus, string> = {
    PENDING: "Waiting Approval",
    OPEN: isPaid ? "Accept" : "Open",
    IN_PROGRESS: "Start / In Progress",
    DONE: isPaid ? "Accept" : "Mark Done",
    REJECTED: "Reject",
  };

  const paidPreview = (() => {
    if (!isPaid || !activity.payload) return null;
    try {
      const data = JSON.parse(activity.payload) as { donorName?: string; title?: string; amount?: number; category?: string; paymentMethod?: string };
      if (activity.actionType === "donation") {
        return `${formatCurrency(data.amount ?? 0)} from ${data.donorName} • ${data.category} • ${data.paymentMethod}`;
      }
      return `${formatCurrency(data.amount ?? 0)} for ${data.title} • ${data.category} • ${data.paymentMethod}`;
    } catch {
      return null;
    }
  })();

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{activity.title}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{activity.description}</p>
          {paidPreview && <p className="mt-2 text-sm font-medium text-[var(--primary)]">{paidPreview}</p>}
          <p className="mt-2 text-sm text-[var(--muted)]">By {activity.submittedByName} • {roleLabels[normalizeRole(activity.submittedByRole)]}</p>
        </div>
        <Badge>{isPaid && activity.status === "PENDING" ? "Awaiting Confirm" : ACTIVITY_STATUS_LABELS[activity.status]}</Badge>
      </div>

      {!isPaid && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(["PENDING", "OPEN", "IN_PROGRESS", "DONE", "REJECTED"] as ActivityStatus[]).map((step) => (
            <span
              key={step}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                activity.status === step ? "bg-[var(--foreground)] text-white" : "bg-[var(--soft-orange)] text-[var(--muted)]",
              )}
            >
              {ACTIVITY_STATUS_LABELS[step]}
            </span>
          ))}
        </div>
      )}

      {isPaid && activity.status === "PENDING" && (
        <p className="mt-3 text-sm text-[var(--muted)]">Owner or committee must Accept or Reject this payment.</p>
      )}

      <div className="mt-4 space-y-3">
        {activity.statusHistory.slice(0, 4).map((log) => (
          <div key={log.id} className="rounded-[18px] bg-[var(--soft-orange)] p-3 text-sm">
            <p className="font-medium">
              {log.fromStatus ? `${ACTIVITY_STATUS_LABELS[log.fromStatus]} → ${ACTIVITY_STATUS_LABELS[log.toStatus]}` : ACTIVITY_STATUS_LABELS[log.toStatus]}
            </p>
            <p className="mt-1 text-[var(--muted)]">{log.comment}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{log.changedByName} • {formatDate(log.changedAt)}</p>
          </div>
        ))}
      </div>

      {allowed.length > 0 && (
        <div className="mt-4 grid gap-3">
          <TextArea label="Comment (required)" value={comment} onChange={setComment} placeholder={isPaid ? "Add a note for accepting or rejecting this payment..." : "Add a note for this status change..."} />
          <div className="flex flex-wrap gap-2">
            {allowed.map((status) => (
              <button
                key={status}
                onClick={() => {
                  if (!comment.trim()) {
                    toast.error("Please add a comment before changing status.");
                    return;
                  }
                  const ok = onTransition(activity.id, status, comment.trim());
                  if (ok) setComment("");
                }}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-semibold",
                  status === "REJECTED" ? "border border-red-200 bg-red-50 text-[var(--danger)]" : "bg-[var(--foreground)] text-white",
                  isPaid && status === "DONE" && "flex-1",
                  isPaid && status === "REJECTED" && "flex-1",
                )}
              >
                {actionLabel[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {allowed.length === 0 && activity.status === "PENDING" && (
        <p className="mt-3 text-sm text-[var(--muted)]">{isPaid ? "Waiting for owner or committee to confirm this payment." : "Waiting for owner or committee approval."}</p>
      )}
    </Card>
  );
}
function JoinRequestCard({ request, onApprove, onReject }: { request: JoinRequest; onApprove: (id: string) => void; onReject: (id: string) => void }) { return <Card><div className="flex items-start gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-[var(--soft-orange)] font-semibold">{getInitials(request.name)}</div><div className="flex-1"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{request.name}</p><p className="text-sm text-[var(--muted)]">{request.phone} • {formatDate(request.requestedAt)}</p></div><Badge>{request.status}</Badge></div><p className="mt-2 text-sm text-[var(--muted)]">{request.message}</p>{request.status === "PENDING" && <div className="mt-4 flex gap-2"><button onClick={() => onReject(request.id)} className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium">Reject</button><button onClick={() => onApprove(request.id)} className="flex-1 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-white">Approve</button></div>}</div></div></Card>; }
function EventCard({ event }: { event: EventItem }) { return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold">{event.title}</p><p className="mt-2 text-sm text-[var(--muted)]">{formatDate(event.date)}</p><p className="mt-1 text-sm text-[var(--muted)]">{event.time}</p><p className="mt-1 text-sm text-[var(--muted)]">📍 {event.location}</p></div><Badge>{event.status}</Badge></div></Card>; }
function MobileMoneyCard({ title, amount, subtitle, meta }: { title: string; amount: number; subtitle: string; meta: string }) { return <div className="rounded-[24px] border border-[var(--border)] bg-white/90 p-4 shadow-sm"><p className="text-lg font-semibold">{title}</p><div className="mt-2 text-2xl font-bold">{formatCurrency(amount)}</div><p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p><p className="mt-1 text-sm text-[var(--muted)]">{meta}</p></div>; }
