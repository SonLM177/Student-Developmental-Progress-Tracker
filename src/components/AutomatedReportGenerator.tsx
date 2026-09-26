import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Edit3,
  Bot,
  User,
  Heart,
  FileSpreadsheet,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { AIReport, AcademicTerm } from '../types';
import { generateAIReport } from '../services/api';
import { exportParentConferencePDF } from '../services/pdfGenerator';
import { DOMAIN_META } from '../data/domainMeta';

interface AutomatedReportGeneratorProps {
  onOpenWorkspaceModal?: (action?: string, studentId?: string) => void;
}

export const AutomatedReportGenerator: React.FC<AutomatedReportGeneratorProps> = ({
  onOpenWorkspaceModal,
}) => {
  const {
    students,
    selectedStudent,
    setSelectedStudentId,
    getStudentObservations,
    getStudentReports,
    saveReport,
    deleteReport,
    classroom,
  } = useClassroom();

  const [term, setTerm] = useState<AcademicTerm>('Winter Term (Q2)');
  const [reportType, setReportType] = useState<
    'parent_conference' | 'developmental_growth' | 'intervention_summary' | 'comprehensive_academic'
  >('parent_conference');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<AIReport | null>(null);
  const [generationNote, setGenerationNote] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  if (!selectedStudent) {
    return (
      <div className="p-8 text-center bg-[#0C0C0E] rounded-2xl border border-[#27272A]">
        <p className="text-[#71717A]">Please select a student to generate automated reports.</p>
      </div>
    );
  }

  const studentObservations = getStudentObservations(selectedStudent.id);
  const existingReports = getStudentReports(selectedStudent.id);

  const handleGenerate = async () => {
    if (studentObservations.length === 0) {
      setGenerationNote('Please record at least 1 classroom observation for this student first.');
      return;
    }

    setIsGenerating(true);
    setGenerationNote(null);
    setSaveSuccessMsg(false);

    try {
      const res = await generateAIReport({
        student: selectedStudent,
        observations: studentObservations,
        term,
        reportType,
        teacherNotes,
      });

      if (res.success && res.report) {
        setCurrentReport(res.report);
        if (res.note) setGenerationNote(res.note);
      }
    } catch (err: any) {
      setGenerationNote(`Error generating report: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentReport) return;
    await saveReport(currentReport);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleExportPDF = () => {
    if (!currentReport) return;
    exportParentConferencePDF(selectedStudent, currentReport, studentObservations, classroom);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Card */}
      <div className="bg-[#0C0C0E] text-white p-6 rounded-2xl border border-[#27272A] shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white">AI Automated Developmental Report Studio</h2>
            </div>
            <p className="text-xs text-[#71717A]">
              Transform raw observation notes into empathetic, strengths-based reports for parent conferences & IEP tracking
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#A1A1AA] font-medium">Student:</span>
            <select
              id="report-student-select"
              value={selectedStudent.id}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setCurrentReport(null);
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#18181B] text-[#E4E4E7] border border-[#27272A] focus:outline-none focus:border-emerald-500/50"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuration & Controls */}
      <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">Report Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Target Academic Term</label>
            <select
              id="report-term-select"
              value={term}
              onChange={(e) => setTerm(e.target.value as AcademicTerm)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
            >
              <option value="Fall Term (Q1)">Fall Term (Q1)</option>
              <option value="Winter Term (Q2)">Winter Term (Q2)</option>
              <option value="Spring Term (Q3)">Spring Term (Q3)</option>
              <option value="Summer Term (Q4)">Summer Term (Q4)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Report Archetype</label>
            <select
              id="report-type-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] font-medium focus:outline-none focus:border-emerald-500/50"
            >
              <option value="parent_conference">Parent-Teacher Conference Summary</option>
              <option value="developmental_growth">Comprehensive Developmental Profile</option>
              <option value="intervention_summary">Targeted Intervention & Scaffolding Plan</option>
              <option value="comprehensive_academic">Academic Milestone Celebration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">
              Teacher Context / Specific Focus (Optional)
            </label>
            <input
              id="report-notes-input"
              type="text"
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="e.g. Highlight growth in reading stamina and peer patience..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-[#71717A]">
            Synthesizing from <strong className="text-white">{studentObservations.length}</strong> classroom observations logged for {selectedStudent.firstName}.
          </div>

          <button
            id="generate-ai-report-btn"
            disabled={isGenerating || studentObservations.length === 0}
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isGenerating ? 'Synthesizing Observations...' : 'Generate Automated Report'}</span>
          </button>
        </div>

        {generationNote && (
          <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            {generationNote}
          </p>
        )}
      </div>

      {/* Generated Report Editor & Live Preview */}
      {currentReport && (
        <div className="bg-[#0C0C0E] rounded-2xl border border-[#27272A] shadow-sm p-6 space-y-6 animate-in fade-in duration-200 text-[#E4E4E7]">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
            <div>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                {currentReport.type.replace('_', ' ')}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Progress Summary for {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <p className="text-xs text-[#71717A]">
                Term: {currentReport.term} • Generated: {new Date(currentReport.generatedAt).toLocaleDateString()} via {currentReport.generatedByModel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenWorkspaceModal && (
                <button
                  id="export-report-google-docs-btn"
                  onClick={() => onOpenWorkspaceModal('report_docs', selectedStudent.id)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export to Google Docs</span>
                </button>
              )}

              <button
                id="save-report-record-btn"
                onClick={handleSave}
                className="px-3.5 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveSuccessMsg ? 'Saved to Record!' : 'Save Report'}</span>
              </button>

              <button
                id="export-pdf-summary-btn"
                onClick={handleExportPDF}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export Parent PDF</span>
              </button>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              1. Executive Developmental Summary
            </label>
            <textarea
              value={currentReport.executiveSummary}
              onChange={(e) => setCurrentReport({ ...currentReport, executiveSummary: e.target.value })}
              rows={4}
              className="w-full p-3.5 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] leading-relaxed font-normal focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Section 2: Growth Velocity */}
          {currentReport.growthVelocitySummary && (
            <div className="space-y-1.5 bg-[#18181B] p-4 rounded-xl border border-[#27272A]">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Academic Year Trajectory & Velocity
              </label>
              <textarea
                value={currentReport.growthVelocitySummary}
                onChange={(e) => setCurrentReport({ ...currentReport, growthVelocitySummary: e.target.value })}
                rows={2}
                className="w-full p-2 text-xs rounded-lg border border-[#27272A] bg-[#121215] text-[#E4E4E7] leading-relaxed font-medium focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* Section 3: Domain Highlights */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              2. Core Developmental Domain Breakdowns
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentReport.domainHighlights?.map((dh, idx) => {
                const meta = DOMAIN_META[dh.domain] || { color: '#10b981', name: dh.domainName };
                return (
                  <div key={idx} className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                      <h4 className="text-xs font-bold text-white">{dh.domainName}</h4>
                    </div>

                    <textarea
                      value={dh.summary}
                      onChange={(e) => {
                        const updated = [...currentReport.domainHighlights];
                        updated[idx].summary = e.target.value;
                        setCurrentReport({ ...currentReport, domainHighlights: updated });
                      }}
                      rows={2}
                      className="w-full p-2 text-xs rounded-lg border border-[#27272A] bg-[#121215] text-[#E4E4E7] leading-relaxed focus:outline-none focus:border-emerald-500/50"
                    />

                    {/* Strengths */}
                    {dh.strengths && dh.strengths.length > 0 && (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-400">Strengths:</span>
                        <ul className="mt-1 space-y-0.5 text-[#D4D4D8]">
                          {dh.strengths.map((str, sIdx) => (
                            <li key={sIdx} className="flex items-start space-x-1">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Steps */}
                    {dh.nextSteps && dh.nextSteps.length > 0 && (
                      <div className="text-xs pt-1">
                        <span className="font-bold text-amber-400">Focus Areas / Next Steps:</span>
                        <ul className="mt-1 space-y-0.5 text-[#D4D4D8]">
                          {dh.nextSteps.map((st, nIdx) => (
                            <li key={nIdx} className="flex items-start space-x-1">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Home Recommendations & Classroom Scaffolds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#18181B] p-4 rounded-xl border border-[#27272A] space-y-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Actionable Strategies for Home</span>
              </label>
              <ul className="space-y-1.5 text-xs text-[#D4D4D8]">
                {currentReport.recommendationsForHome?.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start space-x-1.5 bg-[#121215] p-2 rounded-xl border border-[#27272A]">
                    <span className="font-bold text-emerald-400">{rIdx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#18181B] p-4 rounded-xl border border-[#27272A] space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Classroom Scaffolds & Teacher Reflections</span>
              </label>
              <textarea
                value={currentReport.teacherReflection}
                onChange={(e) => setCurrentReport({ ...currentReport, teacherReflection: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-[#27272A] bg-[#121215] text-[#E4E4E7] leading-relaxed font-normal focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports History for this Student */}
      {existingReports.length > 0 && (
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Saved Reports & Historical Conference Records ({existingReports.length})
          </h3>

          <div className="space-y-3">
            {existingReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-[#27272A] bg-[#18181B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">
                      {rep.term}
                    </span>
                    <span className="text-xs font-bold text-white">{rep.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] line-clamp-1 italic">&ldquo;{rep.executiveSummary}&rdquo;</p>
                  <p className="text-[10px] text-[#71717A]">
                    Saved: {new Date(rep.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setCurrentReport(rep)}
                    className="px-3 py-1.5 rounded-xl border border-[#27272A] text-xs font-bold bg-[#121215] hover:bg-[#202024] text-[#E4E4E7] transition-colors cursor-pointer"
                  >
                    Load in Editor
                  </button>
                  <button
                    onClick={() => exportParentConferencePDF(selectedStudent, rep, studentObservations, classroom)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => deleteReport(rep.id)}
                    className="p-1.5 text-[#71717A] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
