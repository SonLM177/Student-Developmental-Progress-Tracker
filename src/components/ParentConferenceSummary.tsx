import React, { useState } from 'react';
import {
  Printer,
  Download,
  Calendar,
  User,
  Heart,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Award,
  BookOpen,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { exportParentConferencePDF } from '../services/pdfGenerator';
import { DOMAIN_META } from '../data/domainMeta';
import { AIReport } from '../types';

interface ParentConferenceSummaryProps {
  onOpenWorkspaceModal?: (action?: string, studentId?: string) => void;
}

export const ParentConferenceSummary: React.FC<ParentConferenceSummaryProps> = ({
  onOpenWorkspaceModal,
}) => {
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
    getStudentReports,
    getStudentObservations,
    classroom,
    setActiveView,
  } = useClassroom();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  if (!selectedStudent) {
    return (
      <div className="p-12 text-center bg-[#0C0C0E] rounded-2xl border border-[#27272A]">
        <p className="text-[#71717A]">Please choose a student to view the parent conference summary.</p>
      </div>
    );
  }

  const reports = getStudentReports(selectedStudent.id);
  const observations = getStudentObservations(selectedStudent.id);

  // Active report (either user selected or latest)
  const activeReport: AIReport | null =
    reports.find((r) => r.id === selectedReportId) || (reports.length > 0 ? reports[0] : null);

  const handleDownloadPDF = () => {
    if (!activeReport) return;
    exportParentConferencePDF(selectedStudent, activeReport, observations, classroom);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span>Parent-Teacher Meeting & PDF Summary Hub</span>
          </h2>
          <p className="text-xs text-[#71717A]">
            Exportable official developmental summaries tailored for parent conferences and family collaboration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="parent-student-picker"
            value={selectedStudent.id}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>

          {onOpenWorkspaceModal && (
            <button
              id="export-conference-docs-btn"
              onClick={() => onOpenWorkspaceModal('conference_docs', selectedStudent.id)}
              className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export to Google Docs</span>
            </button>
          )}

          {activeReport && (
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Summary</span>
            </button>
          )}
        </div>
      </div>

      {!activeReport ? (
        <div className="bg-[#0C0C0E] p-12 text-center rounded-2xl border border-[#27272A] space-y-3">
          <FileText className="w-12 h-12 text-[#71717A] mx-auto" />
          <h3 className="text-sm font-bold text-white">No Generated Progress Report Found</h3>
          <p className="text-xs text-[#71717A] max-w-md mx-auto">
            Before generating the exportable PDF summary for parent meetings, please run the AI automated report generator.
          </p>
          <button
            onClick={() => setActiveView('ai-reports')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Generate Report in AI Studio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Conference Talking Points Checklist */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-[#0C0C0E] p-4 rounded-2xl border border-[#27272A] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Teacher Talking Points</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-white font-medium">
                  <strong className="text-emerald-400">1. Open with Strengths:</strong>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Highlight {selectedStudent.firstName}&apos;s engagement in{' '}
                    {selectedStudent.interests?.[0] || 'classroom discovery'}.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-white font-medium">
                  <strong className="text-emerald-400">2. Growth Milestones:</strong>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Show trajectory acceleration across {observations.length} observation checkpoints.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-white font-medium">
                  <strong className="text-amber-400">3. Collaborative Goal:</strong>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Review home reading routines and sensory support scaffolding.
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Contact Card */}
            {selectedStudent.parentContacts?.[0] && (
              <div className="bg-[#0C0C0E] p-4 rounded-2xl border border-[#27272A] shadow-xs text-xs space-y-1.5">
                <h4 className="font-bold text-[#A1A1AA]">Parent / Guardian Contact</h4>
                <p className="font-semibold text-white">{selectedStudent.parentContacts[0].name}</p>
                <p className="text-[#71717A]">{selectedStudent.parentContacts[0].relationship}</p>
                <p className="text-[#A1A1AA]">{selectedStudent.parentContacts[0].email}</p>
                <p className="text-[#A1A1AA]">{selectedStudent.parentContacts[0].phone}</p>
                <p className="text-[11px] text-emerald-400 font-medium pt-1">
                  Language: {selectedStudent.parentContacts[0].preferredLanguage}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: High-Fidelity Paper PDF Preview */}
          <div className="lg:col-span-3">
            <div className="bg-[#060608] p-4 sm:p-8 rounded-2xl border border-[#27272A] shadow-inner flex justify-center">
              {/* Paper Sheet Simulation */}
              <div className="bg-[#121215] max-w-2xl w-full p-8 sm:p-10 rounded-xl shadow-2xl border border-[#27272A] space-y-6 text-[#E4E4E7]">
                {/* Header Banner */}
                <div className="bg-[#18181B] text-white p-4 rounded-xl border border-[#27272A]">
                  <h1 className="text-sm sm:text-base font-bold tracking-wide text-white">
                    STUDENT DEVELOPMENTAL PROGRESS SUMMARY
                  </h1>
                  <p className="text-[11px] text-[#A1A1AA] mt-1 font-medium">
                    {classroom.classroomName} • Academic Year: {classroom.academicYear} • Term: {activeReport.term}
                  </p>
                </div>

                {/* Student Info Card */}
                <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[#71717A] block text-[10px]">Student Name</span>
                    <strong className="text-white">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[10px]">Grade Level</span>
                    <strong className="text-white">{selectedStudent.gradeLevel}</strong>
                  </div>
                  <div>
                    <span className="text-[#71717A] block text-[10px]">Lead Teacher</span>
                    <strong className="text-white">{classroom.leadTeacher}</strong>
                  </div>
                </div>

                {/* Section 1: Executive Summary */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#27272A] pb-1">
                    1. Executive Developmental Summary
                  </h3>
                  <p className="text-xs text-[#D4D4D8] leading-relaxed font-normal">
                    {activeReport.executiveSummary}
                  </p>
                </div>

                {/* Section 2: Growth Velocity */}
                {activeReport.growthVelocitySummary && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs">
                    <span className="font-bold text-emerald-400 block mb-0.5">Year Trajectory Highlight:</span>
                    <p className="text-[#D4D4D8] leading-relaxed">{activeReport.growthVelocitySummary}</p>
                  </div>
                )}

                {/* Section 3: Domain Highlights */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#27272A] pb-1">
                    2. Domain Progress & Classroom Evidence
                  </h3>

                  <div className="space-y-2.5">
                    {activeReport.domainHighlights?.map((dh, idx) => {
                      const meta = DOMAIN_META[dh.domain] || { color: '#10b981', name: dh.domainName };
                      return (
                        <div key={idx} className="p-3 bg-[#18181B] rounded-xl border border-[#27272A] text-xs space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span className="font-bold text-white">{dh.domainName}</span>
                          </div>
                          <p className="text-[#A1A1AA] text-[11px] leading-relaxed">{dh.summary}</p>
                          {dh.strengths && dh.strengths.length > 0 && (
                            <p className="text-[11px] text-emerald-400">
                              <strong>Key Strengths:</strong> {dh.strengths.join(' • ')}
                            </p>
                          )}
                          {dh.nextSteps && dh.nextSteps.length > 0 && (
                            <p className="text-[11px] text-amber-400">
                              <strong>Next Steps:</strong> {dh.nextSteps.join(' • ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Home Recommendations */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#27272A] pb-1">
                    3. Actionable Strategies for Home & Family Support
                  </h3>
                  <ul className="space-y-1 text-xs text-[#D4D4D8]">
                    {activeReport.recommendationsForHome?.map((rec, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-1.5">
                        <span className="font-bold text-emerald-400">{rIdx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t border-[#27272A] grid grid-cols-2 gap-8 text-xs text-[#71717A]">
                  <div className="border-t border-[#3F3F46] pt-2 text-center">
                    Teacher Signature & Date
                  </div>
                  <div className="border-t border-[#3F3F46] pt-2 text-center">
                    Parent / Guardian Signature & Date
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
