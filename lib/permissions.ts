import { ActivityActionType, ActivityItem, ActivityStatus, JoinRequest, Membership, Role, User } from "@/lib/types";

const LEGACY_COMMITTEE_ROLES: Role[] = ["ADMIN", "TREASURER", "EVENT_MANAGER", "COMMITTEE_MEMBER"];

function normalizedEmail(email?: string) {
  return email?.trim().toLowerCase() ?? "";
}

export function emailsMatch(a?: string, b?: string) {
  const left = normalizedEmail(a);
  const right = normalizedEmail(b);
  return Boolean(left && right && left === right);
}

export function membershipBelongsToUser(
  membership: Pick<Membership, "userId" | "email">,
  user: Pick<User, "id" | "email">,
) {
  if (membership.userId === user.id) return true;
  return emailsMatch(membership.email, user.email);
}

export function joinRequestBelongsToUser(
  request: Pick<JoinRequest, "userId" | "email">,
  user: Pick<User, "id" | "email">,
) {
  if (request.userId && request.userId === user.id) return true;
  return emailsMatch(request.email, user.email);
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: "Waiting Approval",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  REJECTED: "Rejected",
};

export function normalizeRole(role: Role): Role {
  if (role === "ADMIN" || role === "TREASURER" || role === "EVENT_MANAGER") {
    return "COMMITTEE_MEMBER";
  }
  return role;
}

export function isOwner(role: Role) {
  return role === "OWNER";
}

export function isCommitteeMember(role: Role) {
  return LEGACY_COMMITTEE_ROLES.includes(role);
}

export function canApproveActivities(role: Role) {
  return isOwner(role) || isCommitteeMember(role);
}

export function needsActivityApproval(role: Role) {
  return !isOwner(role);
}

export function canViewJoinCode(role: Role) {
  return canApproveActivities(role);
}

export function canManageMembers(role: Role) {
  return isOwner(role);
}

export function canManageCategories(role: Role) {
  return canApproveActivities(role);
}

export function canManageFinance(role: Role) {
  return canApproveActivities(role);
}

export function assignableMemberRoles(): Role[] {
  return ["MEMBER", "COMMITTEE_MEMBER"];
}

export function isPaidActionType(actionType: ActivityActionType) {
  return actionType === "donation" || actionType === "expense";
}

export function getNextActivityStatuses(status: ActivityStatus, actionType?: ActivityActionType): ActivityStatus[] {
  if (actionType && isPaidActionType(actionType)) {
    if (status === "PENDING") return ["DONE", "REJECTED"];
    return [];
  }

  switch (status) {
    case "PENDING":
      return ["OPEN", "REJECTED"];
    case "OPEN":
      return ["IN_PROGRESS", "DONE"];
    case "IN_PROGRESS":
      return ["DONE"];
    default:
      return [];
  }
}

export function canReviewActivity(
  reviewerRole: Role,
  reviewerUserId: string,
  item: Pick<ActivityItem, "submittedByUserId" | "status">,
) {
  if (item.status !== "PENDING") return false;
  if (!canApproveActivities(reviewerRole)) return false;
  if (isOwner(reviewerRole)) return true;
  return item.submittedByUserId !== reviewerUserId;
}

export function canTransitionActivity(
  role: Role,
  userId: string,
  activity: ActivityItem,
  toStatus: ActivityStatus,
) {
  if (!getNextActivityStatuses(activity.status, activity.actionType).includes(toStatus)) return false;
  if (isPaidActionType(activity.actionType)) {
    return canReviewActivity(role, userId, activity);
  }
  if (toStatus === "OPEN" || toStatus === "REJECTED") {
    return canReviewActivity(role, userId, activity);
  }
  return canApproveActivities(role);
}

export function migrateActivityStatus(status: string): ActivityStatus {
  if (status === "APPROVED") return "OPEN";
  if (status === "PENDING" || status === "OPEN" || status === "IN_PROGRESS" || status === "DONE" || status === "REJECTED") {
    return status;
  }
  return "DONE";
}
