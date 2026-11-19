export type MediaKind = 'image' | 'video' | 'cv';
export type MediaFolder = 'frames' | 'projects' | 'videos' | 'profile' | 'cv';

export type ProjectCategory = 'Poster' | 'Video' | 'Technical';
export type ProjectAspect = '4:5' | '9:16' | '16:9' | '16:10';

export type SkillCategory = 'Design & Visual' | 'Video & Motion' | 'IT & Networking';
export type SkillLevel = 'Expert' | 'Advanced' | 'Intermediate';

export type StudioWall = 'left' | 'back';
export type StudioFrameAspect = '9:16' | '16:9';

export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived';

export interface MediaAssetData {
  id: string;
  key: string;
  url: string;
  kind: MediaKind;
  folder: MediaFolder;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface DisciplineItem {
  index: string;
  title: string;
  desc: string;
  tools: string[];
  color: string;
  visible: boolean;
}

export interface ProfileData {
  name: string;
  role: string;
  location: string;
  locationShort: string;
  timezone: string;
  availability: string;
  isAvailable: boolean;
  kicker: string;
  headline: string;
  subhead: string;
  bioLong: string;
  aboutHeadline: string;
  rolesCycling: string[];
  terminalStatuses: string[];
  disciplines: DisciplineItem[];
  contact: {
    email: string;
    phone: string;
    telegram: string;
    telegramUrl: string;
    facebook: string;
    facebookUrl: string;
    locationShort: string;
    timezone: string;
  };
  portraitAssetId: string | null;
  portraitUrl: string | null;
  cvAssetId: string | null;
  cvUrl: string | null;
  cvTitle: string;
  cvDescription: string;
  showTechnicalCategory: boolean;
  footerCtaHeadline: string;
  footerBio: string;
}

export interface StudioFrameData {
  id: string;
  slotIndex: number; // 0..2 = Left Wall (9:16), 3..5 = Back Wall (16:9)
  wall: StudioWall;
  aspectRatio: StudioFrameAspect;
  index: string; // e.g. '01 / 06'
  title: string;
  subtitle: string;
  category: string;
  description: string;
  accentColor: string;
  primaryMetric: string;
  tags: string[];
  imageAssetId: string | null;
  imageUrl: string | null;
}

export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  aspect: ProjectAspect;
  subtitle: string;
  description: string;
  tools: string[];
  year: string;
  color: string;
  featured: boolean;
  published: boolean;
  thumbnailAssetId: string | null;
  thumbnailUrl: string | null;
  videoAssetId: string | null;
  videoUrl: string | null; // Direct R2 video URL
  externalVideoUrl: string | null; // Optional YouTube/Vimeo embed URL
  sortOrder: number;
}

export interface SkillData {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  tag: string;
  shortCode: string;
  sortOrder: number;
}

export interface ExperienceData {
  id: string;
  period: string;
  role: string;
  organization: string;
  location: string;
  responsibilities: string[];
  sortOrder: number;
}

export interface EducationData {
  id: string;
  period: string;
  degree: string;
  institution: string;
  location: string;
  focus: string;
  sortOrder: number;
}

export interface ContactInquiryData {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  status: InquiryStatus;
  adminNotes: string;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioPayload {
  profile: ProfileData;
  wallFrames: StudioFrameData[];
  projects: ProjectData[];
  skills: SkillData[];
  experience: ExperienceData[];
  education: EducationData[];
}
