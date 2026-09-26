import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { SlidersHorizontal, AlertTriangle, CheckCircle, TrendingUp, Users, Target, FileSpreadsheet } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { DOMAIN_META } from '../data/domainMeta';
import { DevelopmentalDomain } from '../types';

interface ClassAnalyticsProps {
  onOpenWorkspaceModal?: () => void;
}

export const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({ onOpenWorkspaceModal }) => {
  const { classroom, students, getStudentDomainScores, setSelectedStudentId, setActiveView } = useClassroom();

  const domains: DevelopmentalDomain[] = [
    'social_emotional',
    'language_literacy',
    'math_logic',
    'cognitive_science',
    'physical_motor',
    'creative_arts',
  ];

  // Calculate cohort averages per domain
  const domainAverages = domains.map((d) => {
    let total = 0;
    students.forEach((s) => {
      const scores = getStudentDomainScores(s.id);
      const ds = scores.find((sc) => sc.domain === d);
      if (ds) total += ds.score;
    });
    const avg = students.length > 0 ? Math.round(total / students.length) : 0;
    return {
      domainKey: d,
      domain: DOMAIN_META[d].shortName,
      fullName: DOMAIN_META[d].name,
      averageScore: avg,
      targetBenchmark: 75,
      color: DOMAIN_META[d].color,
    };
  });

  // Intervention Watchlist
  const interventionList = students
    .map((s) => {
      const scores = getStudentDomainScores(s.id);
      const emergingDomains = scores.filter((sc) => sc.level === 'emerging' || sc.trend === 'needs_support');
      const composite = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
      return {
        student: s,
        composite,
        emergingCount: emergingDomains.length,
        emergingDomains,
      };
    })
    .filter((item) => item.emergingCount > 0 || item.composite < 68)
    .sort((a, b) => a.composite - b.composite);

  // Longitudinal Class Progression Data
  const classProgression = [
    { term: 'Fall (Q1)', cohortAvg: 58, target: 75, literacy: 55, math: 57, social: 62 },
    { term: 'Winter (Q2)', cohortAvg: 73, target: 75, literacy: 72, math: 74, social: 75 },
    { term: 'Spring (Q3)', cohortAvg: 81, target: 75, literacy: 80, math: 83, social: 82 },
    { term: 'Summer (Q4 Projected)', cohortAvg: 87, target: 75, literacy: 86, math: 89, social: 88 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            <span>Classroom Cohort Developmental Analytics</span>
          </h2>
          <p className="text-xs text-[#71717A]">
            Cohort aggregate growth curves, benchmark alignment, and multi-tier support triggers for {classroom.classroomName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {onOpenWorkspaceModal && (
            <button
              id="analytics-export-sheets-btn"
              onClick={onOpenWorkspaceModal}
              className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Cohort Matrix to Sheets</span>
            </button>
          )}

          <span className="px-3 py-2 rounded-xl bg-[#18181B] text-emerald-400 border border-[#27272A]">
            Lead: {classroom.leadTeacher}
          </span>
          <span className="px-3 py-2 rounded-xl bg-[#18181B] text-[#A1A1AA] border border-[#27272A]">
            {students.length} Active Learners
          </span>
        </div>
      </div>

      {/* Grid: Domain Averages & Longitudinal Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Average Bar Chart */}
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Cohort Domain Mastery Averages</h3>
              <p className="text-xs text-[#71717A]">Compared against Grade 1 standard benchmark (75)</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainAverages} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="domain" stroke="#71717A" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} stroke="#71717A" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    color: '#E4E4E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="averageScore" name="Cohort Average Score" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="targetBenchmark" name="Target Benchmark (75)" fill="#3F3F46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Longitudinal Cohort Curve */}
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Longitudinal Academic Year Progression</h3>
            <p className="text-xs text-[#71717A]">Classwide growth trajectory across 4 terms</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={classProgression} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="term" stroke="#71717A" fontSize={11} />
                <YAxis domain={[40, 100]} stroke="#71717A" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    color: '#E4E4E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Mastery Standard"
                  stroke="#52525B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cohortAvg"
                  name="Composite Cohort Avg"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="literacy"
                  name="Literacy"
                  stroke={DOMAIN_META.language_literacy.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="math"
                  name="Math"
                  stroke={DOMAIN_META.math_logic.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scaffolding & Intervention Watchlist */}
      <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Multi-Tiered Intervention Watchlist ({interventionList.length} Students)
            </h3>
          </div>
          <span className="text-xs text-[#71717A]">Triggered by emerging scores or downward trajectory</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interventionList.map(({ student, composite, emergingDomains }) => (
            <div
              key={student.id}
              className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                      alt={student.firstName}
                      className="w-8 h-8 rounded-full object-cover border border-[#27272A]"
                    />
                    <strong className="text-xs text-white font-bold">
                      {student.firstName} {student.lastName}
                    </strong>
                  </div>
                  <span className="text-xs font-bold text-amber-400 font-mono">{composite}/100</span>
                </div>

                <div className="space-y-1 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                    Needs Attention:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {emergingDomains.map((ed) => (
                      <span
                        key={ed.domain}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      >
                        {ed.domainName} ({ed.score})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedStudentId(student.id);
                  setActiveView('student-detail');
                }}
                className="w-full mt-2 py-1.5 text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-emerald-500/40 transition-colors cursor-pointer"
              >
                Inspect Student Profile →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
