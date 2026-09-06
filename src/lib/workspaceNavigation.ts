export type WorkspaceProfileRole = "hr_admin" | "manager" | "employee";

export interface WorkspaceNavigationItem {
  title:
    | "Overview"
    | "Organization"
    | "People"
    | "Review cycles"
    | "Team goals"
    | "Assigned reviews"
    | "My review";
  url: string;
  icon:
    | "dashboard"
    | "organization"
    | "people"
    | "cycles"
    | "goals"
    | "assessments"
    | "review";
  accent: "--accent-blue" | "--accent-red" | "--accent-purple" | "--accent-green";
}

export interface WorkspaceNavigationGroup {
  label: "Workspace" | "Manage" | "Team" | "Review work" | "Personal";
  items: WorkspaceNavigationItem[];
}

export type RoleNavigationItem = WorkspaceNavigationItem;
export type RoleNavigationGroup = WorkspaceNavigationGroup;

const overviewItem: WorkspaceNavigationItem = {
  title: "Overview",
  url: "/dashboard",
  icon: "dashboard",
  accent: "--accent-blue",
};

const assignedReviewsItem: WorkspaceNavigationItem = {
  title: "Assigned reviews",
  url: "/appraisals/assessments",
  icon: "assessments",
  accent: "--accent-purple",
};

const myReviewItem: WorkspaceNavigationItem = {
  title: "My review",
  url: "/appraisals/my-review",
  icon: "review",
  accent: "--accent-green",
};

export function getWorkspaceNavigationGroups(
  profileRole: WorkspaceProfileRole,
): WorkspaceNavigationGroup[] {
  if (profileRole === "hr_admin") {
    return [
      { label: "Workspace", items: [overviewItem] },
      {
        label: "Manage",
        items: [
          {
            title: "Organization",
            url: "/org/structure",
            icon: "organization",
            accent: "--accent-red",
          },
          {
            title: "People",
            url: "/org/employees",
            icon: "people",
            accent: "--accent-purple",
          },
          {
            title: "Review cycles",
            url: "/appraisals",
            icon: "cycles",
            accent: "--accent-green",
          },
        ],
      },
    ];
  }

  if (profileRole === "manager") {
    return [
      { label: "Workspace", items: [overviewItem] },
      {
        label: "Team",
        items: [
          {
            title: "Team goals",
            url: "/appraisals/goals",
            icon: "goals",
            accent: "--accent-red",
          },
          assignedReviewsItem,
        ],
      },
      { label: "Personal", items: [myReviewItem] },
    ];
  }

  return [
    { label: "Workspace", items: [overviewItem] },
    { label: "Review work", items: [assignedReviewsItem] },
    { label: "Personal", items: [myReviewItem] },
  ];
}
