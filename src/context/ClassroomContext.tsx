import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClassroomData,
  Student,
  Observation,
  AIReport,
  SyncStatus,
  DevelopmentalDomain,
  DomainGrowthScore,
  TermGrowthRecord,
  AcademicTerm,
} from '../types';
import { INITIAL_CLASSROOM_DATA } from '../data/mockData';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';
import { pushClassroomToCloud, syncClassroomFromCloud, fetchServerHealth } from '../services/api';

const LOCAL_STORAGE_KEY = 'teacher_tracker_classroom_data_v1';
const ACTIVE_ROOM_KEY = 'teacher_tracker_active_room_id';

interface ClassroomContextType {
  classroom: ClassroomData;
  students: Student[];
  observations: Observation[];
  reports: AIReport[];
  selectedStudent: Student | null;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  activeView: 'roster' | 'student-detail' | 'growth-charts' | 'ai-reports' | 'parent-summary' | 'cohort-analytics';
  setActiveView: (view: 'roster' | 'student-detail' | 'growth-charts' | 'ai-reports' | 'parent-summary' | 'cohort-analytics') => void;
  
  // Observation actions
  addObservation: (obs: Omit<Observation, 'id' | 'timestamp'>) => Promise<Observation>;
  updateObservation: (obs: Observation) => Promise<void>;
  deleteObservation: (id: string) => Promise<void>;
  
  // Student actions
  addStudent: (student: Omit<Student, 'id'>) => Promise<Student>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  // Report actions
  saveReport: (report: AIReport) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  
  // Cloud Sync
  syncStatus: SyncStatus;
  triggerManualSync: () => Promise<void>;
  switchClassroom: (classroomId: string) => Promise<void>;
  
  // Computational Helpers
  getStudentDomainScores: (studentId: string) => DomainGrowthScore[];
  getStudentGrowthTrajectory: (studentId: string) => TermGrowthRecord[];
  getStudentObservations: (studentId: string) => Observation[];
  getStudentReports: (studentId: string) => AIReport[];
  
  // Filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDomainFilter: DevelopmentalDomain | 'all';
  setSelectedDomainFilter: (d: DevelopmentalDomain | 'all') => void;
  selectedTermFilter: AcademicTerm | 'all';
  setSelectedTermFilter: (t: AcademicTerm | 'all') => void;
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage or mock
  const [classroom, setClassroom] = useState<ClassroomData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local classroom cache:', e);
    }
    return INITIAL_CLASSROOM_DATA;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    return classroom.students.length > 0 ? classroom.students[0].id : null;
  });

  const [activeView, setActiveView] = useState<
    'roster' | 'student-detail' | 'growth-charts' | 'ai-reports' | 'parent-summary' | 'cohort-analytics'
  >('roster');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<DevelopmentalDomain | 'all'>('all');
  const [selectedTermFilter, setSelectedTermFilter] = useState<AcademicTerm | 'all'>('all');

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSynced: new Date(),
    hasUnsavedChanges: false,
    activeClassroomId: classroom.classroomId,
    connectedDevicesCount: 2, // Simulated active co-teacher devices
    syncError: null,
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(classroom));
      localStorage.setItem(ACTIVE_ROOM_KEY, classroom.classroomId);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [classroom]);

  // Push updates to cloud
  const pushToCloud = useCallback(async (dataToPush: ClassroomData) => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncError: null }));
    const res = await pushClassroomToCloud(dataToPush);
    if (res.success) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date(),
        hasUnsavedChanges: false,
        syncError: null,
      }));
    } else {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        hasUnsavedChanges: true,
        syncError: res.error || 'Failed to sync to cloud',
      }));
    }
  }, []);

  // Check health and initial cloud sync
  useEffect(() => {
    let mounted = true;
    async function initSync() {
      const health = await fetchServerHealth();
      if (!mounted) return;
      setSyncStatus((prev) => ({ ...prev, isOnline: health.status === 'ok' }));

      // Fetch from cloud if classroom exists
      const cloudData = await syncClassroomFromCloud(classroom.classroomId);
      if (cloudData && mounted) {
        if (cloudData.version > classroom.version) {
          setClassroom(cloudData);
        } else if (classroom.version > (cloudData.version || 0)) {
          // Push local ahead
          pushToCloud(classroom);
        }
      } else if (mounted) {
        // Initial push to register classroom in cloud store
        pushToCloud(classroom);
      }
    }

    initSync();

    // Background periodic sync check every 25 seconds
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const cloudData = await syncClassroomFromCloud(classroom.classroomId);
        if (cloudData && cloudData.version > classroom.version) {
          setClassroom(cloudData);
          setSyncStatus((prev) => ({
            ...prev,
            lastSynced: new Date(),
            hasUnsavedChanges: false,
          }));
        }
      }
    }, 25000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [classroom.classroomId]);

  // Manual Sync trigger
  const triggerManualSync = useCallback(async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    const cloudData = await syncClassroomFromCloud(classroom.classroomId);
    if (cloudData && cloudData.version > classroom.version) {
      setClassroom(cloudData);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date(),
        hasUnsavedChanges: false,
      }));
    } else {
      await pushToCloud(classroom);
    }
  }, [classroom, pushToCloud]);

  // Switch Classroom
  const switchClassroom = useCallback(async (newClassroomId: string) => {
    const cleanId = newClassroomId.trim().toUpperCase();
    if (!cleanId) return;

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, activeClassroomId: cleanId }));
    const remoteData = await syncClassroomFromCloud(cleanId);

    if (remoteData) {
      setClassroom(remoteData);
      if (remoteData.students.length > 0) {
        setSelectedStudentId(remoteData.students[0].id);
      }
    } else {
      // Create new classroom instance
      const newClassroom: ClassroomData = {
        classroomId: cleanId,
        classroomName: `Room ${cleanId}`,
        grade: 'Grade 1',
        academicYear: '2025 - 2026',
        leadTeacher: classroom.leadTeacher || 'Teacher Lead',
        coTeachers: [],
        students: [],
        observations: [],
        reports: [],
        lastSyncedAt: new Date().toISOString(),
        version: 1,
      };
      setClassroom(newClassroom);
      setSelectedStudentId(null);
      await pushToCloud(newClassroom);
    }

    setSyncStatus((prev) => ({
      ...prev,
      isSyncing: false,
      lastSynced: new Date(),
      activeClassroomId: cleanId,
    }));
  }, [classroom.leadTeacher, pushToCloud]);

  // Student CRUD
  const addStudent = useCallback(
    async (studentData: Omit<Student, 'id'>): Promise<Student> => {
      const newStudent: Student = {
        ...studentData,
        id: `stu-${Date.now()}`,
      };
      const updated = {
        ...classroom,
        students: [newStudent, ...classroom.students],
        version: classroom.version + 1,
      };
      setClassroom(updated);
      setSelectedStudentId(newStudent.id);
      pushToCloud(updated);
      return newStudent;
    },
    [classroom, pushToCloud]
  );

  const updateStudent = useCallback(
    async (updatedStudent: Student) => {
      const updated = {
        ...classroom,
        students: classroom.students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)),
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
    },
    [classroom, pushToCloud]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      const updated = {
        ...classroom,
        students: classroom.students.filter((s) => s.id !== id),
        observations: classroom.observations.filter((o) => o.studentId !== id),
        reports: classroom.reports.filter((r) => r.studentId !== id),
        version: classroom.version + 1,
      };
      setClassroom(updated);
      if (selectedStudentId === id) {
        setSelectedStudentId(updated.students.length > 0 ? updated.students[0].id : null);
      }
      pushToCloud(updated);
    },
    [classroom, selectedStudentId, pushToCloud]
  );

  // Observation CRUD
  const addObservation = useCallback(
    async (obsData: Omit<Observation, 'id' | 'timestamp'>): Promise<Observation> => {
      const newObs: Observation = {
        ...obsData,
        id: `obs-${Date.now()}`,
        timestamp: Date.now(),
      };
      const updated = {
        ...classroom,
        observations: [newObs, ...classroom.observations],
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
      return newObs;
    },
    [classroom, pushToCloud]
  );

  const updateObservation = useCallback(
    async (updatedObs: Observation) => {
      const updated = {
        ...classroom,
        observations: classroom.observations.map((o) => (o.id === updatedObs.id ? updatedObs : o)),
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
    },
    [classroom, pushToCloud]
  );

  const deleteObservation = useCallback(
    async (id: string) => {
      const updated = {
        ...classroom,
        observations: classroom.observations.filter((o) => o.id !== id),
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
    },
    [classroom, pushToCloud]
  );

  // Report CRUD
  const saveReport = useCallback(
    async (report: AIReport) => {
      const exists = classroom.reports.some((r) => r.id === report.id);
      const updatedReports = exists
        ? classroom.reports.map((r) => (r.id === report.id ? report : r))
        : [report, ...classroom.reports];

      const updated = {
        ...classroom,
        reports: updatedReports,
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
    },
    [classroom, pushToCloud]
  );

  const deleteReport = useCallback(
    async (id: string) => {
      const updated = {
        ...classroom,
        reports: classroom.reports.filter((r) => r.id !== id),
        version: classroom.version + 1,
      };
      setClassroom(updated);
      pushToCloud(updated);
    },
    [classroom, pushToCloud]
  );

  // Analytical Calculations
  const getStudentObservations = useCallback(
    (studentId: string): Observation[] => {
      return classroom.observations
        .filter((o) => o.studentId === studentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [classroom.observations]
  );

  const getStudentReports = useCallback(
    (studentId: string): AIReport[] => {
      return classroom.reports
        .filter((r) => r.studentId === studentId)
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    },
    [classroom.reports]
  );

  const getStudentDomainScores = useCallback(
    (studentId: string): DomainGrowthScore[] => {
      const studentObs = classroom.observations.filter((o) => o.studentId === studentId);
      const domains: DevelopmentalDomain[] = [
        'social_emotional',
        'language_literacy',
        'math_logic',
        'cognitive_science',
        'physical_motor',
        'creative_arts',
      ];

      return domains.map((domain) => {
        const domObs = studentObs.filter((o) => o.domain === domain);
        if (domObs.length === 0) {
          return {
            domain,
            domainName: DOMAIN_META[domain].name,
            score: 50,
            previousScore: 50,
            level: 'developing',
            totalObservations: 0,
            trend: 'steady',
            keyHighlights: ['Baseline observation pending'],
          };
        }

        // Sort by date ascending to calculate trajectory
        const sorted = [...domObs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate weighted score (more recent observations have higher weight)
        let weightedSum = 0;
        let weightTotal = 0;
        sorted.forEach((obs, idx) => {
          const weight = 1 + idx * 0.4;
          const levelScore = MASTERY_LEVEL_CONFIG[obs.masteryLevel].score;
          weightedSum += levelScore * weight;
          weightTotal += weight;
        });

        const currentScore = Math.round(weightedSum / weightTotal);
        const earliestScore = MASTERY_LEVEL_CONFIG[sorted[0].masteryLevel].score;
        const trend: 'improving' | 'steady' | 'needs_support' =
          currentScore - earliestScore > 6 ? 'improving' : currentScore - earliestScore < -6 ? 'needs_support' : 'steady';

        let level: 'emerging' | 'developing' | 'proficient' | 'advanced' = 'developing';
        if (currentScore >= 90) level = 'advanced';
        else if (currentScore >= 75) level = 'proficient';
        else if (currentScore >= 55) level = 'developing';
        else level = 'emerging';

        const highlights = sorted
          .filter((o) => o.strengthNote)
          .map((o) => o.strengthNote!)
          .slice(-2);

        return {
          domain,
          domainName: DOMAIN_META[domain].name,
          score: currentScore,
          previousScore: earliestScore,
          level,
          totalObservations: domObs.length,
          trend,
          keyHighlights: highlights.length > 0 ? highlights : ['Active classroom engagement'],
        };
      });
    },
    [classroom.observations]
  );

  const getStudentGrowthTrajectory = useCallback(
    (studentId: string): TermGrowthRecord[] => {
      const studentObs = classroom.observations.filter((o) => o.studentId === studentId);
      const terms: AcademicTerm[] = [
        'Fall Term (Q1)',
        'Winter Term (Q2)',
        'Spring Term (Q3)',
        'Summer Term (Q4)',
      ];

      const domains: DevelopmentalDomain[] = [
        'social_emotional',
        'language_literacy',
        'math_logic',
        'cognitive_science',
        'physical_motor',
        'creative_arts',
      ];

      const records: TermGrowthRecord[] = [];

      terms.forEach((term, index) => {
        const termObs = studentObs.filter((o) => o.term === term);
        // If no obs in future terms, only project or show existing terms
        if (termObs.length === 0 && index > 2) return;

        const domainScores: Record<DevelopmentalDomain, number> = {
          social_emotional: 50,
          language_literacy: 50,
          math_logic: 50,
          cognitive_science: 50,
          physical_motor: 50,
          creative_arts: 50,
        };

        domains.forEach((dom) => {
          const dObs = termObs.filter((o) => o.domain === dom);
          if (dObs.length > 0) {
            const avg = dObs.reduce((acc, curr) => acc + MASTERY_LEVEL_CONFIG[curr.masteryLevel].score, 0) / dObs.length;
            domainScores[dom] = Math.round(avg);
          } else {
            // Inherit previous term baseline if available
            const prev = records[records.length - 1];
            domainScores[dom] = prev ? prev.domainScores[dom] : 60 + index * 5;
          }
        });

        const overall = Math.round(
          Object.values(domainScores).reduce((a, b) => a + b, 0) / domains.length
        );

        const termDates: Record<AcademicTerm, string> = {
          'Fall Term (Q1)': 'Nov 2025',
          'Winter Term (Q2)': 'Feb 2026',
          'Spring Term (Q3)': 'Apr 2026',
          'Summer Term (Q4)': 'Jun 2026',
        };

        records.push({
          term,
          date: termDates[term],
          overallScore: overall,
          domainScores,
          observationCount: termObs.length,
        });
      });

      return records;
    },
    [classroom.observations]
  );

  const selectedStudent = useMemo(() => {
    return classroom.students.find((s) => s.id === selectedStudentId) || null;
  }, [classroom.students, selectedStudentId]);

  return (
    <ClassroomContext.Provider
      value={{
        classroom,
        students: classroom.students,
        observations: classroom.observations,
        reports: classroom.reports,
        selectedStudent,
        selectedStudentId,
        setSelectedStudentId,
        activeView,
        setActiveView,
        addObservation,
        updateObservation,
        deleteObservation,
        addStudent,
        updateStudent,
        deleteStudent,
        saveReport,
        deleteReport,
        syncStatus,
        triggerManualSync,
        switchClassroom,
        getStudentDomainScores,
        getStudentGrowthTrajectory,
        getStudentObservations,
        getStudentReports,
        searchTerm,
        setSearchTerm,
        selectedDomainFilter,
        setSelectedDomainFilter,
        selectedTermFilter,
        setSelectedTermFilter,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
