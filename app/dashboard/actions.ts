'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import {
  requireAdmin,
  revokeAdminSession,
  revokeOtherAdminSessions,
  updateAdminCredentials,
} from '@/lib/auth';
import { invalidatePortfolioFromAction } from '@/lib/cache';
import type {
  DisciplineItem,
  InquiryStatus,
  ProjectAspect,
  ProjectCategory,
  SkillCategory,
  SkillLevel,
} from '@/types/portfolio';

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// 1. PROFILE & SITE SETTINGS
// ---------------------------------------------------------------------------
const disciplineSchema = z.object({
  index: z.string().trim().min(1).max(8),
  title: z.string().trim().min(1).max(80),
  desc: z.string().trim().min(1).max(600),
  tools: z.array(z.string().trim().min(1)).max(12),
  color: z.string().trim().min(4).max(32),
  visible: z.boolean(),
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(120),
  locationShort: z.string().trim().min(1).max(60),
  timezone: z.string().trim().min(1).max(80),
  availability: z.string().trim().min(1).max(120),
  isAvailable: z.boolean(),
  kicker: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(120),
  subhead: z.string().trim().min(1).max(400),
  bioLong: z.string().trim().min(1).max(2000),
  aboutHeadline: z.string().trim().min(1).max(300),
  rolesCycling: z.array(z.string().trim().min(1)).min(1).max(12),
  terminalStatuses: z.array(z.string().trim().min(1)).max(20),
  disciplines: z.array(disciplineSchema).max(6),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().min(3).max(60),
  telegramHandle: z.string().trim().min(1).max(80),
  telegramUrl: z.string().trim().url(),
  facebookName: z.string().trim().min(1).max(100),
  facebookUrl: z.string().trim().url(),
  portraitAssetId: z.string().uuid().nullable(),
  cvAssetId: z.string().uuid().nullable(),
  cvTitle: z.string().trim().min(1).max(140),
  cvDescription: z.string().trim().min(1).max(500),
  showTechnicalCategory: z.boolean(),
  footerCtaHeadline: z.string().trim().min(1).max(200),
  footerBio: z.string().trim().min(1).max(400),
});

export async function updateProfileAction(
  input: z.infer<typeof profileUpdateSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid profile data.' };
  }

  const db = getDb();
  const d = parsed.data;
  const payload = {
    name: d.name,
    role: d.role,
    location: d.location,
    locationShort: d.locationShort,
    timezone: d.timezone,
    availability: d.availability,
    isAvailable: d.isAvailable,
    kicker: d.kicker,
    headline: d.headline,
    subhead: d.subhead,
    bioLong: d.bioLong,
    aboutHeadline: d.aboutHeadline,
    rolesCycling: d.rolesCycling,
    terminalStatuses: d.terminalStatuses,
    disciplines: d.disciplines as DisciplineItem[],
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    telegramHandle: d.telegramHandle,
    telegramUrl: d.telegramUrl,
    facebookName: d.facebookName,
    facebookUrl: d.facebookUrl,
    portraitAssetId: d.portraitAssetId,
    cvAssetId: d.cvAssetId,
    cvTitle: d.cvTitle,
    cvDescription: d.cvDescription,
    showTechnicalCategory: d.showTechnicalCategory,
    footerCtaHeadline: d.footerCtaHeadline,
    footerBio: d.footerBio,
    updatedAt: new Date(),
  };

  await db
    .insert(schema.siteProfile)
    .values({ id: 1, ...payload })
    .onConflictDoUpdate({
      target: schema.siteProfile.id,
      set: payload,
    });

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/profile');
  return { ok: true, message: 'Profile & site settings saved.' };
}

