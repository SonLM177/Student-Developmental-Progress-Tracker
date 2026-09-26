import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Award, Activity, Compass, Calendar, Layers } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG } from '../data/domainMeta';
import { DevelopmentalDomain } from '../types';

export const GrowthCharts: React.FC = () => {
  const { selectedStudent, getStudentGrowthTrajectory, getStudentDomainScores, getStudentObservations, students, setSelectedStudentId } = useClassroom();

  const [activeTab, setActiveTab] = useState<'trajectory' | 'radar' | 'term-bars' | 'distribution'>('trajectory');
  const [selectedDomainLines, setSelectedDomainLines] = useState<Record<DevelopmentalDomain, boolean>>({
    social_emotional: true,
    language_literacy: true,
    math_logic: true,
    cognitive_science: true,
    physical_motor: false,
    creative_arts: false,
  });

  if (!selectedStudent) {
    return (
      <div className="p-8 text-center bg-[#0C0C0E] rounded-xl border border-[#27272A]">
        <p className="text-[#A1A1AA]">Please select a student from the roster to view growth trajectories.</p>
      </div>
    );
  }

  const trajectoryData = getStudentGrowthTrajectory(selectedStudent.id);
  const domainScores = getStudentDomainScores(selectedStudent.id);
  const studentObservations = getStudentObservations(selectedStudent.id);

  // Transform trajectory data for Recharts
  const formattedLineData = trajectoryData.map((rec) => ({
    term: rec.term.replace(' Term', ''),
    overall: rec.overallScore,
    social_emotional: rec.domainScores.social_emotional,
    language_literacy: rec.domainScores.language_literacy,
    math_logic: rec.domainScores.math_logic,
    cognitive_science: rec.domainScores.cognitive_science,
    physical_motor: rec.domainScores.physical_motor,
    creative_arts: rec.domainScores.creative_arts,
    benchmark: 75, // Expected grade target
  }));

  // Radar Data
  const radarData = domainScores.map((ds) => ({
    subject: DOMAIN_META[ds.domain].shortName,
    currentScore: ds.score,
    previousScore: ds.previousScore,
    fullMark: 100,
  }));

  // Distribution breakdown (Emerging, Developing, Proficient, Advanced counts)
  const masteryCounts = {
    emerging: studentObservations.filter((o) => o.masteryLevel === 'emerging').length,
    developing: studentObservations.filter((o) => o.masteryLevel === 'developing').length,
    proficient: studentObservations.filter((o) => o.masteryLevel === 'proficient').length,
    advanced: studentObservations.filter((o) => o.masteryLevel === 'advanced').length,
  };

  const distributionBarData = [
    { level: 'Emerging', count: masteryCounts.emerging, fill: '#f97316' },
    { level: 'Developing', count: masteryCounts.developing, fill: '#38bdf8' },
    { level: 'Proficient', count: masteryCounts.proficient, fill: '#10b981' },
    { level: 'Advanced', count: masteryCounts.advanced, fill: '#c084fc' },
  ];

  const toggleDomainLine = (domain: DevelopmentalDomain) => {
    setSelectedDomainLines((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Student Switcher & Header */}
      <div className="bg-[#0C0C0E] p-5 rounded-2xl border border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src={selectedStudent.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
            alt={selectedStudent.firstName}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
              <span className="px-2 py-0.5 bg-[#18181B] text-emerald-400 text-xs font-semibold rounded-md border border-[#27272A]">
                {selectedStudent.gradeLevel}
              </span>
            </div>
            <p className="text-xs text-[#71717A] font-medium">
              Growth Trajectory & Longitudinal Developmental Analytics ({selectedStudent.academicYear})
            </p>
          </div>
        </div>

        {/* Quick Student Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-[#71717A] uppercase">Viewing Student:</label>
          <select
            id="growth-student-selector"
            value={selectedStudent.id}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Mode Controls */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
        <div className="flex space-x-2">
          <button
            id="chart-tab-trajectory"
            onClick={() => setActiveTab('trajectory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'trajectory'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Academic Year Trajectory</span>
          </button>

          <button
            id="chart-tab-radar"
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Domain Radar Balance</span>
          </button>

          <button
            id="chart-tab-distribution"
            onClick={() => setActiveTab('distribution')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mastery Distribution</span>
          </button>
        </div>

        <span className="text-xs text-[#71717A] hidden sm:inline">
          Total Evidence: <strong className="text-white">{studentObservations.length}</strong> logs
        </span>
      </div>

      {/* Chart Body */}
      {activeTab === 'trajectory' && (
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Longitudinal Developmental Growth Trajectory</h3>
              <p className="text-xs text-[#71717A]">
                Track progression across terms against the Grade Standard Benchmark (75 pts).
              </p>
            </div>

            {/* Toggleable domain pills */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'social_emotional',
                  'language_literacy',
                  'math_logic',
                  'cognitive_science',
                  'physical_motor',
                  'creative_arts',
                ] as DevelopmentalDomain[]
              ).map((dom) => {
                const meta = DOMAIN_META[dom];
                const active = selectedDomainLines[dom];
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => toggleDomainLine(dom)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-colors flex items-center space-x-1 cursor-pointer ${
                      active
                        ? 'border-[#3F3F46] text-white bg-[#18181B]'
                        : 'border-[#27272A] text-[#52525B] bg-[#09090B] opacity-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span>{meta.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedLineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="term" stroke="#71717A" fontSize={12} tickLine={false} />
                <YAxis domain={[30, 100]} stroke="#71717A" fontSize={12} tickLine={false} />
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
                
                {/* Benchmark standard */}
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Grade Level Target (75)"
                  stroke="#52525B"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                />

                {/* Overall growth trajectory */}
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Composite Growth Score"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#10b981' }}
                />

                {selectedDomainLines.social_emotional && (
                  <Line
                    type="monotone"
                    dataKey="social_emotional"
                    name={DOMAIN_META.social_emotional.shortName}
                    stroke={DOMAIN_META.social_emotional.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}

                {selectedDomainLines.language_literacy && (
                  <Line
                    type="monotone"
                    dataKey="language_literacy"
                    name={DOMAIN_META.language_literacy.shortName}
                    stroke={DOMAIN_META.language_literacy.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}

                {selectedDomainLines.math_logic && (
                  <Line
                    type="monotone"
                    dataKey="math_logic"
                    name={DOMAIN_META.math_logic.shortName}
                    stroke={DOMAIN_META.math_logic.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}

                {selectedDomainLines.cognitive_science && (
                  <Line
                    type="monotone"
                    dataKey="cognitive_science"
                    name={DOMAIN_META.cognitive_science.shortName}
                    stroke={DOMAIN_META.cognitive_science.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}

                {selectedDomainLines.physical_motor && (
                  <Line
                    type="monotone"
                    dataKey="physical_motor"
                    name={DOMAIN_META.physical_motor.shortName}
                    stroke={DOMAIN_META.physical_motor.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}

                {selectedDomainLines.creative_arts && (
                  <Line
                    type="monotone"
                    dataKey="creative_arts"
                    name={DOMAIN_META.creative_arts.shortName}
                    stroke={DOMAIN_META.creative_arts.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'radar' && (
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272A" />
                <PolarAngleAxis dataKey="subject" stroke="#A1A1AA" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525B" />
                <Radar
                  name="Current Mastery"
                  dataKey="currentScore"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Fall Baseline"
                  dataKey="previousScore"
                  stroke="#52525B"
                  fill="#52525B"
                  fillOpacity={0.2}
                />
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    color: '#E4E4E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Holistic Developmental Balance Analysis</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              The radar chart visualizes the student&apos;s current developmental equilibrium compared against their baseline. 
              Balanced polygonal expansion indicates solid progression across emotional, cognitive, linguistic, and motor spheres.
            </p>

            <div className="space-y-2 pt-2">
              {domainScores.map((ds) => {
                const meta = DOMAIN_META[ds.domain];
                return (
                  <div key={ds.domain} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#18181B] border border-[#27272A]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="font-bold text-white">{meta.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#71717A] font-mono">{ds.score}/100</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ds.trend === 'improving'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : ds.trend === 'needs_support'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-[#27272A] text-[#A1A1AA]'
                        }`}
                      >
                        {ds.trend === 'improving' ? '▲ Advancing' : '● Steady'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="bg-[#0C0C0E] p-6 rounded-2xl border border-[#27272A] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Classroom Observation Mastery Distribution</h3>
            <p className="text-xs text-[#71717A]">
              Breakdown of {studentObservations.length} raw classroom observations recorded for {selectedStudent.firstName}.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="level" stroke="#71717A" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#71717A" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    color: '#E4E4E7',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Observation Evidence Records" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
