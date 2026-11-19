import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { getDb, schema } from '@/db';
import { PORTFOLIO_DATA } from '@/data/portfolio';
import {
  CACHE_KEYS,
  getCachedJson,
  PORTFOLIO_CACHE_TAG,
  PORTFOLIO_TTL_SECONDS,
} from './cache';
import type {
  DisciplineItem,
  EducationData,
  ExperienceData,
  PortfolioPayload,
  ProfileData,
  ProjectData,
  SkillData,
  StudioFrameData,
} from '@/types/portfolio';

export function buildFallbackPortfolioPayload(): PortfolioPayload {
  const fallbackDisciplines: DisciplineItem[] = [
    {
      index: '01',
      title: 'Poster design',
      desc: 'Crafting high-impact print collateral, festival posters, and commercial key visuals in Phnom Penh. Grounded in precise typography, cultural iconography, and prepress accuracy.',
      tools: ['Adobe Photoshop', 'Adobe Illustrator', 'CMYK Prepress', 'Swiss Grid'],
      color: '#d7ff3f',
      visible: true,
    },
    {
      index: '02',
      title: 'Video editing',
      desc: 'Editing commercials, wedding teasers, and automotive motion reels. Specializing in velocity speed curves, film emulsion color grading, dynamic sound design, and clean narrative pacing.',
      tools: ['Premiere Pro', 'After Effects', 'Speed Ramping', 'Sound Foley'],
      color: '#ff6b12',
      visible: true,
    },
    {
      index: '03',
      title: 'Computer support',
      desc: 'Configuring enterprise networks, MikroTik RouterOS PPPoE servers, and institutional computer laboratories. Comprehensive component diagnostics, OS cloning, and hardware repair.',
      tools: ['MikroTik RouterOS', 'Cat6 Structured LAN', 'Hardware Repair', 'Lab Deployment'],
      color: '#06b6d4',
      visible: false,
    },
  ];

  const profile: ProfileData = {
    name: PORTFOLIO_DATA.profile.name,
    role: PORTFOLIO_DATA.profile.role,
    location: PORTFOLIO_DATA.profile.location,
    locationShort: PORTFOLIO_DATA.profile.contact.locationShort,
    timezone: PORTFOLIO_DATA.profile.contact.timezone,
    availability: PORTFOLIO_DATA.profile.availability,
    isAvailable: true,
    kicker: PORTFOLIO_DATA.profile.kicker,
    headline: PORTFOLIO_DATA.profile.headline,
    subhead: PORTFOLIO_DATA.profile.subhead,
    bioLong: PORTFOLIO_DATA.profile.bioLong,
    aboutHeadline: 'I study Management Information Systems at SETEC Institute in Phnom Penh.',
    rolesCycling: PORTFOLIO_DATA.profile.rolesCycling,
    terminalStatuses: PORTFOLIO_DATA.terminalStatuses,
    disciplines: fallbackDisciplines,
    contact: PORTFOLIO_DATA.profile.contact,
    portraitAssetId: null,
    portraitUrl: null,
    cvAssetId: null,
    cvUrl: null,
    cvTitle: 'SareyBoth — Resume 2026',
    cvDescription:
      'Complete career documentation including technical certifications, university course marks, and client project references.',
    showTechnicalCategory: false,
    footerCtaHeadline: 'Ready to elevate your visual identity or IT infrastructure?',
    footerBio:
      'Creative design, high-tempo video editing, and enterprise IT network support based in Phnom Penh, Cambodia.',
  };

  const wallFrames: StudioFrameData[] = PORTFOLIO_DATA.wallFrames.map((f, idx) => ({
    id: `fallback-frame-${idx}`,
    slotIndex: idx,
    wall: idx < 3 ? 'left' : 'back',
    aspectRatio: idx < 3 ? '9:16' : '16:9',
    index: f.index,
    title: f.title,
    subtitle: f.subtitle,
    category: f.category,
    description: f.description,
    accentColor: f.accentColor,
    primaryMetric: f.primaryMetric,
    tags: f.tags,
    imageAssetId: null,
    imageUrl: null,
  }));

  const projects: ProjectData[] = PORTFOLIO_DATA.projects.map((p, idx) => ({
    id: `fallback-project-${idx}`,
    slug: p.id,
    title: p.title,
    category: p.category,
    aspect: p.aspect,
    subtitle: p.subtitle,
    description: p.description,
    tools: p.tools,
    year: p.year,
    color: p.color,
    featured: Boolean(p.featured),
    published: true,
    thumbnailAssetId: null,
    thumbnailUrl: null,
    videoAssetId: null,
    videoUrl: null,
    externalVideoUrl: p.videoUrl ?? null,
    sortOrder: idx,
  }));

  const skills: SkillData[] = PORTFOLIO_DATA.skills.map((s, idx) => ({
    id: `fallback-skill-${idx}`,
    name: s.name,
    category: s.category,
    level: s.level,
    tag: s.tag,
    shortCode: s.shortCode,
    sortOrder: idx,
  }));

  const experience: ExperienceData[] = PORTFOLIO_DATA.experience.map((e, idx) => ({
    id: `fallback-exp-${idx}`,
    period: e.period,
    role: e.role,
    organization: e.organization,
    location: e.location,
    responsibilities: e.responsibilities,
    sortOrder: idx,
  }));

  const education: EducationData[] = PORTFOLIO_DATA.education.map((e, idx) => ({
    id: `fallback-edu-${idx}`,
    period: e.period,
    degree: e.degree,
    institution: e.institution,
    location: e.location,
    focus: e.focus,
    sortOrder: idx,
  }));

  return { profile, wallFrames, projects, skills, experience, education };
}

