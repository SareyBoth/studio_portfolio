import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { requireAdmin } from '@/lib/auth';
import { buildFallbackPortfolioPayload } from '@/lib/portfolio';
import ProfileEditor from '@/components/dashboard/ProfileEditor';
import type { ProfileData } from '@/types/portfolio';

export default async function DashboardProfilePage() {
  await requireAdmin();
  const db = getDb();

  const [profileRows, mediaRows] = await Promise.all([
    db.select().from(schema.siteProfile).where(eq(schema.siteProfile.id, 1)).limit(1),
    db.select({ id: schema.mediaAssets.id, url: schema.mediaAssets.url }).from(schema.mediaAssets),
  ]);

  const mediaMap = new Map(mediaRows.map((m) => [m.id, m.url]));
  const fallback = buildFallbackPortfolioPayload().profile;
  const p = profileRows[0];

  const profile: ProfileData = p
    ? {
        name: p.name,
        role: p.role,
        location: p.location,
        locationShort: p.locationShort,
        timezone: p.timezone,
        availability: p.availability,
        isAvailable: p.isAvailable,
        kicker: p.kicker,
        headline: p.headline,
        subhead: p.subhead,
        bioLong: p.bioLong,
        aboutHeadline: p.aboutHeadline,
        rolesCycling: p.rolesCycling,
        terminalStatuses: p.terminalStatuses,
        disciplines: p.disciplines,
        contact: {
          email: p.contactEmail,
          phone: p.contactPhone,
          telegram: p.telegramHandle,
          telegramUrl: p.telegramUrl,
          facebook: p.facebookName,
          facebookUrl: p.facebookUrl,
          locationShort: p.locationShort,
          timezone: p.timezone,
        },
        portraitAssetId: p.portraitAssetId,
        portraitUrl: p.portraitAssetId ? (mediaMap.get(p.portraitAssetId) ?? null) : null,
        cvAssetId: p.cvAssetId,
        cvUrl: p.cvAssetId ? (mediaMap.get(p.cvAssetId) ?? null) : null,
        cvTitle: p.cvTitle,
        cvDescription: p.cvDescription,
        showTechnicalCategory: p.showTechnicalCategory,
        footerCtaHeadline: p.footerCtaHeadline,
        footerBio: p.footerBio,
      }
    : fallback;

  return <ProfileEditor initialProfile={profile} />;
}
