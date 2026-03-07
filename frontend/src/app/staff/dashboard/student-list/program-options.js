export const PROGRAM_OPTIONS = [
  {
    id: "diploma-in-web-application-development-technology",
    label: "Diploma in Web Application Development Technology",
    category: "college",
  },
  {
    id: "diploma-in-office-administration-technology",
    label: "Diploma in Office Administration Technology",
    category: "college",
  },
  {
    id: "diploma-in-office-management-technology",
    label: "Diploma in Office Management Technology",
    category: "college",
  },
  {
    id: "diploma-in-hotel-and-restaurant-technology",
    label: "Diploma in Hotel and Restaurant Technology",
    category: "college",
  },
  {
    id: "bachelor-of-science-in-information-technology",
    label: "Bachelor of Science in Information Technology",
    category: "college",
  },
  {
    id: "bachelor-of-science-in-computer-science",
    label: "Bachelor of Science in Computer Science",
    category: "college",
  },
  {
    id: "bachelor-of-science-in-business-administration",
    label: "Bachelor of Science in Business Administration",
    category: "college",
  },
  {
    id: "bachelor-of-science-in-hospitality-management",
    label: "Bachelor of Science in Hospitality Management",
    category: "college",
  },
  {
    id: "science-technology-engineering-and-mathematics",
    label: "Science, Technology, Engineering and Mathematics",
    category: "shs",
  },
  {
    id: "humanities-and-social-sciences",
    label: "Humanities and Social Sciences",
    category: "shs",
  },
  {
    id: "accountancy-business-and-management",
    label: "Accountancy, Business, and Management",
    category: "shs",
  },
  {
    id: "general-academics",
    label: "General Academics",
    category: "shs",
  },
  {
    id: "tvl-computer-systems-servicing",
    label: "TVL - Computer Systems Servicing",
    category: "shs",
  },
  {
    id: "tvl-programming",
    label: "TVL - Programming",
    category: "shs",
  },
  {
    id: "tvl-animation",
    label: "TVL - Animation",
    category: "shs",
  },
  {
    id: "tvl-home-economics",
    label: "TVL - Home Economics",
    category: "shs",
  },
];

export const COLLEGE_PROGRAMS = PROGRAM_OPTIONS.filter((item) => item.category === "college");
export const SHS_PROGRAMS = PROGRAM_OPTIONS.filter((item) => item.category === "shs");
