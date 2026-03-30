export interface DocumentMeta {
  title: string;
  subtitle: string;
  preparedFor: string;
  projectType: string;
  currentPhase: string;
  preparedOn: string;
}

export interface TextSection {
  title: string;
  paragraphs: string[];
}

export interface ListSection {
  title: string;
  bullets: string[];
}

export interface TableSection {
  title: string;
  columns: string[];
  rows: string[][];
}

export const phaseOneDocumentMeta: DocumentMeta = {
  title: "AI-Driven Hospital Management System",
  subtitle: "Phase-1 Project Document",
  preparedFor: "Team Members",
  projectType: "Web-Based Hospital Operations Platform",
  currentPhase: "Phase-1",
  preparedOn: "March 27, 2026",
};

export const textSections: TextSection[] = [
  {
    title: "Executive Overview",
    paragraphs: [
      "The AI-Driven Hospital Management System is a web-based platform designed to digitize core hospital workflows, centralize patient data, and improve coordination between reception, doctors, and administrators. Hospital management systems typically include patient information management, appointment scheduling, prescription documentation, billing, and reporting to improve operational efficiency and record accessibility.",
      "Phase-1 focuses on secure role-based web portals for receptionist, doctor, and admin users. The first release establishes the digital operating foundation required for future patient-facing mobile features and AI-based adherence monitoring.",
    ],
  },
  {
    title: "Business Need",
    paragraphs: [
      "Hospitals that rely on manual or fragmented workflows often face delays in patient registration, appointment handling, treatment documentation, and billing coordination. Healthcare digital transformation guidance consistently recommends phased implementation so organizations can reduce operational disruption while improving workflow control and long-term adoption.",
      "This project addresses that need by introducing one centralized platform for patient records, appointments, prescriptions, billing, and reminder scheduling. A phased rollout is especially valuable in healthcare because it allows the system to stabilize at each stage before expanding into more advanced patient engagement and analytics functions.[1][5][3]",
    ],
  },
  {
    title: "Project Goal",
    paragraphs: [
      "The goal of Phase-1 is to reduce manual hospital work and establish a reliable digital workflow for patient treatment management. The system will allow receptionists to register patients and manage appointments, doctors to review history and create prescriptions, and administrators to monitor users and operational reports.[1][2][3]",
      "A strategic secondary goal is to build the data and architecture base required for AI-driven treatment adherence workflows in later phases. Healthcare implementation roadmaps emphasize that architecture, structured records, and phased expansion are essential for safe and scalable digital transformation.[4][5]",
    ],
  },
  {
    title: "Phase-1 Scope",
    paragraphs: [
      "Phase-1 includes only web applications and excludes the patient mobile application. The release covers receptionist, doctor, and admin portals along with patient registration, appointment scheduling, prescriptions, billing, reports, and reminder schedule storage.[1][3]",
      "The patient app, live notification delivery, and advanced AI adherence analytics are intentionally deferred to future phases. This approach aligns with phased healthcare implementation practices that prioritize high-impact core workflows first and add optimization layers later.",
    ],
  },
  {
    title: "Receptionist Portal",
    paragraphs: [
      "The receptionist portal acts as the operational entry point for patient intake and scheduling. It supports patient registration, patient data maintenance, appointment booking, token generation, billing support, and appointment list management.[1][3]",
    ],
  },
  {
    title: "Patient Registration",
    paragraphs: [
      "Receptionists will enter patient details such as name, phone number, age, gender, and visit reason or symptoms. Once saved, the system will generate a unique patient ID that becomes the reference key across appointments, billing, and treatment history.",
    ],
  },
  {
    title: "Appointment Management",
    paragraphs: [
      "Appointments can be scheduled by selecting doctor, date, and time slot, with token numbers assigned for queue handling. Appointment modules are a standard requirement in hospital system rollouts because they reduce manual confusion and improve patient flow management.",
    ],
  },
  {
    title: "Billing Module",
    paragraphs: [
      "The billing module will generate consultation and service invoices, track payment status, and link billing records with each patient visit. Centralized billing is a core part of hospital system implementation because it improves traceability and administrative control.",
    ],
  },
  {
    title: "Doctor Portal",
    paragraphs: [
      "The doctor portal will allow clinicians to search for patients using patient ID and access personal details, visit history, and medical notes. Centralized digital records improve continuity of care and reduce time lost in retrieving treatment information.",
    ],
  },
  {
    title: "Patient Details View",
    paragraphs: [
      "Doctors will be able to review patient demographics, prior visits, previous prescriptions, and notes in one screen. This supports faster diagnosis review and more consistent treatment decisions across repeated consultations.",
    ],
  },
  {
    title: "Prescription Module",
    paragraphs: [
      "Doctors will create digital prescriptions by entering medicine name, dosage, timing, and duration in a structured format. Structured data capture is necessary for downstream features such as reminder automation, treatment tracking, and future analytics.",
    ],
  },
  {
    title: "Adherence Monitoring Foundation",
    paragraphs: [
      "Phase-1 will store medicine schedule and reminder timing but will not yet track whether a patient took or missed each dose. This phase creates the foundational scheduling layer required before patient-facing reminders and adherence intelligence can be introduced.",
      "The Phase-1 design is intentionally foundation-first. Healthcare phased transformation models show that core data, training, and workflow stability should be established before launching broader optimization or intelligent engagement features.",
    ],
  },
  {
    title: "Admin Portal",
    paragraphs: [
      "The admin portal will manage user accounts, hospital configuration, reporting dashboards, and system settings. Administrative control and monitoring are standard parts of hospital management implementations because governance is needed alongside digitization.",
    ],
  },
  {
    title: "User Management",
    paragraphs: [
      "Admin users will create and manage login credentials for receptionist, doctor, and admin accounts. Secure user provisioning and controlled permissions are central to healthcare software planning.",
    ],
  },
  {
    title: "Reports and Analytics",
    paragraphs: [
      "The admin dashboard will display patient count, appointment trends, billing summary, revenue indicators, doctor activity, and system usage metrics. Project planning and healthcare implementation sources consistently identify reporting visibility as important for management review and operational decisions.",
    ],
  },
  {
    title: "AI Reminder Foundation",
    paragraphs: [
      "When a doctor creates a prescription, the system will store medicine timing, dosage schedule, and treatment duration in a structured database format. This prepares the platform for later activation of reminders through SMS, mobile notifications, or AI-supported adherence workflows.",
    ],
  },
  {
    title: "Security and Access Design",
    paragraphs: [
      "The system should implement role-based permissions so each user accesses only the modules needed for the assigned role. Secure phased healthcare rollouts depend on controlled access, user accountability, and clearly defined permissions from the earliest implementation stage.",
      "Recommended controls for Phase-1 include secure login, encrypted passwords, permission-based navigation, and audit-friendly record updates.",
    ],
  },
  {
    title: "Development Phase Plan",
    paragraphs: [
      "The overall project will be executed in multiple phases so each release builds on a stable operational foundation. Phased implementation is a well-established approach in healthcare digital transformation because it reduces risk, improves adoption, and allows organizations to expand capabilities gradually without disrupting essential hospital workflows.",
      "This phased roadmap follows software planning principles that recommend clear milestones, scope boundaries, and staged capability growth rather than attempting full-scale transformation in a single release.",
    ],
  },
  {
    title: "Phase-2 Direction",
    paragraphs: [
      "Phase-2 will extend the platform toward patient interaction by introducing the mobile app and notification workflows. Once Phase-1 has established reliable data capture and stable operational processes, the second release can safely expand into patient reminders and self-service experiences.",
    ],
  },
  {
    title: "Phase-3 Direction",
    paragraphs: [
      "Phase-3 will introduce AI-driven adherence tracking and advanced analytics. At that stage, the system can use accumulated prescription schedules, reminder events, and future patient response data to generate adherence insights, identify missed-dose risks, and support smarter follow-up planning.",
    ],
  },
  {
    title: "Strategic Value for Leadership",
    paragraphs: [
      "For leadership, this project is more than an operational software initiative because it creates a platform for scalable digital care management. Hospital transformation programs deliver the strongest value when they centralize records first, improve workflow control, and then expand into intelligence, automation, and patient engagement in measured phases.[4][5][9]",
      "A successful Phase-1 rollout will improve front-desk efficiency, strengthen prescription documentation, improve management reporting, and prepare the hospital for future AI-enabled healthcare services.",
    ],
  },
  {
    title: "Security and Access Design (Repeated in Source)",
    paragraphs: [
      "The system should implement role-based permissions so each user accesses only the modules needed for the assigned role. Secure phased healthcare rollouts depend on controlled access, user accountability, and clearly defined permissions from the earliest implementation stage.",
      "Recommended controls for Phase-1 include secure login, encrypted passwords, permission-based navigation, and audit-friendly record updates.",
    ],
  },
  {
    title: "Development Phase Plan (Repeated in Source)",
    paragraphs: [
      "The overall project will be executed in multiple phases so each release builds on a stable operational foundation. Phased implementation is a well-established approach in healthcare digital transformation because it reduces risk, improves adoption, and allows organizations to expand capabilities gradually without disrupting essential hospital workflows.",
      "This phased roadmap follows software planning principles that recommend clear milestones, scope boundaries, and staged capability growth rather than attempting full-scale transformation in a single release.",
    ],
  },
];

