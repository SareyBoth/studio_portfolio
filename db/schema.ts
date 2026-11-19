import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  DisciplineItem,
  InquiryStatus,
  MediaFolder,
  MediaKind,
  ProjectAspect,
  ProjectCategory,
  SkillCategory,
  SkillLevel,
  StudioFrameAspect,
  StudioWall,
} from '@/types/portfolio';

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('admin_sessions_user_id_idx').on(table.userId),
    index('admin_sessions_expires_at_idx').on(table.expiresAt),
  ]
);

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    url: text('url').notNull(),
    kind: text('kind').$type<MediaKind>().notNull(),
    folder: text('folder').$type<MediaFolder>().notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('media_assets_kind_idx').on(table.kind),
    index('media_assets_created_at_idx').on(table.createdAt),
  ]
);

export const siteProfile = pgTable('site_profile', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull(),
  role: text('role').notNull(),
  location: text('location').notNull(),
  locationShort: text('location_short').notNull(),
  timezone: text('timezone').notNull(),
  availability: text('availability').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  kicker: text('kicker').notNull(),
  headline: text('headline').notNull(),
  subhead: text('subhead').notNull(),
  bioLong: text('bio_long').notNull(),
  aboutHeadline: text('about_headline').notNull(),
  rolesCycling: jsonb('roles_cycling').$type<string[]>().notNull().default([]),
  terminalStatuses: jsonb('terminal_statuses').$type<string[]>().notNull().default([]),
  disciplines: jsonb('disciplines').$type<DisciplineItem[]>().notNull().default([]),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  telegramHandle: text('telegram_handle').notNull(),
  telegramUrl: text('telegram_url').notNull(),
  facebookName: text('facebook_name').notNull(),
  facebookUrl: text('facebook_url').notNull(),
  portraitAssetId: uuid('portrait_asset_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  cvAssetId: uuid('cv_asset_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  cvTitle: text('cv_title').notNull().default('SareyBoth — Resume 2026'),
  cvDescription: text('cv_description')
    .notNull()
    .default(
      'Complete career documentation including technical certifications, university course marks, and client project references.'
    ),
  showTechnicalCategory: boolean('show_technical_category').default(false).notNull(),
  footerCtaHeadline: text('footer_cta_headline')
    .notNull()
    .default('Ready to elevate your visual identity or IT infrastructure?'),
  footerBio: text('footer_bio')
    .notNull()
    .default(
      'Creative design, high-tempo video editing, and enterprise IT network support based in Phnom Penh, Cambodia.'
    ),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const studioFrames = pgTable(
  'studio_frames',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slotIndex: integer('slot_index').notNull(),
    wall: text('wall').$type<StudioWall>().notNull(),
    aspectRatio: text('aspect_ratio').$type<StudioFrameAspect>().notNull(),
    indexLabel: text('index_label').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    accentColor: text('accent_color').notNull().default('#d7ff3f'),
    primaryMetric: text('primary_metric').notNull(),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('studio_frames_slot_index_uidx').on(table.slotIndex)]
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    category: text('category').$type<ProjectCategory>().notNull(),
    aspect: text('aspect').$type<ProjectAspect>().notNull().default('4:5'),
    subtitle: text('subtitle').notNull(),
    description: text('description').notNull(),
    tools: jsonb('tools').$type<string[]>().notNull().default([]),
    year: text('year').notNull(),
    color: text('color').notNull().default('#d7ff3f'),
    featured: boolean('featured').default(false).notNull(),
    published: boolean('published').default(true).notNull(),
    thumbnailAssetId: uuid('thumbnail_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    videoAssetId: uuid('video_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    externalVideoUrl: text('external_video_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('projects_category_sort_idx').on(table.category, table.sortOrder),
    index('projects_published_idx').on(table.published),
  ]
);

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    category: text('category').$type<SkillCategory>().notNull(),
    level: text('level').$type<SkillLevel>().notNull().default('Advanced'),
    tag: text('tag').notNull(),
    shortCode: text('short_code').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('skills_sort_idx').on(table.sortOrder)]
);

export const experiences = pgTable(
  'experiences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    period: text('period').notNull(),
    role: text('role').notNull(),
    organization: text('organization').notNull(),
    location: text('location').notNull(),
    responsibilities: jsonb('responsibilities').$type<string[]>().notNull().default([]),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('experiences_sort_idx').on(table.sortOrder)]
);

export const educations = pgTable(
  'educations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    period: text('period').notNull(),
    degree: text('degree').notNull(),
    institution: text('institution').notNull(),
    location: text('location').notNull(),
    focus: text('focus').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('educations_sort_idx').on(table.sortOrder)]
);

export const contactInquiries = pgTable(
  'contact_inquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    service: text('service').notNull(),
    message: text('message').notNull(),
    status: text('status').$type<InquiryStatus>().notNull().default('new'),
    adminNotes: text('admin_notes').notNull().default(''),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('contact_inquiries_status_idx').on(table.status),
    index('contact_inquiries_created_at_idx').on(table.createdAt),
  ]
);
