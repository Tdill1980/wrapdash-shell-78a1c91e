// ============================================
// EMAIL FRANCHISE SYSTEM
// ============================================
// 10 locked editorial email franchises as core revenue engine
// Each has immutable structure, fixed CTA destination, specific voice

export type FranchiseId = 
  | 'declaration'
  | 'test_lab'
  | 'wotw'
  | 'on_the_road'
  | 'execution'
  | 'in_training'
  | 'wrap_sheet'
  | 'wrapped_wreckless'
  | 'ask_luigi'
  | 'wraptv_world'
  | 'ink_and_edge';

export type WeekSlot = 1 | 2 | 3 | 4;

export interface Franchise {
  id: FranchiseId;
  name: string;
  tagline: string;
  host?: string;
  weekSlot: WeekSlot;
  cadence: 'weekly' | 'bi-weekly' | 'monthly';
  ctaDestination: string;
  ctaText: string;
  subjectPattern: string;
  defaultImageFolder: string;
  description: string;
  color: string; // For UI display
}

export interface EmailContent {
  franchiseId: FranchiseId;
  topic: string;
  subject: string;
  previewText: string;
  heroImageUrl: string;
  heroImageAlt: string;
  headline: string;
  subheadline: string;
  openingCopy: string;
  section1Title: string;
  section1Copy: string;
  section1ImageUrl?: string;
  section1ImageAlt?: string;
  section2Title: string;
  section2Copy: string;
  ctaUrl: string;
  ctaText: string;
}

// ============================================
// FRANCHISE DEFINITIONS
// ============================================

export const FRANCHISES: Record<FranchiseId, Franchise> = {
  declaration: {
    id: 'declaration',
    name: 'Declaration',
    tagline: 'Special Announcement',
    weekSlot: 1,
    cadence: 'monthly',
    ctaDestination: 'https://weprintwraps.com',
    ctaText: 'Learn More',
    subjectPattern: '{topic}',
    defaultImageFolder: 'declaration',
    description: 'Special announcements and major updates',
    color: '#FF1493',
  },
  test_lab: {
    id: 'test_lab',
    name: 'Test Lab',
    tagline: 'WPW × Ghost Industries',
    host: 'Shaun @ Ghost Industries',
    weekSlot: 1,
    cadence: 'weekly',
    ctaDestination: 'https://weprintwraps.com/test-lab',
    ctaText: 'Explore the Test Lab',
    subjectPattern: 'Inside the Test Lab: {topic}',
    defaultImageFolder: 'test-lab',
    description: 'Material validation and comparison through real testing',
    color: '#FFD700',
  },
  wotw: {
    id: 'wotw',
    name: 'Wrap of the Week',
    tagline: 'WPW × PID',
    weekSlot: 3,
    cadence: 'bi-weekly',
    ctaDestination: 'https://weprintwraps.com/wotw',
    ctaText: 'Submit Your Wrap',
    subjectPattern: 'Wrap of the Week: {topic}',
    defaultImageFolder: 'wotw',
    description: 'Community spotlight featuring recent customer projects',
    color: '#22D3EE',
  },
  on_the_road: {
    id: 'on_the_road',
    name: 'On the Road',
    tagline: 'Mobile Execution',
    host: 'Chelsea Gunnels',
    weekSlot: 2,
    cadence: 'monthly',
    ctaDestination: 'https://weprintwraps.com/materials',
    ctaText: 'Shop Materials Used',
    subjectPattern: 'On the Road: {topic}',
    defaultImageFolder: 'on-the-road',
    description: 'Mobile execution and real-world challenges',
    color: '#10B981',
  },
  execution: {
    id: 'execution',
    name: 'Execution',
    tagline: 'Growth & Professionalization',
    host: 'Nick Wraps',
    weekSlot: 2,
    cadence: 'monthly',
    ctaDestination: 'https://weprintwraps.com/materials',
    ctaText: 'Shop Tools Used',
    subjectPattern: 'Execution: {topic}',
    defaultImageFolder: 'execution',
    description: 'Growth and professionalization in the wrap industry',
    color: '#8B5CF6',
  },
  in_training: {
    id: 'in_training',
    name: 'In Training',
    tagline: 'Skill Progression',
    host: 'Matthew Wolynski (Tallest Wrapper)',
    weekSlot: 2,
    cadence: 'monthly',
    ctaDestination: 'https://weprintwraps.com/training',
    ctaText: 'Watch the Training',
    subjectPattern: 'In Training: {topic}',
    defaultImageFolder: 'in-training',
    description: 'Skill progression and repetition for wrap installers',
    color: '#F97316',
  },
  wrap_sheet: {
    id: 'wrap_sheet',
    name: 'The Wrap Sheet',
    tagline: 'Industry Commentary',
    host: 'RJ the Wrapper',
    weekSlot: 3,
    cadence: 'weekly',
    ctaDestination: 'https://inkandedge.com',
    ctaText: 'Read More',
    subjectPattern: 'The Wrap Sheet: {topic}',
    defaultImageFolder: 'wrap-sheet',
    description: 'Industry commentary and trend analysis',
    color: '#EC4899',
  },
  wrapped_wreckless: {
    id: 'wrapped_wreckless',
    name: 'Wrapped & Wreckless',
    tagline: 'Culture & Personality',
    host: 'Jess',
    weekSlot: 3,
    cadence: 'weekly',
    ctaDestination: 'https://weprintwraps.com',
    ctaText: 'Join the Culture',
    subjectPattern: 'Wrapped & Wreckless: {topic}',
    defaultImageFolder: 'wrapped-wreckless',
    description: 'Culture and personality content from the wrap world',
    color: '#EF4444',
  },
  ask_luigi: {
    id: 'ask_luigi',
    name: 'Ask Luigi',
    tagline: 'Q&A with AI',
    weekSlot: 3,
    cadence: 'bi-weekly',
    ctaDestination: 'https://weprintwraps.com/quote',
    ctaText: 'Ask Luigi',
    subjectPattern: 'Ask Luigi: {topic}',
    defaultImageFolder: 'ask-luigi',
    description: 'Q&A format bridging AI and human expertise',
    color: '#6366F1',
  },
  wraptv_world: {
    id: 'wraptv_world',
    name: 'WrapTVWorld',
    tagline: 'Monthly Video Roundup',
    weekSlot: 4,
    cadence: 'monthly',
    ctaDestination: 'https://youtube.com/@wraptvworld',
    ctaText: 'Watch on YouTube',
    subjectPattern: 'WrapTVWorld: {topic}',
    defaultImageFolder: 'wraptv',
    description: 'Monthly video aggregation from WrapTVWorld',
    color: '#DC2626',
  },
  ink_and_edge: {
    id: 'ink_and_edge',
    name: 'Ink & Edge',
    tagline: 'Editorial Gravity',
    weekSlot: 4,
    cadence: 'monthly',
    ctaDestination: 'https://inkandedge.com',
    ctaText: 'Read the Full Article',
    subjectPattern: 'Ink & Edge: {topic}',
    defaultImageFolder: 'ink-edge',
    description: 'Monthly editorial gravity and downloadable content',
    color: '#FF1493',
  },
};

