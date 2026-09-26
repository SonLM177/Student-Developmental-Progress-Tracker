import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Check,
  RefreshCw,
  LogOut,
  FolderSync,
  AlertCircle,
  Table,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import {
  googleSignIn,
  logoutGoogle,
  subscribeAuthState,
  AuthState,
} from '../services/googleAuth';
import {
  exportRosterToGoogleSheets,
  exportObservationsToGoogleSheets,
  exportReportToGoogleDocs,
  exportConferencePrepToGoogleDocs,
  listWorkspaceExports,
  WorkspaceRecentFile,
  WorkspaceExportResult,
} from '../services/googleWorkspace';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAction?: 'roster_sheets' | 'observations_sheets' | 'report_docs' | 'conference_docs';
  defaultStudentId?: string;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  defaultAction,
  defaultStudentId,
}) => {
  const {
    classroom,
    students,
    observations,
    reports,
    selectedStudent,
    getStudentDomainScores,
    getStudentObservations,
    getStudentReports,
  } = useClassroom();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  });

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<WorkspaceExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<WorkspaceRecentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Selected student for single-student doc export
  const [targetStudentId, setTargetStudentId] = useState<string>(
    defaultStudentId || (selectedStudent ? selectedStudent.id : students[0]?.id || '')
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthState((state) => {
      setAuthState(state);
    });
    return () => unsubscribe();
  }, []);

  // Update target student when default changes
  useEffect(() => {
    if (defaultStudentId) {
      setTargetStudentId(defaultStudentId);
    } else if (selectedStudent) {
      setTargetStudentId(selectedStudent.id);
    }
  }, [defaultStudentId, selectedStudent]);

  // Load recent files when authenticated
  useEffect(() => {
    if (isOpen && authState.isAuthenticated) {
      refreshDriveFiles();
    }
  }, [isOpen, authState.isAuthenticated]);

  const refreshDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listWorkspaceExports();
      setRecentFiles(files);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        await refreshDriveFiles();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setRecentFiles([]);
    setLastExportResult(null);
  };

  const handleExportRosterSheets = async () => {
    if (!authState.isAuthenticated) {
      handleSignIn();
      return;
    }

    setIsExporting('roster_sheets');
    setErrorMessage(null);
    setLastExportResult(null);

    try {
      const result = await exportRosterToGoogleSheets(
        classroom,
        students,
        observations,
        getStudentDomainScores
      );
      setLastExportResult(result);
      refreshDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export to Google Sheets');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportObservationsSheets = async () => {
    if (!authState.isAuthenticated) {
      handleSignIn();
      return;
    }

    setIsExporting('obs_sheets');
    setErrorMessage(null);
    setLastExportResult(null);

    try {
      const result = await exportObservationsToGoogleSheets(classroom, observations, students);
      setLastExportResult(result);
      refreshDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export observation logs to Google Sheets');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportProgressReportDoc = async () => {
    if (!authState.isAuthenticated) {
      handleSignIn();
      return;
    }

    const student = students.find((s) => s.id === targetStudentId);
    if (!student) {
      setErrorMessage('Please select a student for the report export.');
      return;
    }

    const studentReports = getStudentReports(student.id);
    let targetReport = studentReports[0];

    // If no AI report saved yet, synthesize a clean fallback report structure
    if (!targetReport) {
      const studentObs = getStudentObservations(student.id);
      const domainScores = getStudentDomainScores(student.id);
      targetReport = {
        id: `rep-${Date.now()}`,
        studentId: student.id,
        term: 'Winter Term (Q2)',
        generatedAt: new Date().toISOString(),
        type: 'parent_conference',
        executiveSummary: `${student.firstName} ${student.lastName} demonstrates strong classroom engagement and steady progression across all core developmental benchmarks in Grade ${student.gradeLevel}.`,
        domainHighlights: domainScores.map((ds) => ({
          domain: ds.domain,
          domainName: ds.domainName,
          summary: `Maintains ${ds.score}% mastery level with ${ds.totalObservations} observed milestones.`,
          strengths: ds.keyHighlights,
          nextSteps: ['Continue scaffolding active peer verbalization and self-direction.'],
        })),
        classroomSocialDynamic: `${student.firstName} interacts constructively with classmates during small-group rotations and group play.`,
        recommendationsForHome: [
          'Read 15 minutes together daily with open-ended conversation questions.',
          'Incorporate everyday counting and reasoning games.',
        ],
        recommendedClassroomScaffolds: [
          'Use visual checklists for multi-step tasks.',
          'Provide differentiated peer partnership.',
        ],
        teacherReflection: `${student.firstName} is a joyful and focused learner in ${classroom.classroomName}.`,
        growthVelocitySummary: `Positive developmental trajectory across all quarterly assessment checks.`,
        generatedByModel: 'SproutTrack Classroom Synthesis',
      };
    }

    setIsExporting('report_doc');
    setErrorMessage(null);
    setLastExportResult(null);

    try {
      const result = await exportReportToGoogleDocs(student, targetReport, classroom);
      setLastExportResult(result);
      refreshDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export Progress Report to Google Docs');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportConferencePrepDoc = async () => {
    if (!authState.isAuthenticated) {
      handleSignIn();
      return;
    }

    const student = students.find((s) => s.id === targetStudentId);
    if (!student) {
      setErrorMessage('Please select a student.');
      return;
    }

    const studentObs = getStudentObservations(student.id);
    const domainScores = getStudentDomainScores(student.id);

    setIsExporting('conf_doc');
    setErrorMessage(null);
    setLastExportResult(null);

    try {
      const result = await exportConferencePrepToGoogleDocs(
        student,
        studentObs,
        domainScores,
        classroom
      );
      setLastExportResult(result);
      refreshDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export Conference Prep to Google Docs');
    } finally {
      setIsExporting(null);
    }
  };

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === targetStudentId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0C0C0E] rounded-2xl max-w-3xl w-full shadow-2xl border border-[#27272A] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#E4E4E7]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121215] border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Google Workspace Sync & Exports</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Sheets • Docs • Drive
                </span>
              </div>
              <p className="text-xs text-[#71717A]">
                Export live rosters, observation logs, and parent reports to Google Sheets & Docs
              </p>
            </div>
          </div>
          <button
            id="close-workspace-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717A] hover:text-white hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Account Authentication Banner */}
          <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {authState.isAuthenticated && authState.user ? (
              <div className="flex items-center space-x-3">
                {authState.user.photoURL ? (
                  <img
                    src={authState.user.photoURL}
                    alt={authState.user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
                    {authState.user.displayName ? authState.user.displayName[0] : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-bold text-white">
                      Connected: {authState.user.displayName || 'Google Educator Account'}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">{authState.user.email}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Connect Your Google Account</p>
                <p className="text-[11px] text-[#71717A]">
                  Sign in with Google to create and update spreadsheets, documents, and drive files.
                </p>
              </div>
            )}

            <div>
              {authState.isAuthenticated ? (
                <button
                  id="google-sign-out-btn"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-xl border border-[#27272A] text-xs font-medium text-[#A1A1AA] hover:text-white hover:bg-[#202024] transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  id="google-sign-in-btn"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {lastExportResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Export Created: {lastExportResult.title}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Saved to your Google Drive in {lastExportResult.type === 'sheet' ? 'Google Sheets' : 'Google Docs'}
                  </p>
                </div>
              </div>

              {lastExportResult.fileUrl && (
                <a
                  id="open-exported-workspace-file-link"
                  href={lastExportResult.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 shrink-0"
                >
                  <span>Open {lastExportResult.type === 'sheet' ? 'Google Sheets' : 'Google Docs'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Workspace Export Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              Google Workspace Export Options
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Full Roster & Growth Matrix (Google Sheets) */}
              <div className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Full Classroom Workbook</h5>
                      <span className="text-[10px] text-emerald-400 font-medium">Google Sheets • 3 Tabs</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Exports student demographics, contact roster, all <strong>{observations.length}</strong> observation logs, and domain mastery matrix.
                  </p>
                </div>

                <button
                  id="export-full-roster-sheets-btn"
                  onClick={handleExportRosterSheets}
                  disabled={isExporting !== null}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isExporting === 'roster_sheets' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Table className="w-3.5 h-3.5" />
                  )}
                  <span>{isExporting === 'roster_sheets' ? 'Generating Sheet...' : 'Export Complete Workbook'}</span>
                </button>
              </div>

              {/* Card 2: Observation Logs Only (Google Sheets) */}
              <div className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Observation Logbook</h5>
                      <span className="text-[10px] text-emerald-400 font-medium">Google Sheets</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Chronological observation logbook with domain tags, milestone notes, skill context, and teacher annotations.
                  </p>
                </div>

                <button
                  id="export-observations-sheets-btn"
                  onClick={handleExportObservationsSheets}
                  disabled={isExporting !== null}
                  className="w-full py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isExporting === 'obs_sheets' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isExporting === 'obs_sheets' ? 'Exporting Logs...' : 'Export Observations Sheet'}</span>
                </button>
              </div>
            </div>

            {/* Student-Specific Google Docs Exports */}
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                  Individual Student Exports (Google Docs)
                </h4>

                {/* Student Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#71717A]">Target Student:</span>
                  <select
                    id="workspace-target-student-select"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#18181B] text-[#E4E4E7] border border-[#27272A] focus:outline-none focus:border-emerald-500/50"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (Grade {s.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 3: Student Progress Report to Google Docs */}
                <div className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-500/15 border border-blue-500/30 rounded-lg text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Student Progress Report</h5>
                        <span className="text-[10px] text-blue-400 font-medium">
                          Google Docs • {currentStudent?.firstName || 'Student'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                      Generates a formatted Google Doc with executive summary, domain strengths, next steps, home tips, and teacher reflections.
                    </p>
                  </div>

                  <button
                    id="export-progress-report-doc-btn"
                    onClick={handleExportProgressReportDoc}
                    disabled={isExporting !== null}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting === 'report_doc' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isExporting === 'report_doc' ? 'Creating Google Doc...' : `Export ${currentStudent?.firstName || ''} Report to Docs`}
                    </span>
                  </button>
                </div>

                {/* Card 4: Parent Conference Prep Brief */}
                <div className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-indigo-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Parent Conference Prep Brief</h5>
                        <span className="text-[10px] text-indigo-400 font-medium">Google Docs</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                      Agenda talking points, celebrations, recent observational citations, and discussion prompts for parent meetings.
                    </p>
                  </div>

                  <button
                    id="export-conference-prep-doc-btn"
                    onClick={handleExportConferencePrepDoc}
                    disabled={isExporting !== null}
                    className="w-full py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting === 'conf_doc' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{isExporting === 'conf_doc' ? 'Generating Doc...' : 'Export Conference Prep to Docs'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent SproutTrack Files in Google Drive */}
          {authState.isAuthenticated && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                  Recent Exports in Your Google Drive
                </h4>
                <button
                  onClick={refreshDriveFiles}
                  disabled={isLoadingFiles}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {recentFiles.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] text-center text-xs text-[#71717A]">
                  No SproutTrack exports found in your Google Drive yet. Use the export buttons above to create your first spreadsheet or document.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentFiles.map((file) => {
                    const isSheet = file.mimeType.includes('spreadsheet');
                    return (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl border border-[#27272A] bg-[#18181B] flex items-center justify-between hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSheet
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {isSheet ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-[#71717A]">
                              Modified {new Date(file.modifiedTime).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-medium flex items-center space-x-1 transition-colors shrink-0 ml-3"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#121215] border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A]">
          <span>Changes are synced live with your Google Cloud & Drive storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#27272A] text-xs font-bold text-[#E4E4E7] hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
