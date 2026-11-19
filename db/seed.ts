import { existsSync } from 'node:fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count } from 'drizzle-orm';
import * as schema from './schema';
import { PORTFOLIO_DATA } from '@/data/portfolio';
import { hashPassword } from '@/lib/password';
import type { DisciplineItem } from '@/types/portfolio';

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envFile);
  }
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    console.log('[seed] Starting idempotent PostgreSQL seed...');

    // 1. Admin user (only insert if none exists so rotated passwords are never overwritten)
    const [{ value: adminCount }] = await db.select({ value: count() }).from(schema.adminUsers);
    if (adminCount === 0) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'sareyboth@gmail.com').trim().toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMeToAStrongPassword123!';
      const adminName = process.env.ADMIN_NAME || 'SareyBoth';

      const passwordHash = await hashPassword(adminPassword);
      await db.insert(schema.adminUsers).values({
        email: adminEmail,
        name: adminName,
        passwordHash,
      });
      console.log(`[seed] Created initial admin user: ${adminEmail}`);
    } else {
      console.log('[seed] Admin user already exists — skipping.');
    }

    // 2. Site Profile (singleton id = 1)
    const [{ value: profileCount }] = await db.select({ value: count() }).from(schema.siteProfile);
    if (profileCount === 0) {
      const disciplines: DisciplineItem[] = [
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

      await db.insert(schema.siteProfile).values({
        id: 1,
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
        aboutHeadline:
          'I study Management Information Systems at SETEC Institute in Phnom Penh.',
        rolesCycling: PORTFOLIO_DATA.profile.rolesCycling,
        terminalStatuses: PORTFOLIO_DATA.terminalStatuses,
        disciplines,
        contactEmail: PORTFOLIO_DATA.profile.contact.email,
        contactPhone: PORTFOLIO_DATA.profile.contact.phone,
        telegramHandle: PORTFOLIO_DATA.profile.contact.telegram,
        telegramUrl: PORTFOLIO_DATA.profile.contact.telegramUrl,
        facebookName: PORTFOLIO_DATA.profile.contact.facebook,
        facebookUrl: PORTFOLIO_DATA.profile.contact.facebookUrl,
        cvTitle: 'SareyBoth — Resume 2026',
        cvDescription:
          'Complete career documentation including technical certifications, university course marks, and client project references.',
        showTechnicalCategory: false,
        footerCtaHeadline: 'Ready to elevate your visual identity or IT infrastructure?',
        footerBio:
          'Creative design, high-tempo video editing, and enterprise IT network support based in Phnom Penh, Cambodia.',
      });
      console.log('[seed] Seeded site_profile.');
    }

    // 3. Studio Wall Frames (6 slots: 0..2 Left Wall 9:16, 3..5 Back Wall 16:9)
    const [{ value: frameCount }] = await db.select({ value: count() }).from(schema.studioFrames);
    if (frameCount === 0) {
      await db.insert(schema.studioFrames).values(
        PORTFOLIO_DATA.wallFrames.map((frame, idx) => ({
          slotIndex: idx,
          wall: idx < 3 ? ('left' as const) : ('back' as const),
          aspectRatio: idx < 3 ? ('9:16' as const) : ('16:9' as const),
          indexLabel: frame.index,
          title: frame.title,
          subtitle: frame.subtitle,
          category: frame.category,
          description: frame.description,
          accentColor: frame.accentColor,
          primaryMetric: frame.primaryMetric,
          tags: frame.tags,
        }))
      );
      console.log('[seed] Seeded 6 studio_frames (3x 9:16 left, 3x 16:9 back).');
    }

    // 4. Projects
    const [{ value: projectCount }] = await db.select({ value: count() }).from(schema.projects);
    if (projectCount === 0) {
      await db.insert(schema.projects).values(
        PORTFOLIO_DATA.projects.map((p, idx) => ({
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
          externalVideoUrl: p.videoUrl ?? null,
          sortOrder: idx,
        }))
      );
      console.log(`[seed] Seeded ${PORTFOLIO_DATA.projects.length} projects.`);
    }

    // 5. Skills
    const [{ value: skillCount }] = await db.select({ value: count() }).from(schema.skills);
    if (skillCount === 0) {
      await db.insert(schema.skills).values(
        PORTFOLIO_DATA.skills.map((s, idx) => ({
          name: s.name,
          category: s.category,
          level: s.level,
          tag: s.tag,
          shortCode: s.shortCode,
          sortOrder: idx,
        }))
      );
      console.log(`[seed] Seeded ${PORTFOLIO_DATA.skills.length} skills.`);
    }

    // 6. Experience
    const [{ value: expCount }] = await db.select({ value: count() }).from(schema.experiences);
    if (expCount === 0) {
      await db.insert(schema.experiences).values(
        PORTFOLIO_DATA.experience.map((e, idx) => ({
          period: e.period,
          role: e.role,
          organization: e.organization,
          location: e.location,
          responsibilities: e.responsibilities,
          sortOrder: idx,
        }))
      );
      console.log(`[seed] Seeded ${PORTFOLIO_DATA.experience.length} experiences.`);
    }

    // 7. Education
    const [{ value: eduCount }] = await db.select({ value: count() }).from(schema.educations);
    if (eduCount === 0) {
      await db.insert(schema.educations).values(
        PORTFOLIO_DATA.education.map((e, idx) => ({
          period: e.period,
          degree: e.degree,
          institution: e.institution,
          location: e.location,
          focus: e.focus,
          sortOrder: idx,
        }))
      );
      console.log(`[seed] Seeded ${PORTFOLIO_DATA.education.length} educations.`);
    }

    console.log('[seed] Done.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