async function queryPortfolioFromPostgres(): Promise<PortfolioPayload> {
  const db = getDb();

  const [
    profileRows,
    frameRows,
    projectRows,
    skillRows,
    experienceRows,
    educationRows,
    mediaRows,
  ] = await Promise.all([
    db.select().from(schema.siteProfile).where(eq(schema.siteProfile.id, 1)).limit(1),
    db.select().from(schema.studioFrames).orderBy(asc(schema.studioFrames.slotIndex)),
    db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.published, true))
      .orderBy(asc(schema.projects.sortOrder), asc(schema.projects.createdAt)),
    db
      .select()
      .from(schema.skills)
      .orderBy(asc(schema.skills.sortOrder), asc(schema.skills.createdAt)),
    db
      .select()
      .from(schema.experiences)
      .orderBy(asc(schema.experiences.sortOrder), asc(schema.experiences.createdAt)),
    db
      .select()
      .from(schema.educations)
      .orderBy(asc(schema.educations.sortOrder), asc(schema.educations.createdAt)),
    db.select({ id: schema.mediaAssets.id, url: schema.mediaAssets.url }).from(schema.mediaAssets),
  ]);

  const fallback = buildFallbackPortfolioPayload();
  const mediaUrlById = new Map(mediaRows.map((m) => [m.id, m.url]));

  const pRow = profileRows[0];
  const profile: ProfileData = pRow
    ? {
        name: pRow.name,
        role: pRow.role,
        location: pRow.location,
        locationShort: pRow.locationShort,
        timezone: pRow.timezone,
        availability: pRow.availability,
        isAvailable: pRow.isAvailable,
        kicker: pRow.kicker,
        headline: pRow.headline,
        subhead: pRow.subhead,
        bioLong: pRow.bioLong,
        aboutHeadline: pRow.aboutHeadline,
        rolesCycling: pRow.rolesCycling.length > 0 ? pRow.rolesCycling : fallback.profile.rolesCycling,
        terminalStatuses:
          pRow.terminalStatuses.length > 0
            ? pRow.terminalStatuses
            : fallback.profile.terminalStatuses,
        disciplines: pRow.disciplines.length > 0 ? pRow.disciplines : fallback.profile.disciplines,
        contact: {
          email: pRow.contactEmail,
          phone: pRow.contactPhone,
          telegram: pRow.telegramHandle,
          telegramUrl: pRow.telegramUrl,
          facebook: pRow.facebookName,
          facebookUrl: pRow.facebookUrl,
          locationShort: pRow.locationShort,
          timezone: pRow.timezone,
        },
        portraitAssetId: pRow.portraitAssetId,
        portraitUrl: pRow.portraitAssetId ? (mediaUrlById.get(pRow.portraitAssetId) ?? null) : null,
        cvAssetId: pRow.cvAssetId,
        cvUrl: pRow.cvAssetId ? (mediaUrlById.get(pRow.cvAssetId) ?? null) : null,
        cvTitle: pRow.cvTitle,
        cvDescription: pRow.cvDescription,
        showTechnicalCategory: pRow.showTechnicalCategory,
        footerCtaHeadline: pRow.footerCtaHeadline,
        footerBio: pRow.footerBio,
      }
    : fallback.profile;

  const wallFrames: StudioFrameData[] =
    frameRows.length > 0
      ? frameRows.map((f) => ({
          id: f.id,
          slotIndex: f.slotIndex,
          wall: f.wall,
          aspectRatio: f.aspectRatio,
          index: f.indexLabel,
          title: f.title,
          subtitle: f.subtitle,
          category: f.category,
          description: f.description,
          accentColor: f.accentColor,
          primaryMetric: f.primaryMetric,
          tags: f.tags,
          imageAssetId: f.imageAssetId,
          imageUrl: f.imageAssetId ? (mediaUrlById.get(f.imageAssetId) ?? null) : null,
        }))
      : fallback.wallFrames;

  const projects: ProjectData[] =
    projectRows.length > 0
      ? projectRows.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          aspect: p.aspect,
          subtitle: p.subtitle,
          description: p.description,
          tools: p.tools,
          year: p.year,
          color: p.color,
          featured: p.featured,
          published: p.published,
          thumbnailAssetId: p.thumbnailAssetId,
          thumbnailUrl: p.thumbnailAssetId
            ? (mediaUrlById.get(p.thumbnailAssetId) ?? null)
            : null,
          videoAssetId: p.videoAssetId,
          videoUrl: p.videoAssetId ? (mediaUrlById.get(p.videoAssetId) ?? null) : null,
          externalVideoUrl: p.externalVideoUrl,
          sortOrder: p.sortOrder,
        }))
      : pRow
        ? []
        : fallback.projects;

  const skills: SkillData[] =
    skillRows.length > 0
      ? skillRows.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          level: s.level,
          tag: s.tag,
          shortCode: s.shortCode,
          sortOrder: s.sortOrder,
        }))
      : pRow
        ? []
        : fallback.skills;

  const experience: ExperienceData[] =
    experienceRows.length > 0
      ? experienceRows.map((e) => ({
          id: e.id,
          period: e.period,
          role: e.role,
          organization: e.organization,
          location: e.location,
          responsibilities: e.responsibilities,
          sortOrder: e.sortOrder,
        }))
      : pRow
        ? []
        : fallback.experience;

  const education: EducationData[] =
    educationRows.length > 0
      ? educationRows.map((e) => ({
          id: e.id,
          period: e.period,
          degree: e.degree,
          institution: e.institution,
          location: e.location,
          focus: e.focus,
          sortOrder: e.sortOrder,
        }))
      : pRow
        ? []
        : fallback.education;

  return { profile, wallFrames, projects, skills, experience, education };
}

/**
 * Fetches the full hydrated portfolio payload through Next.js 16 `use cache` + Redis (`REDIS_URL`) + PostgreSQL.
 * Falls back cleanly to static defaults during build-time prerender if DATABASE_URL / REDIS_URL are not yet running.
 */
export async function getPortfolioData(): Promise<PortfolioPayload> {
  'use cache';
  cacheTag(PORTFOLIO_CACHE_TAG);
  cacheLife('hours');

  if (!process.env.DATABASE_URL) {
    return buildFallbackPortfolioPayload();
  }

  try {
    if (process.env.REDIS_URL) {
      return await getCachedJson<PortfolioPayload>(
        CACHE_KEYS.PORTFOLIO,
        PORTFOLIO_TTL_SECONDS,
        queryPortfolioFromPostgres
      );
    }
    return await queryPortfolioFromPostgres();
  } catch (err) {
    console.warn(
      '[getPortfolioData] Falling back to static defaults (DB/Redis unavailable):',
      err instanceof Error ? err.message : err
    );
    return buildFallbackPortfolioPayload();
  }
}
