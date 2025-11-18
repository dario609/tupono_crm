export const permissionsInputLabel = {
   roles_permissions: "roles_permissions",
   user_management: "user_management",
   report_management: "report_management",
   project_management: "project_management",
   calendar_management: "calendar_management",
   document_file_management: "document_file_management",
   message_support_management: "message_support_management",
   assessment_management: "assessment_management",
   engagement_tracker: "engagement_tracker",
};  

export const basePermissionList = [
    {
        level_name: "Roles & Permissions",
        input_name: permissionsInputLabel.roles_permissions,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "User Management",
        input_name: permissionsInputLabel.user_management,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Report Management",
        input_name: permissionsInputLabel.report_management,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Project Management",
        input_name: permissionsInputLabel.project_management,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Calendar Management",
        input_name: permissionsInputLabel.calendar_management,
        value: ["is_view"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Document/File Management",
        input_name: permissionsInputLabel.document_file_management,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Message/Support Management",
        input_name: permissionsInputLabel.message_support_management,
        value: ["is_view", "is_add"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Assessment Management",
        input_name: permissionsInputLabel.assessment_management,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    },
    {
        level_name: "Engagement Tracker",
        input_name: permissionsInputLabel.engagement_tracker,
        value: ["is_view", "is_add", "is_edit", "is_delete"],
        is_view: false,
        is_add: false,
        is_edit: false,
        is_delete: false,
    }
];

const superAdmin = "Super Admin";
const admin = "Admin";
const kaimahi = "Kaimahi";
const hapu = "Hapu";
const accounts = "Accounts";
const teTokotoru = "Te Tokotoru";


export const rolesLabel = {
    superAdmin,
    admin,
    kaimahi,
    hapu,
    accounts,
    teTokotoru,
};