// ---------------------------------------------------------------------------
// 2. STUDIO 6 WALL FRAMES (3 x 9:16 Left Wall + 3 x 16:9 Back Wall)
// ---------------------------------------------------------------------------
const studioFrameUpdateSchema = z.object({
  slotIndex: z.number().int().min(0).max(5),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(600),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a valid hex color (#rrggbb).'),
  primaryMetric: z.string().trim().min(1).max(60),
  tags: z.array(z.string().trim().min(1)).max(8),
  imageAssetId: z.string().uuid().nullable(),
});

export async function updateStudioFrameAction(
  input: z.infer<typeof studioFrameUpdateSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = studioFrameUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid frame fields.' };
  }

  const d = parsed.data;
  const wall = d.slotIndex < 3 ? ('left' as const) : ('back' as const);
  const aspectRatio = d.slotIndex < 3 ? ('9:16' as const) : ('16:9' as const);
  const indexLabel = `0${d.slotIndex + 1} / 06`;

  const db = getDb();
  await db
    .insert(schema.studioFrames)
    .values({
      slotIndex: d.slotIndex,
      wall,
      aspectRatio,
      indexLabel,
      title: d.title,
      subtitle: d.subtitle,
      category: d.category,
      description: d.description,
      accentColor: d.accentColor,
      primaryMetric: d.primaryMetric,
      tags: d.tags,
      imageAssetId: d.imageAssetId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.studioFrames.slotIndex,
      set: {
        wall,
        aspectRatio,
        indexLabel,
        title: d.title,
        subtitle: d.subtitle,
        category: d.category,
        description: d.description,
        accentColor: d.accentColor,
        primaryMetric: d.primaryMetric,
        tags: d.tags,
        imageAssetId: d.imageAssetId,
        updatedAt: new Date(),
      },
    });

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/studio');
  return { ok: true, message: `Studio Frame ${indexLabel} updated.` };
}

// ---------------------------------------------------------------------------
// 3. PROJECTS CRUD
// ---------------------------------------------------------------------------
const projectSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(1).max(140),
  category: z.enum(['Poster', 'Video', 'Technical']),
  aspect: z.enum(['4:5', '9:16', '16:9', '16:10']),
  subtitle: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(1200),
  tools: z.array(z.string().trim().min(1)).max(12),
  year: z.string().trim().min(4).max(12),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  featured: z.boolean(),
  published: z.boolean(),
  thumbnailAssetId: z.string().uuid().nullable(),
  videoAssetId: z.string().uuid().nullable(),
  externalVideoUrl: z.string().trim().url().nullable().or(z.literal('')).transform((v) => v || null),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function saveProjectAction(
  input: z.infer<typeof projectSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid project fields.' };
  }

  const db = getDb();
  const d = parsed.data;
  const values = {
    slug: d.slug,
    title: d.title,
    category: d.category as ProjectCategory,
    aspect: d.aspect as ProjectAspect,
    subtitle: d.subtitle,
    description: d.description,
    tools: d.tools,
    year: d.year,
    color: d.color,
    featured: d.featured,
    published: d.published,
    thumbnailAssetId: d.thumbnailAssetId,
    videoAssetId: d.videoAssetId,
    externalVideoUrl: d.externalVideoUrl,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  try {
    if (d.id) {
      await db.update(schema.projects).set(values).where(eq(schema.projects.id, d.id));
    } else {
      await db.insert(schema.projects).values(values);
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save project (slug may already exist).',
    };
  }

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/projects');
  return { ok: true, message: d.id ? 'Project updated.' : 'Project created.' };
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  await db.delete(schema.projects).where(eq(schema.projects.id, id));
  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/projects');
  return { ok: true, message: 'Project deleted.' };
}

// ---------------------------------------------------------------------------
// 4. SKILLS CRUD
// ---------------------------------------------------------------------------
const skillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  category: z.enum(['Design & Visual', 'Video & Motion', 'IT & Networking']),
  level: z.enum(['Expert', 'Advanced', 'Intermediate']),
  tag: z.string().trim().min(1).max(80),
  shortCode: z.string().trim().min(1).max(16),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function saveSkillAction(input: z.infer<typeof skillSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid skill data.' };
  }

  const db = getDb();
  const d = parsed.data;
  const values = {
    name: d.name,
    category: d.category as SkillCategory,
    level: d.level as SkillLevel,
    tag: d.tag,
    shortCode: d.shortCode,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  if (d.id) {
    await db.update(schema.skills).set(values).where(eq(schema.skills.id, d.id));
  } else {
    await db.insert(schema.skills).values(values);
  }

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/skills');
  return { ok: true, message: d.id ? 'Skill updated.' : 'Skill created.' };
}

export async function deleteSkillAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  await db.delete(schema.skills).where(eq(schema.skills.id, id));
  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/skills');
  return { ok: true, message: 'Skill deleted.' };
}