// ============================================
// WEEKLY CALENDAR MAPPING
// ============================================

export interface WeekSchedule {
  week: WeekSlot;
  label: string;
  primaryFranchise: FranchiseId;
  alternates: FranchiseId[];
}

export const WEEKLY_SCHEDULE: WeekSchedule[] = [
  {
    week: 1,
    label: 'Test Lab (Authority + Proof)',
    primaryFranchise: 'test_lab',
    alternates: [],
  },
  {
    week: 2,
    label: 'Execution / Real World',
    primaryFranchise: 'on_the_road',
    alternates: ['execution', 'in_training'],
  },
  {
    week: 3,
    label: 'Community / Culture',
    primaryFranchise: 'wotw',
    alternates: ['wrapped_wreckless', 'wrap_sheet'],
  },
  {
    week: 4,
    label: 'Video or Editorial Gravity',
    primaryFranchise: 'wraptv_world',
    alternates: ['ink_and_edge'],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getFranchiseById(id: FranchiseId): Franchise {
  return FRANCHISES[id];
}

export function getFranchisesForWeek(week: WeekSlot): Franchise[] {
  const schedule = WEEKLY_SCHEDULE.find(s => s.week === week);
  if (!schedule) return [];
  
  return [
    FRANCHISES[schedule.primaryFranchise],
    ...schedule.alternates.map(id => FRANCHISES[id]),
  ];
}

export function generateCampaignName(franchise: Franchise, topic: string, date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  const cleanTopic = topic.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 30);
  
  return `${franchise.name.replace(/\s+/g, '')}-${cleanTopic}-${month}${year}`;
}

export function generateSubject(franchise: Franchise, topic: string): string {
  return franchise.subjectPattern.replace('{topic}', topic);
}

export function getCurrentWeekSlot(): WeekSlot {
  const now = new Date();
  const dayOfMonth = now.getDate();
  
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  return 4;
}

export function getRecommendedFranchise(): Franchise {
  const week = getCurrentWeekSlot();
  const schedule = WEEKLY_SCHEDULE.find(s => s.week === week);
  
  if (!schedule) return FRANCHISES.test_lab;
  return FRANCHISES[schedule.primaryFranchise];
}

// ============================================
// FRANCHISE OPTIONS FOR DROPDOWNS
// ============================================

export const FRANCHISE_OPTIONS = Object.values(FRANCHISES).map(f => ({
  id: f.id,
  name: f.name,
  tagline: f.tagline,
  host: f.host,
  color: f.color,
}));
