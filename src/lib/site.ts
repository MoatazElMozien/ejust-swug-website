/** Static club copy. Projects, team and socials live in the database. */
export const site = {
  name: "E-JUST SWUG",
  fullName: "SolidWorks User Group",
  university: "Egypt-Japan University of Science and Technology",
  location: "New Borg El Arab, Alexandria, Egypt",
  tagline: "Student engineers turning ideas into precise, working 3D designs.",
  description:
    "The E-JUST SolidWorks User Group (SWUG) is a student community dedicated to mastering 3D CAD — from first sketch to full mechanical assembly.",
  about: [
    "The E-JUST SolidWorks User Group (SWUG) is a community of engineering students dedicated to mastering 3D CAD design with one of the industry's most widely used mechanical design platforms.",
    "From concept to detailed assembly, our members tackle real engineering challenges, collaborate on complex mechanical systems, and build the technical skills that define tomorrow's engineers.",
  ],
  pillars: [
    { title: "3D Modeling", text: "Precision part and assembly design from the ground up." },
    { title: "Mechanical Systems", text: "Complete, functional assemblies with real-world applications." },
    { title: "Engineering Drawing", text: "Technical documentation to industry standards." },
    { title: "Innovation", text: "Creative engineering solutions that push the limits." },
  ],
};

export const CATEGORIES = [
  "Engines & Propulsion",
  "Industrial Machinery",
  "Vehicles & Robotics",
  "Energy & Sustainability",
  "Mechanisms & Structures",
  "Biomedical",
  "Surface Design",
  "General",
] as const;

export const STATUS_LABEL = {
  COMPLETE: "Complete",
  IN_PROGRESS: "In progress",
  CONCEPT: "Concept",
} as const;

export const STATE_LABEL = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Changes requested",
} as const;

export const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "X",
  "GitHub",
  "WhatsApp",
  "Telegram",
  "Discord",
  "Email",
  "Website",
] as const;