export const listSections: ListSection[] = [
  {
    title: "Phase-1 Objectives",
    bullets: [
      "Digitize patient registration and automatic patient ID generation.",
      "Streamline appointment booking and token-based scheduling.",
      "Enable doctors to review patient history and issue digital prescriptions.",
      "Store medicine schedule data for future reminder automation.",
      "Support billing with invoice generation and payment tracking.",
      "Implement secure role-based access for receptionist, doctor, and admin users.",
    ],
  },
  {
    title: "End-to-End Workflow",
    bullets: [
      "1. Receptionist registers the patient and the system generates a unique patient ID.",
      "2. Receptionist books an appointment by doctor, date, and slot.",
      "3. Patient attends the consultation.",
      "4. Doctor searches using patient ID and reviews previous history.",
      "5. Doctor creates a digital prescription and treatment plan.",
      "6. System stores medicine timing and reminder schedule.",
      "7. Receptionist generates the bill and updates payment status.",
      "This type of connected workflow reflects the phased hospital digitization model in which registration, consultation, documentation, and billing are integrated into a single operational system.",
    ],
  },
  {
    title: "Non-Functional Requirements",
    bullets: [
      "Security: The system should enforce role-based access, secure authentication, and controlled visibility of records.",
      "Reliability: The platform should maintain dependable access and accurate records for day-to-day hospital operations.",
      "Usability: Interfaces should be simple and efficient for front-desk and clinical users working in time-sensitive settings.",
      "Scalability: The architecture should support later expansion into patient apps, notifications, and AI-driven analytics.",
      "Performance: Patient search, appointment handling, and prescription saving should be responsive enough for routine clinical use.",
    ],
  },
  {
    title: "Deferred / Later-Phase Items",
    bullets: [
      "Missed-dose or taken-dose tracking.",
      "Advanced AI recommendation engine.",
      "Pharmacy, lab, and inpatient ward modules.",
    ],
  },
  {
    title: "NOTE",
    bullets: [
      "Start development with the web platform (Receptionist, Doctor, Admin portals).",
      "Ensure a clean, professional, dynamic, and mobile-responsive UI/UX for the web.",
      "Focus first on core hospital workflows: patient registration, appointments, prescriptions, billing and admin controls.",
      "Provide website progress updates every 2 days, summarizing what was completed.",
      "After every change, push code to GitHub and maintain an up-to-date repository.",
      "Every code change must have a clear commit message that explains what was modified.",
      "Once the core web platform is completed and stable, start building the AI Assistance module.",
      "Pause the patient mobile app development until completion of the web platform and AI assistance for doctors.",
    ],
  },
];

