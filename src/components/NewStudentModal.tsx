import React, { useState } from 'react';
import { X, UserPlus, User, Heart, Target, Phone, Mail, Check } from 'lucide-react';
import { useClassroom } from '../context/ClassroomContext';

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
];

export const NewStudentModal: React.FC<NewStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent, classroom } = useClassroom();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(classroom.grade || 'Grade 1');
  const [dateOfBirth, setDateOfBirth] = useState('2018-05-14');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [ellStatus, setEllStatus] = useState(false);
  const [iepSupport, setIepSupport] = useState(false);
  const [goalsInput, setGoalsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentLang, setParentLang] = useState('English');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const targetGoals = goalsInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const interests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    await addStudent({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredName: preferredName.trim() || undefined,
      gradeLevel,
      dateOfBirth,
      avatarUrl,
      academicYear: classroom.academicYear,
      ellStatus,
      iepSupport,
      targetGoals: targetGoals.length > 0 ? targetGoals : ['Phonemic decoding', 'Peer collaboration'],
      interests: interests.length > 0 ? interests : ['Story building', 'Outdoor exploration'],
      notes: notes.trim() || undefined,
      parentContacts: parentName.trim()
        ? [
            {
              name: parentName.trim(),
              relationship: 'Guardian',
              email: parentEmail.trim() || 'family@example.com',
              phone: parentPhone.trim() || '555-0100',
              preferredLanguage: parentLang,
            },
          ]
        : [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0C0C0E] rounded-2xl max-w-2xl w-full shadow-2xl border border-[#27272A] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#E4E4E7]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121215] border-b border-[#27272A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Enroll New Student</h2>
              <p className="text-xs text-[#71717A]">Add learner to {classroom.classroomName} developmental roster</p>
            </div>
          </div>
          <button
            id="close-new-student-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717A] hover:text-white hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Avatar Choice */}
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">
              Select Student Avatar
            </label>
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="avatar choice"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-12 h-12 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                    avatarUrl === url
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                      : 'border-[#27272A] hover:border-[#3F3F46] opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="new-student-fname"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maya"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="new-student-lname"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Lin"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">Preferred Name</label>
              <input
                id="new-student-pref-name"
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. May"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Grade & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">Grade Level</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. Grade 1"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Support Badges / Accommodations */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
            <label className="flex items-center space-x-2 text-xs font-semibold text-[#E4E4E7] cursor-pointer">
              <input
                type="checkbox"
                checked={ellStatus}
                onChange={(e) => setEllStatus(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded bg-[#121215] border-[#27272A] focus:ring-emerald-500"
              />
              <span>Dual Language / ELL Learner</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-[#E4E4E7] cursor-pointer">
              <input
                type="checkbox"
                checked={iepSupport}
                onChange={(e) => setIepSupport(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded bg-[#121215] border-[#27272A] focus:ring-emerald-500"
              />
              <span>IEP / Special Support Services</span>
            </label>
          </div>

          {/* Target Goals & Passions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                Target Goals (comma-separated)
              </label>
              <input
                type="text"
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
                placeholder="e.g. Reading stamina, Sharing, Skip counting"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                Student Interests & Passions
              </label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. Dinosaurs, Building blocks, Drawing"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Parent Guardian info */}
          <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
            <h4 className="text-xs font-bold text-[#E4E4E7] uppercase tracking-wider">
              Parent / Guardian Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Parent Name (e.g. Sarah Lin)"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#27272A] bg-[#121215] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#27272A] bg-[#121215] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#27272A] bg-[#121215] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Preferred Language (e.g. Spanish, Mandarin, English)"
                value={parentLang}
                onChange={(e) => setParentLang(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#27272A] bg-[#121215] text-[#E4E4E7] placeholder:text-[#71717A] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#27272A] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#27272A] text-[#A1A1AA] text-xs font-bold hover:bg-[#18181B] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-new-student-btn"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
