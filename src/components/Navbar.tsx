import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Cloud,
  CloudOff,
  RefreshCw,
  Plus,
  BarChart3,
  Users,
  FileText,
  Sparkles,
  Printer,
  SlidersHorizontal,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { subscribeAuthState, AuthState } from '../services/googleAuth';

interface NavbarProps {
  onOpenObservationModal: () => void;
  onOpenSyncModal: () => void;
  onOpenNewStudentModal: () => void;
  onOpenWorkspaceModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenObservationModal,
  onOpenSyncModal,
  onOpenNewStudentModal,
  onOpenWorkspaceModal,
}) => {
  const {
    classroom,
    activeView,
    setActiveView,
    syncStatus,
    triggerManualSync,
    selectedStudent,
  } = useClassroom();

  const [googleAuth, setGoogleAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsub = subscribeAuthState((state) => {
      setGoogleAuth(state);
    });
    return () => unsub();
  }, []);

  return (
    <header className="bg-[#09090B] border-b border-[#27272A] sticky top-0 z-30 shadow-md">
      {/* Top Banner: School & Classroom Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Classroom info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-[#09090B] shadow-sm shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 font-bold stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                  OBSERVE<span className="text-emerald-500">LY</span>
                </h1>
                <span className="hidden md:inline text-xs text-[#71717A]">•</span>
                <span className="hidden md:inline text-xs font-medium text-[#A1A1AA]">
                  Developmental Tracker
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#18181B] text-emerald-400 border border-[#27272A]">
                  {classroom.academicYear}
                </span>
              </div>
              <p className="text-xs text-[#71717A] font-medium">
                {classroom.classroomName} • Lead: {classroom.leadTeacher}
              </p>
            </div>
          </div>

          {/* Right Action Tools & Cloud Sync Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Workspace Button */}
            <button
              id="google-workspace-nav-btn"
              onClick={onOpenWorkspaceModal}
              title="Google Workspace: Export to Google Sheets, Docs & Drive"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                googleAuth.isAuthenticated
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-white border-[#27272A] hover:border-emerald-500/40'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">Workspace</span>
              {googleAuth.isAuthenticated && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Cloud Sync Status Indicator */}
            <button
              id="cloud-sync-status-btn"
              onClick={onOpenSyncModal}
              title="Click to manage multi-device cloud synchronization"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                syncStatus.isSyncing
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : syncStatus.hasUnsavedChanges
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-white border-[#27272A] hover:border-emerald-500/40'
              }`}
            >
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : syncStatus.isOnline ? (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline uppercase text-[10px] tracking-wider font-semibold">
                {syncStatus.isSyncing
                  ? 'Syncing Cloud...'
                  : syncStatus.hasUnsavedChanges
                  ? 'Unsaved Changes'
                  : 'Cloud Synced'}
              </span>
              <span className="bg-[#27272A] px-1.5 py-0.2 rounded text-[10px] text-zinc-300 font-mono">
                {classroom.classroomId}
              </span>
            </button>

            {/* Log Observation Button */}
            <button
              id="log-observation-btn"
              onClick={onOpenObservationModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/10 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Observation</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 border-t border-[#27272A] text-xs sm:text-sm">
          <button
            id="nav-tab-roster"
            onClick={() => setActiveView('roster')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'roster'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Roster</span>
          </button>

          <button
            id="nav-tab-student-detail"
            onClick={() => setActiveView('student-detail')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'student-detail'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              Student 360° {selectedStudent ? `(${selectedStudent.firstName})` : ''}
            </span>
          </button>

          <button
            id="nav-tab-growth-charts"
            onClick={() => setActiveView('growth-charts')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'growth-charts'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Growth Trends</span>
          </button>

          <button
            id="nav-tab-ai-reports"
            onClick={() => setActiveView('ai-reports')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'ai-reports'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Report Studio</span>
          </button>

          <button
            id="nav-tab-parent-summary"
            onClick={() => setActiveView('parent-summary')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'parent-summary'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Printer className="w-4 h-4 text-zinc-400" />
            <span>Parent Meeting PDF</span>
          </button>

          <button
            id="nav-tab-cohort-analytics"
            onClick={() => setActiveView('cohort-analytics')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'cohort-analytics'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Cohort Overview</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
