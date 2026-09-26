export type DevelopmentalDomain = 
  | 'social_emotional'
  | 'language_literacy'
  | 'math_logic'
  | 'cognitive_science'
  | 'physical_motor'
  | 'creative_arts';

export type MasteryLevel = 'emerging' | 'developing' | 'proficient' | 'advanced';

export type AcademicTerm = 'Fall Term (Q1)' | 'Winter Term (Q2)' | 'Spring Term (Q3)' | 'Summer Term (Q4)';

export interface DomainMeta {
  id: DevelopmentalDomain;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export interface Observation {
  id: string;
  studentId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  term: AcademicTerm;
  domain: DevelopmentalDomain;
  subCategory: string;
  rawNotes: string;
  masteryLevel: MasteryLevel;
  context: string; // e.g. "Independent Reading", "Small Group Math", "Recess/Free Play", "Science Lab"
  tags: string[];
  observedBy: string; // Teacher name
  strengthNote?: string;
  supportNeed?: string;
  milestoneMet?: string;
  timestamp: number;
}

export interface Milestone {
  id: string;
  domain: DevelopmentalDomain;
  title: string;
  description: string;
  ageBand: string; // e.g., "5-6 Years", "Grade 1"
  status: 'not_started' | 'emerging' | 'developing' | 'mastered';
  evidenceObservationIds: string[];
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  avatarUrl?: string;
  gradeLevel: string; // e.g., "Kindergarten", "Grade 1", "Grade 2"
  academicYear: string; // e.g., "2025 - 2026"
  dateOfBirth: string;
  parentContacts: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
    preferredLanguage: string;
  }[];
  notes?: string;
  ellStatus?: boolean;
  iepSupport?: boolean;
  interests: string[];
  targetGoals: string[];
}

export interface DomainGrowthScore {
  domain: DevelopmentalDomain;
  domainName: string;
  score: number; // 0 - 100
  previousScore: number;
  level: MasteryLevel;
  totalObservations: number;
  trend: 'improving' | 'steady' | 'needs_support';
  keyHighlights: string[];
}

export interface TermGrowthRecord {
  term: AcademicTerm;
  date: string;
  overallScore: number;
  domainScores: Record<DevelopmentalDomain, number>;
  observationCount: number;
}

export interface AIReport {
  id: string;
  studentId: string;
  generatedAt: string;
  term: AcademicTerm;
  type: 'parent_conference' | 'developmental_growth' | 'intervention_summary' | 'comprehensive_academic';
  executiveSummary: string;
  domainHighlights: {
    domain: DevelopmentalDomain;
    domainName: string;
    summary: string;
    strengths: string[];
    nextSteps: string[];
  }[];
  classroomSocialDynamic: string;
  recommendationsForHome: string[];
  recommendedClassroomScaffolds: string[];
  teacherReflection: string;
  growthVelocitySummary: string;
  generatedByModel: string;
}

export interface ClassroomData {
  classroomId: string;
  classroomName: string;
  grade: string;
  academicYear: string;
  leadTeacher: string;
  coTeachers: string[];
  students: Student[];
  observations: Observation[];
  reports: AIReport[];
  lastSyncedAt: string;
  version: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  hasUnsavedChanges: boolean;
  activeClassroomId: string;
  connectedDevicesCount: number;
  syncError: string | null;
}
