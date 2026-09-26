import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Plus,
  TrendingUp,
  Calendar,
  Tag,
  User,
  Heart,
  BookOpen,
  Calculator,
  Compass,
  Activity,
  Palette,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Target,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { DevelopmentalDomain, Observation, AcademicTerm } from '../types';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';
import { GrowthCharts } from './GrowthCharts';

interface StudentProfileProps {
  onOpenObservationModal: (studentId?: string, editObs?: Observation) => void;
  onNavigateToAIReports: () => void;
  onNavigateToParentPDF: () => void;
  onOpenWorkspaceModal?: (action?: string, studentId?: string) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  onOpenObservationModal,
  onNavigateToAIReports,
  onNavigateToParentPDF,
  onOpenWorkspaceModal,
}) => {
  const {
    selectedStudent,
    students,
    setSelectedStudentId,
    getStudentDomainScores,
    getStudentObservations,
    deleteObservation,
  } = useClassroom();

  const [domainFilter, setDomainFilter] = useState<DevelopmentalDomain | 'all'>('all');
  const [termFilter, setTermFilter] = useState<AcademicTerm | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!selectedStudent) {
    return (
      <div className="p-12 text-center bg-[#0C0C0E] rounded-2xl border border-[#27272A]">
        <User className="w-12 h-12 text-[#52525B] mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Student Selected</h3>
        <p className="text-sm text-[#A1A1AA] mt-1">Please choose a student from the active roster to inspect their profile.</p>
      </div>
    );
  }

  const domainScores = getStudentDomainScores(selectedStudent.id);
  const rawObservations = getStudentObservations(selectedStudent.id);

  const filteredObservations = rawObservations.filter((obs) => {
    if (domainFilter !== 'all' && obs.domain !== domainFilter) return false;
    if (termFilter !== 'all' && obs.term !== termFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        obs.rawNotes.toLowerCase().includes(q) ||
        obs.subCategory.toLowerCase().includes(q) ||
        obs.context.toLowerCase().includes(q) ||
        obs.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Student Master Profile Header */}
      <div className="bg-[#0C0C0E] rounded-2xl border border-[#27272A] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Bio */}
          <div className="flex items-start sm:items-center space-x-4">
            <img
              src={selectedStudent.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
              alt={selectedStudent.firstName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md shadow-emerald-500/10"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h1>
                {selectedStudent.preferredName && (
                  <span className="text-sm text-[#A1A1AA] font-medium">(&ldquo;{selectedStudent.preferredName}&rdquo;)</span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18181B] text-emerald-400 border border-[#27272A]">
                  {selectedStudent.gradeLevel}
                </span>
                {selectedStudent.ellStatus && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Dual Language / ELL
                  </span>
                )}
                {selectedStudent.iepSupport && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    IEP / OT Support
                  </span>
                )}
              </div>

              <p className="text-xs text-[#71717A]">
                DOB: {selectedStudent.dateOfBirth} • Academic Cohort: {selectedStudent.academicYear} • Total Observations: <strong className="text-white">{rawObservations.length}</strong>
              </p>

              {/* Parent Contact preview */}
              {selectedStudent.parentContacts && selectedStudent.parentContacts.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#A1A1AA]">
                  <span className="font-medium flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>Parent: {selectedStudent.parentContacts[0].name}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-[#71717A]">
                    <Mail className="w-3.5 h-3.5 text-[#52525B]" />
                    <span>{selectedStudent.parentContacts[0].email}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-[#71717A]">
                    <Phone className="w-3.5 h-3.5 text-[#52525B]" />
                    <span>{selectedStudent.parentContacts[0].phone}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="profile-log-obs-btn"
              onClick={() => onOpenObservationModal(selectedStudent.id)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Observation</span>
            </button>

            {onOpenWorkspaceModal && (
              <button
                id="profile-workspace-docs-btn"
                onClick={() => onOpenWorkspaceModal('report_docs', selectedStudent.id)}
                className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Google Docs Report</span>
              </button>
            )}

            <button
              id="profile-generate-ai-report-btn"
              onClick={onNavigateToAIReports}
              className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Automated Report</span>
            </button>

            <button
              id="profile-parent-pdf-btn"
              onClick={onNavigateToParentPDF}
              className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#A1A1AA]" />
              <span>Parent Meeting PDF</span>
            </button>
          </div>
        </div>

        {/* Goals & Interests banner */}
        {(selectedStudent.targetGoals?.length > 0 || selectedStudent.interests?.length > 0) && (
          <div className="mt-5 pt-4 border-t border-[#27272A] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#18181B] p-3 rounded-xl border border-[#27272A]">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-400 mb-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Academic & Growth Goals</span>
              </div>
              <ul className="space-y-1 text-[#E4E4E7]">
                {selectedStudent.targetGoals?.map((g, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#18181B] p-3 rounded-xl border border-[#27272A]">
              <div className="flex items-center space-x-1.5 font-bold text-amber-400 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-amber-400" />
                <span>Student Passions & Preferred Contexts</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.interests?.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#27272A] text-amber-300 text-[11px] font-semibold rounded-md border border-amber-500/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
              {selectedStudent.notes && (
                <p className="mt-2 text-[#A1A1AA] italic text-[11px]">{selectedStudent.notes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6 Developmental Domains Score Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
            Developmental Domain Competency Matrix
          </h2>
          <span className="text-xs text-[#71717A] font-medium">Weighted assessment from observational evidence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainScores.map((ds) => {
            const meta = DOMAIN_META[ds.domain];
            const cfg = MASTERY_LEVEL_CONFIG[ds.level];
            return (
              <div
                key={ds.domain}
                className="bg-[#0C0C0E] p-4 rounded-2xl border border-[#27272A] shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <h3 className="text-xs font-bold text-white">{meta.shortName}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Score & Progress Bar */}
                  <div className="space-y-1.5 my-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717A] font-medium">Mastery Index</span>
                      <span className="font-bold text-white font-mono">{ds.score}/100</span>
                    </div>
                    <div className="w-full bg-[#18181B] h-2 rounded-full overflow-hidden border border-[#27272A]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${ds.score}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>

                  {/* Highlights */}
                  {ds.keyHighlights && ds.keyHighlights.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {ds.keyHighlights.map((h, i) => (
                        <p key={i} className="text-[11px] text-[#A1A1AA] line-clamp-2 flex items-start space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>{ds.totalObservations} observations</span>
                  <span
                    className={`font-semibold ${
                      ds.trend === 'improving'
                        ? 'text-emerald-400'
                        : ds.trend === 'needs_support'
                        ? 'text-amber-400'
                        : 'text-[#71717A]'
                    }`}
                  >
                    {ds.trend === 'improving' ? '▲ Upward Growth' : '● Consistent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded Longitudinal Growth Charts */}
      <GrowthCharts />

      {/* Raw Classroom Observations Feed */}
      <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Classroom Observation Evidence Stream
            </h2>
            <p className="text-xs text-[#71717A]">
              Raw notes, situational contexts, and milestone evidence recorded during daily activities
            </p>
          </div>

          <button
            id="stream-log-obs-btn"
            onClick={() => onOpenObservationModal(selectedStudent.id)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Observation</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#27272A] text-xs">
          {/* Domain Filter */}
          <select
            id="obs-filter-domain"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#18181B] font-medium text-[#E4E4E7]"
          >
            <option value="all">All Domains</option>
            <option value="social_emotional">Social-Emotional</option>
            <option value="language_literacy">Language & Literacy</option>
            <option value="math_logic">Math & Logic</option>
            <option value="cognitive_science">Cognitive & Science</option>
            <option value="physical_motor">Physical & Motor</option>
            <option value="creative_arts">Creative Arts</option>
          </select>

          {/* Term Filter */}
          <select
            id="obs-filter-term"
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#18181B] font-medium text-[#E4E4E7]"
          >
            <option value="all">All Terms</option>
            <option value="Fall Term (Q1)">Fall Term (Q1)</option>
            <option value="Winter Term (Q2)">Winter Term (Q2)</option>
            <option value="Spring Term (Q3)">Spring Term (Q3)</option>
            <option value="Summer Term (Q4)">Summer Term (Q4)</option>
          </select>

          {/* Search Query */}
          <input
            id="obs-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, tags, or skills..."
            className="px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] flex-1 min-w-[160px] focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Observation Cards Stream */}
        {filteredObservations.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#27272A] rounded-xl">
            <Clock className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
            <p className="text-xs text-[#71717A] font-medium">No classroom observations match the selected criteria.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredObservations.map((obs) => {
              const meta = DOMAIN_META[obs.domain];
              const cfg = MASTERY_LEVEL_CONFIG[obs.masteryLevel];
              return (
                <div
                  key={obs.id}
                  className="p-4 rounded-xl border border-[#27272A] bg-[#121215] hover:border-emerald-500/30 transition-colors space-y-2.5"
                >
                  {/* Top line: Domain, Date, Context, Mastery Level, Edit/Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-black"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.shortName}
                      </span>
                      <span className="text-xs font-bold text-white">{obs.subCategory}</span>
                      <span className="text-[11px] text-[#71717A] font-medium">• {obs.date} ({obs.term})</span>
                      <span className="px-2 py-0.5 bg-[#18181B] text-[#A1A1AA] rounded text-[10px] font-medium border border-[#27272A]">
                        {obs.context}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>

                      <button
                        onClick={() => onOpenObservationModal(selectedStudent.id, obs)}
                        className="p-1 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                        title="Edit Observation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteObservation(obs.id)}
                        className="p-1 text-[#71717A] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Observation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Raw Notes */}
                  <p className="text-xs sm:text-sm text-[#E4E4E7] font-normal leading-relaxed bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                    &ldquo;{obs.rawNotes}&rdquo;
                  </p>

                  {/* Strengths & Support details if present */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {obs.strengthNote && (
                      <div className="flex items-start space-x-1.5 text-emerald-400 bg-emerald-500/10 p-2 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Strength:</strong> {obs.strengthNote}</span>
                      </div>
                    )}
                    {obs.supportNeed && (
                      <div className="flex items-start space-x-1.5 text-amber-400 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Support:</strong> {obs.supportNeed}</span>
                      </div>
                    )}
                  </div>

                  {/* Milestone tag & Observer name */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#71717A]">
                    {obs.milestoneMet ? (
                      <span className="inline-flex items-center space-x-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Target className="w-3 h-3 text-emerald-400" />
                        <span>Milestone: {obs.milestoneMet}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>Observed by <strong className="text-[#A1A1AA]">{obs.observedBy}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