export const tableSections: TableSection[] = [
  {
    title: "User Roles",
    columns: ["Role", "Primary Responsibility", "Key Access"],
    rows: [
      [
        "Receptionist",
        "Front-desk operations and patient intake",
        "Register patients, manage records, book appointments, generate bills",
      ],
      [
        "Doctor",
        "Consultation and treatment documentation",
        "Search patient by ID, review history, create prescriptions, update treatment plans",
      ],
      [
        "Admin",
        "Governance and operational monitoring",
        "Manage users, configure settings, review reports and usage insights",
      ],
    ],
  },
  {
    title: "Functional Requirements",
    columns: ["Module", "Functional Requirement"],
    rows: [
      ["Authentication", "Secure login for admin, doctor, and receptionist users"],
      ["Patients", "Create, update, search, and maintain patient records"],
      ["Appointments", "Book, reschedule, cancel, and list appointments"],
      ["Prescriptions", "Create and store prescriptions with dosage, timing, and duration"],
      ["Billing", "Generate invoices, track payment status, and store billing history"],
      ["Reminders", "Store medicine schedule and reminder timing for future automation"],
      ["Reports", "Display patient count, appointments, billing summary, and user activity"],
      ["Admin Controls", "Create users, assign roles, and manage settings"],
    ],
  },
  {
    title: "Proposed Technical Stack",
    columns: ["Layer", "Technology Options / Notes", "Purpose"],
    rows: [
      [
        "Frontend Web",
        "React / Next.js, TypeScript, Tailwind CSS / Material UI",
        "Role-based web portals (receptionist, doctor, admin)",
      ],
      [
        "Backend Framework",
        "Node.js (Express/NestJS) / Django, RESTful APIs, authentication, validation",
        "Business logic and API layer",
      ],
      [
        "Database",
        "PostgreSQL, relational schema for patients, appointments, prescriptions, billing, reminders",
        "Transactional healthcare data storage",
      ],
      ["API Style", "REST (JSON), versioned endpoints, secure access", "Communication between frontend and backend"],
      [
        "Authentication",
        "JWT / Session-based auth, role-based access control (admin/doctor/receptionist)",
        "Secure login and authorization",
      ],
      [
        "Deployment",
        "Cloud hosting (AWS / Azure / GCP / Render / Railway), containerized with Docker (optional)",
        "Hosting of frontend and backend services",
      ],
      [
        "Version Control & CI/CD",
        "GitHub + Actions / GitLab CI, automated testing and deployment",
        "Reliable releases across phases",
      ],
    ],
  },
  {
    title: "Suggested Core Tables",
    columns: ["Table", "Purpose"],
    rows: [
      ["users", "Stores login credentials, role, profile data, and status"],
      ["patients", "Stores patient demographics and identification details"],
      ["appointments", "Stores booking data, doctor mapping, slot, and token number"],
      ["visits", "Stores consultation records per encounter"],
      ["prescriptions", "Stores prescription header linked to doctor and visit"],
      ["prescription_medicines", "Stores medicine dosage, timing, frequency, and duration"],
      ["bills", "Stores bill totals, payment status, and patient linkage"],
      ["bill_items", "Stores service-wise invoice line items"],
      ["reminders", "Stores reminder schedule for future patient notification modules"],
    ],
  },
  {
    title: "Development Phase Plan",
    columns: ["Phase", "Focus Area", "Major Deliverables"],
    rows: [
      [
        "Phase-1",
        "Core web portals and hospital workflow digitization",
        "Receptionist portal, doctor portal, admin portal, patient registration, appointments, prescriptions, billing, reports, reminder scheduling foundation",
      ],
      [
        "Phase-2",
        "Patient engagement and notification enablement",
        "Patient mobile app, SMS/app notifications, patient-side medicine reminders, basic self-service access",
      ],
      [
        "Phase-3",
        "AI adherence intelligence and analytics",
        "Dose adherence tracking, missed-dose analysis, AI-based follow-up insights, advanced reporting and treatment analytics",
      ],
    ],
  },
];