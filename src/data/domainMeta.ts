import { DevelopmentalDomain, DomainMeta, MasteryLevel } from '../types';

export const DOMAIN_META: Record<DevelopmentalDomain, DomainMeta> = {
  social_emotional: {
    id: 'social_emotional',
    name: 'Social-Emotional & Self-Regulation',
    shortName: 'Social & Emotional',
    color: '#10b981', // Emerald-500
    bgColor: '#064e3b',
    borderColor: '#047857',
    iconName: 'HeartHandshake',
    description: 'Peer collaboration, emotional regulation, empathy, resilience, conflict resolution, and classroom routines.',
  },
  language_literacy: {
    id: 'language_literacy',
    name: 'Language & Literacy',
    shortName: 'Literacy & Comm.',
    color: '#a855f7', // Purple-500
    bgColor: '#581c87',
    borderColor: '#7e22ce',
    iconName: 'BookOpen',
    description: 'Phonemic awareness, expressive vocabulary, storytelling, comprehension, decoding, and written communication.',
  },
  math_logic: {
    id: 'math_logic',
    name: 'Mathematical & Logical Reasoning',
    shortName: 'Math & Logic',
    color: '#06b6d4', // Cyan-500
    bgColor: '#164e63',
    borderColor: '#0e7490',
    iconName: 'Calculator',
    description: 'Number sense, spatial reasoning, patterns, problem-solving strategies, measurement, and early geometry.',
  },
  cognitive_science: {
    id: 'cognitive_science',
    name: 'Cognitive & Scientific Inquiry',
    shortName: 'Inquiry & Science',
    color: '#f59e0b', // Amber-500
    bgColor: '#78350f',
    borderColor: '#b45309',
    iconName: 'Sparkles',
    description: 'Curiosity, hypothesis formation, observation of natural phenomena, persistence, and logical cause-and-effect.',
  },
  physical_motor: {
    id: 'physical_motor',
    name: 'Physical & Fine/Gross Motor',
    shortName: 'Motor Skills',
    color: '#f43f5e', // Rose-500
    bgColor: '#881337',
    borderColor: '#be123c',
    iconName: 'Activity',
    description: 'Pencil grip, scissors control, spatial balance, hand-eye coordination, stamina, and body awareness.',
  },
  creative_arts: {
    id: 'creative_arts',
    name: 'Creative Expression & Approaches',
    shortName: 'Creative Arts',
    color: '#6366f1', // Indigo-500
    bgColor: '#312e81',
    borderColor: '#4338ca',
    iconName: 'Palette',
    description: 'Artistic representation, musical rhythm, dramatic play, innovative thinking, and self-directed task initiative.',
  },
};

export const MASTERY_LEVEL_CONFIG: Record<MasteryLevel, { label: string; score: number; color: string; badgeClass: string }> = {
  emerging: {
    label: 'Emerging',
    score: 40,
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  developing: {
    label: 'Developing',
    score: 65,
    color: '#38bdf8',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  proficient: {
    label: 'Proficient',
    score: 85,
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  advanced: {
    label: 'Advanced',
    score: 98,
    color: '#c084fc',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

export const COMMON_CONTEXTS = [
  'Guided Reading Group',
  'Independent Work Time',
  'Small Group Math Lab',
  'Science Investigation',
  'Free Play / Centers',
  'Recess & Playground',
  'Morning Circle / Discussion',
  'Writing Workshop',
  'Art & Maker Station',
  'Transitions & Routines',
];

