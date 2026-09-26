import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { Student, DevelopmentalDomain } from '../types';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';

interface StudentListProps {
  onOpenObservationModal: (studentId?: string) => void;
  onOpenNewStudentModal: () => void;
  onOpenWorkspaceModal?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  onOpenObservationModal,
  onOpenNewStudentModal,
  onOpenWorkspaceModal,
}) => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    setActiveView,
    getStudentDomainScores,
    getStudentObservations,
    classroom,
  } = useClassroom();

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'ell' | 'iep' | 'interventions'>('all');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.gradeLevel.toLowerCase().includes(search.toLowerCase()) ||
      (s.interests || []).some((i) => i.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTag === 'ell') return s.ellStatus;
    if (filterTag === 'iep') return s.iepSupport;
    if (filterTag === 'interventions') {
      const scores = getStudentDomainScores(s.id);
      return scores.some((sc) => sc.level === 'emerging' || sc.trend === 'needs_support');
    }

    return true;
  });

  const handleSelectStudent = (studentId: string, targetView: 'student-detail' | 'growth-charts' | 'ai-reports' | 'parent-summary' = 'student-detail') => {
    setSelectedStudentId(studentId);
    setActiveView(targetView);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#52525B] tracking-wider mb-1">Total Enrolled</p>
            <h3 className="text-2xl font-light text-white tracking-tight">{students.length} <span className="text-xs text-[#A1A1AA] font-normal">Learners</span></h3>
          </div>
        </div>

        <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#52525B] tracking-wider mb-1">Recorded Evidence</p>
            <h3 className="text-2xl font-light text-white tracking-tight">{classroom.observations.length} <span className="text-xs text-[#A1A1AA] font-normal">Logs</span></h3>
          </div>
        </div>

        <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#52525B] tracking-wider mb-1">AI Reports</p>
            <h3 className="text-2xl font-light text-white tracking-tight">{classroom.reports.length} <span className="text-xs text-[#A1A1AA] font-normal">Generated</span></h3>
          </div>
        </div>

        <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#52525B] tracking-wider mb-1">Grade Benchmark</p>
            <h3 className="text-2xl font-light text-white tracking-tight">75% <span className="text-xs text-emerald-400 font-medium">Standard</span></h3>
          </div>
        </div>
      </div>

      {/* Roster Controls: Search, Filter Chips, Add Student */}
      <div className="bg-[#0C0C0E] p-4 sm:p-5 rounded-2xl border border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="roster-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, grade, or learning focus..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter tags & Add Student Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-[#18181B] p-1 rounded-xl border border-[#27272A] text-xs font-medium">
            <button
              onClick={() => setFilterTag('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTag === 'all'
                  ? 'bg-[#27272A] text-white font-bold'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setFilterTag('ell')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTag === 'ell'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Dual Lang / ELL
            </button>
            <button
              onClick={() => setFilterTag('iep')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTag === 'iep'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              IEP / Support
            </button>
            <button
              onClick={() => setFilterTag('interventions')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTag === 'interventions'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Intervention Focus
            </button>
          </div>

          {/* Workspace Export & Add Student Buttons */}
          <div className="flex items-center space-x-2">
            {onOpenWorkspaceModal && (
              <button
                id="roster-export-sheets-btn"
                onClick={onOpenWorkspaceModal}
                className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to Sheets</span>
              </button>
            )}

            <button
              id="add-student-btn"
              onClick={onOpenNewStudentModal}
              className="px-3.5 py-2 rounded-xl bg-[#E4E4E7] hover:bg-white text-[#09090B] text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((student) => {
          const domainScores = getStudentDomainScores(student.id);
          const studentObs = getStudentObservations(student.id);
          const isSelected = student.id === selectedStudentId;

          // Composite score average
          const avgScore = Math.round(
            domainScores.reduce((acc, curr) => acc + curr.score, 0) / domainScores.length
          );

          return (
            <div
              key={student.id}
              className={`bg-[#0C0C0E] rounded-2xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 ${
                isSelected
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 bg-[#0E0E12]'
                  : 'border-[#27272A]'
              }`}
            >
              <div>
                {/* Header: Photo, Name, Grade, Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                      alt={student.firstName}
                      className="w-12 h-12 rounded-xl object-cover border border-[#27272A]"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs text-[#71717A] font-medium">{student.gradeLevel}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">{avgScore}/100</span>
                    <span className="text-[10px] text-[#52525B] uppercase font-bold tracking-wider">Composite</span>
                  </div>
                </div>

                {/* Tags (ELL, IEP, Goals) */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {student.ellStatus && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      ELL
                    </span>
                  )}
                  {student.iepSupport && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      IEP
                    </span>
                  )}
                  {student.targetGoals?.[0] && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#18181B] text-[#A1A1AA] border border-[#27272A] truncate max-w-[200px]">
                      {student.targetGoals[0]}
                    </span>
                  )}
                </div>

                {/* 6 Domain Mastery Mini-Bars */}
                <div className="space-y-1.5 my-3 bg-[#18181B]/70 p-3 rounded-xl border border-[#27272A]">
                  <div className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Domain Balance</span>
                    <span>{studentObs.length} logs</span>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {domainScores.map((ds) => {
                      const meta = DOMAIN_META[ds.domain];
                      return (
                        <div key={ds.domain} className="space-y-1 text-center" title={`${meta.name}: ${ds.score}/100`}>
                          <div className="h-10 w-full bg-[#09090B] rounded-sm overflow-hidden flex flex-col justify-end border border-[#27272A]/50">
                            <div
                              className="w-full rounded-xs transition-all duration-300"
                              style={{ height: `${ds.score}%`, backgroundColor: meta.color }}
                            />
                          </div>
                          <span className="text-[9px] font-semibold text-[#71717A] block truncate">
                            {meta.shortName.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#27272A] flex items-center justify-between gap-2">
                <button
                  id={`btn-quick-obs-${student.id}`}
                  onClick={() => onOpenObservationModal(student.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-white hover:border-[#3F3F46] text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>Log Obs</span>
                </button>

                <button
                  id={`btn-view-profile-${student.id}`}
                  onClick={() => handleSelectStudent(student.id, 'student-detail')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-xs shadow-emerald-500/10"
                >
                  <span>360° Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
