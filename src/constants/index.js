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

export const tasksTemplates = {
    tasks: [
        {   
            category: 'General Administration',
            content: 'Open and set up office (lights, alarms, HVAC as required).',
            description: '',
        },
        {
            category: 'General Administration',
            content: 'Check emails and phone messages; prioritise responses.',
            description: '',
        },
        {
            category: 'General Administration',
            content: 'Update calendars, schedules, and shared diaries.',
            description: '',
        },
        
        {
            category: 'General Administration',
            content: 'Prepare meeting rooms and materials.',
            description: '',
        },
        {
            category: 'General Administration',
            content: 'Order office supplies and check inventory levels.',
            description: '',
        },
        {
            category: 'Communication & Coordination',
            content: 'Respond to staff enquiries.',
            description: '',
        },
        {
            category: 'Communication & Coordination',
            content: 'Distribute internal communications and memos.',
            description: '',
        },
        {
            category: 'Communication & Coordination',
            content: 'Coordinate weekly team meetings and prepare agendas.',
            description: '',
        },
        {
            category: 'Communication & Coordination',
            content: 'Send meeting minutes and follow-up actions.',
            description: '',
        },      
        {
            category: 'Document & Data Management',
            content: 'File incoming paperwork (digital and physical).',
            description: '',
        },
        {
            category: 'Document & Data Management',
            content: 'Update databases, registers, and CRM entries.',
            description: '',
        },
        {
            category: 'Document & Data Management',
            content: 'Scan, upload, and archive documents.',
            description: '',
        },
        {
            category: 'Document & Data Management',
            content: 'Prepare reports, templates, or spreadsheets as required.',
            description: '',
        },
        {
            category: 'Finance & Procurement Support',
            content: 'Process invoices and receipts.',
            description: '',
        },
        {
            category: 'Finance & Procurement Support',
            content: 'Prepare purchase orders.',
            description: '',
        },
        {
            category: 'Finance & Procurement Support',
            content: 'Reconcile weekly spending or petty cash.',
            description: '',
        },
        {
            category: 'Finance & Procurement Support',
            content: 'Liaise with suppliers for deliveries and quotes.',
            description: '',
        },
        {
            category: 'Staff & Office Support',
            content: 'Organise staff travel/accommodation bookings.',
            description: '',
        },
        {
            category: 'Staff & Office Support',
            content: 'Assist with onboarding forms for new staff.',
            description: '',
        },
        {
            category: 'Staff & Office Support',
            content: 'Schedule training sessions.',
            description: '',
        },
        {
            category: 'Staff & Office Support',
            content: 'Support team project work (printing, formatting, logistics).',
            description: '',
        },
        {
            category: 'Health, Safety & Compliance',
            content: 'Update H&S registers and incident logs.',
            description: '',
        },
        {
            category: 'Health, Safety & Compliance',
            content: 'Check first aid kits and emergency supplies.',
            description: '',
        },
        {
            category: 'Health, Safety & Compliance',
            content: 'Ensure office is tidy and hazard‑free.',
            description: '',
        },      
        {
            category: 'Health, Safety & Compliance',
            content: 'Confirm contractor sign-ins and H&S documentation.',
            description: '',
        },
        {
            category: 'End-of-Week Wrap‑Up',
            content: 'Prepare weekly summary report.',
            description: '',
        },
        {
            category: 'End-of-Week Wrap‑Up',
            content: 'Update task list for the following week.',
            description: '',
        },
        {
            category: 'End-of-Week Wrap‑Up',
            content: 'Organise and back up digital files.',
            description: '',
        },
        {
            category: 'End-of-Week Wrap‑Up',
            content: 'Ensure meeting rooms and shared spaces are reset.',
            description: '',
        },
    ]
}
const taskStatuses = [
    'Just starting',
    'Working',
    'Nearly Complete',
    'Complete',
];

const taskCategories = [
    'Admin',
    'Finance',
    'Other',
    'Vehicle',
    'Travel',
    'Report Support',
];

export const taskDurationTypes = [
    'Daily',
    'Weekly',
    'Monthly',
];

export { taskStatuses, taskCategories };