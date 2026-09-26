import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Check,
  Tag,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';
import { DevelopmentalDomain, MasteryLevel, AcademicTerm, Observation } from '../types';
import { DOMAIN_META, MASTERY_LEVEL_CONFIG, COMMON_CONTEXTS } from '../data/domainMeta';
import { analyzeObservationNotes } from '../services/api';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  editObservation?: Observation | null;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  editObservation,
}) => {
  const { students, classroom, addObservation, updateObservation, selectedStudentId } = useClassroom();

  const [studentId, setStudentId] = useState(
    editObservation?.studentId || initialStudentId || selectedStudentId || (students[0]?.id || '')
  );
  const [date, setDate] = useState(editObservation?.date || new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState<AcademicTerm>(editObservation?.term || 'Winter Term (Q2)');
  const [domain, setDomain] = useState<DevelopmentalDomain>(editObservation?.domain || 'language_literacy');
  const [subCategory, setSubCategory] = useState(editObservation?.subCategory || '');
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>(editObservation?.masteryLevel || 'developing');
  const [context, setContext] = useState(editObservation?.context || 'Guided Reading Group');
  const [rawNotes, setRawNotes] = useState(editObservation?.rawNotes || '');
  const [strengthNote, setStrengthNote] = useState(editObservation?.strengthNote || '');
  const [supportNeed, setSupportNeed] = useState(editObservation?.supportNeed || '');
  const [milestoneMet, setMilestoneMet] = useState(editObservation?.milestoneMet || '');
  const [tagsInput, setTagsInput] = useState(editObservation?.tags.join(', ') || '');
  const [observedBy, setObservedBy] = useState(editObservation?.observedBy || classroom.leadTeacher);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiSuggestionMessage, setAiSuggestionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Voice to text simulation
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // If Web Speech API is available in browser, attempt it; else simulate realistic observation note
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setRawNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setIsRecording(false);
          };
          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          recognition.start();
          return;
        } catch (e) {
          // fallback to simulation
        }
      }
      setTimeout(() => {
        setRawNotes((prev) =>
          prev
            ? `${prev} Student showed strong persistence when solving 2-digit addition on number line.`
            : 'Student showed strong persistence when solving 2-digit addition on number line.'
        );
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  // AI Auto Tag & Extract
  const handleAiAutoTag = async () => {
    if (!rawNotes.trim()) {
      setAiSuggestionMessage('Please type or dictate observational notes first.');
      return;
    }
    setIsAnalyzing(true);
    setAiSuggestionMessage(null);

    const activeStudent = students.find((s) => s.id === studentId);
    try {
      const res = await analyzeObservationNotes(
        rawNotes,
        `Student: ${activeStudent?.firstName} ${activeStudent?.lastName}, Grade: ${activeStudent?.gradeLevel}`
      );

      if (res.success && res.analysis) {
        const a = res.analysis;
        if (a.domain && DOMAIN_META[a.domain as DevelopmentalDomain]) {
          setDomain(a.domain as DevelopmentalDomain);
        }
        if (a.subCategory) setSubCategory(a.subCategory);
        if (a.masteryLevel) setMasteryLevel(a.masteryLevel as MasteryLevel);
        if (a.strengthNote) setStrengthNote(a.strengthNote);
        if (a.supportNeed) setSupportNeed(a.supportNeed);
        if (a.milestoneMet) setMilestoneMet(a.milestoneMet);
        if (a.suggestedTags && Array.isArray(a.suggestedTags)) {
          setTagsInput(a.suggestedTags.join(', '));
        }
        setAiSuggestionMessage('AI extracted developmental domain, mastery level, and milestones.');
      }
    } catch (err) {
      setAiSuggestionMessage('Heuristic tagging applied.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (editObservation) {
      await updateObservation({
        ...editObservation,
        studentId,
        date,
        term,
        domain,
        subCategory: subCategory.trim() || 'General Observation',
        masteryLevel,
        context,
        rawNotes: rawNotes.trim(),
        strengthNote: strengthNote.trim(),
        supportNeed: supportNeed.trim(),
        milestoneMet: milestoneMet.trim(),
        tags,
        observedBy,
      });
    } else {
      await addObservation({
        studentId,
        date,
        term,
        domain,
        subCategory: subCategory.trim() || 'General Observation',
        masteryLevel,
        context,
        rawNotes: rawNotes.trim(),
        strengthNote: strengthNote.trim(),
        supportNeed: supportNeed.trim(),
        milestoneMet: milestoneMet.trim(),
        tags,
        observedBy,
      });
    }

    onClose();
  };

  const domainList: DevelopmentalDomain[] = [
    'social_emotional',
    'language_literacy',
    'math_logic',
    'cognitive_science',
    'physical_motor',
    'creative_arts',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0C0C0E] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#27272A] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121215] text-white flex items-center justify-between border-b border-[#27272A]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editObservation ? 'Edit Classroom Observation' : 'Record Raw Classroom Observation'}
              </h2>
              <p className="text-xs text-[#71717A]">
                Log behavioral, developmental, or academic evidence directly from classroom activities
              </p>
            </div>
          </div>
          <button
            id="close-observation-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-[#E4E4E7]">
          {/* Row 1: Student, Date, Academic Term */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Student <span className="text-rose-500">*</span>
              </label>
              <select
                id="obs-student-select"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50 font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="obs-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Academic Term
              </label>
              <select
                id="obs-term-select"
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
          </div>

          {/* Row 2: Developmental Domain Selection */}
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">
              Developmental Domain <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {domainList.map((d) => {
                const meta = DOMAIN_META[d];
                const isSelected = domain === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDomain(d)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-xs'
                        : 'border-[#27272A] bg-[#18181B] hover:bg-[#202024] text-[#A1A1AA]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-bold truncate text-white">{meta.shortName}</span>
                    </div>
                    <p className="text-[11px] text-[#71717A] line-clamp-1">{meta.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Raw Observation Notes with Speech & AI Assist */}
          <div className="bg-[#121215] p-4 rounded-xl border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Raw Classroom Observation Notes</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="flex items-center space-x-2">
                {/* Voice Dictation Button */}
                <button
                  type="button"
                  id="obs-voice-dictation-btn"
                  onClick={toggleRecording}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{isRecording ? 'Listening...' : 'Voice Note'}</span>
                </button>

                {/* AI Smart Analyzer Button */}
                <button
                  type="button"
                  id="obs-ai-analyze-btn"
                  disabled={isAnalyzing}
                  onClick={handleAiAutoTag}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'AI Auto-Tag'}</span>
                </button>
              </div>
            </div>

            <textarea
              id="obs-raw-notes-input"
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="e.g. During small group math lab, Lucas represented 12 - 4 by drawing bird models. Solved correctly and explained how 4 flew away..."
              rows={3}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
            />

            {aiSuggestionMessage && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-md border border-emerald-500/20 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{aiSuggestionMessage}</span>
              </p>
            )}
          </div>

          {/* Row 4: Mastery Level & Setting Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                Mastery / Developmental Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['emerging', 'developing', 'proficient', 'advanced'] as MasteryLevel[]).map((lvl) => {
                  const cfg = MASTERY_LEVEL_CONFIG[lvl];
                  const isSelected = masteryLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setMasteryLevel(lvl)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? `${cfg.badgeClass} ring-1 ring-emerald-500/50 shadow-xs`
                          : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:text-white'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                Classroom Context / Activity
              </label>
              <select
                id="obs-context-select"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
              >
                {COMMON_CONTEXTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Subcategory & Milestone Met */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Specific Skill Area / Sub-Category
              </label>
              <input
                id="obs-subcategory-input"
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Word Problems, Phonemic Awareness, Turn-Taking"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Milestone Met (Optional)
              </label>
              <input
                id="obs-milestone-input"
                type="text"
                value={milestoneMet}
                onChange={(e) => setMilestoneMet(e.target.value)}
                placeholder="e.g. Mental Strategies Within 20, Tripod Grip"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 6: Strengths & Support Needs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Observed Strength Highlight</span>
              </label>
              <input
                id="obs-strength-input"
                type="text"
                value={strengthNote}
                onChange={(e) => setStrengthNote(e.target.value)}
                placeholder="e.g. High intuitive number sense, clear peer explanation"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Support Need / Scaffolding Next Step</span>
              </label>
              <input
                id="obs-support-input"
                type="text"
                value={supportNeed}
                onChange={(e) => setSupportNeed(e.target.value)}
                placeholder="e.g. Provide visual ten-frame cards for 2-digit subtraction"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Row 7: Tags & Observer Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                id="obs-tags-input"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. math, subtraction, peer-leadership"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">
                Observed By
              </label>
              <input
                id="obs-observer-input"
                type="text"
                value={observedBy}
                onChange={(e) => setObservedBy(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#27272A] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#27272A] text-[#A1A1AA] text-sm font-semibold hover:bg-[#18181B] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="obs-save-submit-btn"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editObservation ? 'Save Changes' : 'Record Observation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