// ---------------------------------------------------------------------------
// 5. EXPERIENCE CRUD
// ---------------------------------------------------------------------------
const experienceSchema = z.object({
  id: z.string().uuid().optional(),
  period: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(120),
  organization: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(120),
  responsibilities: z.array(z.string().trim().min(1)).min(1).max(15),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function saveExperienceAction(
  input: z.infer<typeof experienceSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid experience data.' };
  }

  const db = getDb();
  const d = parsed.data;
  const values = {
    period: d.period,
    role: d.role,
    organization: d.organization,
    location: d.location,
    responsibilities: d.responsibilities,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  if (d.id) {
    await db.update(schema.experiences).set(values).where(eq(schema.experiences.id, d.id));
  } else {
    await db.insert(schema.experiences).values(values);
  }

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/experience');
  return { ok: true, message: d.id ? 'Experience updated.' : 'Experience added.' };
}

export async function deleteExperienceAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  await db.delete(schema.experiences).where(eq(schema.experiences.id, id));
  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/experience');
  return { ok: true, message: 'Experience deleted.' };
}

// ---------------------------------------------------------------------------
// 6. EDUCATION CRUD
// ---------------------------------------------------------------------------
const educationSchema = z.object({
  id: z.string().uuid().optional(),
  period: z.string().trim().min(1).max(80),
  degree: z.string().trim().min(1).max(180),
  institution: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(120),
  focus: z.string().trim().min(1).max(600),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function saveEducationAction(
  input: z.infer<typeof educationSchema>
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid education data.' };
  }

  const db = getDb();
  const d = parsed.data;
  const values = {
    period: d.period,
    degree: d.degree,
    institution: d.institution,
    location: d.location,
    focus: d.focus,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  if (d.id) {
    await db.update(schema.educations).set(values).where(eq(schema.educations.id, d.id));
  } else {
    await db.insert(schema.educations).values(values);
  }

  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/education');
  return { ok: true, message: d.id ? 'Education updated.' : 'Education added.' };
}

export async function deleteEducationAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  await db.delete(schema.educations).where(eq(schema.educations.id, id));
  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/education');
  return { ok: true, message: 'Education deleted.' };
}

// ---------------------------------------------------------------------------
// 7. CONTACT INQUIRIES INBOX
// ---------------------------------------------------------------------------
export async function updateInquiryAction(input: {
  id: string;
  status: InquiryStatus;
  adminNotes: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(['new', 'read', 'replied', 'archived']),
      adminNotes: z.string().max(2000),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: 'Invalid inquiry update.' };
  }

  const db = getDb();
  await db
    .update(schema.contactInquiries)
    .set({
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      updatedAt: new Date(),
    })
    .where(eq(schema.contactInquiries.id, parsed.data.id));

  revalidatePath('/dashboard/inquiries');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Inquiry updated.' };
}

export async function deleteInquiryAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getDb();
  await db.delete(schema.contactInquiries).where(eq(schema.contactInquiries.id, id));
  revalidatePath('/dashboard/inquiries');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Inquiry deleted.' };
}

// ---------------------------------------------------------------------------
// 8. SECURITY, SESSIONS & REDIS CACHE SETTINGS
// ---------------------------------------------------------------------------
export async function updateCredentialsAction(input: {
  currentPassword: string;
  newEmail?: string;
  newName?: string;
  newPassword?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const result = await updateAdminCredentials({
    userId: admin.id,
    currentSessionId: admin.sessionId,
    currentPassword: input.currentPassword,
    newEmail: input.newEmail,
    newName: input.newName,
    newPassword: input.newPassword,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath('/dashboard/settings');
  return {
    ok: true,
    message: input.newPassword
      ? 'Credentials updated & all other sessions signed out.'
      : 'Account details updated.',
  };
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await revokeAdminSession(admin.id, sessionId);
  revalidatePath('/dashboard/settings');
  return { ok: true, message: 'Session revoked.' };
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  const admin = await requireAdmin();
  const count = await revokeOtherAdminSessions(admin.id, admin.sessionId);
  revalidatePath('/dashboard/settings');
  return { ok: true, message: `Signed out ${count} other session(s).` };
}

export async function purgeCacheAction(): Promise<ActionResult> {
  await requireAdmin();
  await invalidatePortfolioFromAction();
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Redis & Next.js portfolio cache purged.' };
}
