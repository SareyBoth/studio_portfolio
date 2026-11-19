import { Suspense } from 'react';
import StudioExperience from '@/components/studio/StudioExperience';
import { getPortfolioData } from '@/lib/portfolio';

async function StudioLoader() {
  const data = await getPortfolioData();
  return <StudioExperience data={data} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0a0b0d] text-[#f2efe8] flex items-center justify-center font-mono text-xs tracking-widest">
          <span className="inline-flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#d7ff3f] pulse-dot" />
            INITIALIZING 3D STUDIO...
          </span>
        </div>
      }
    >
      <StudioLoader />
    </Suspense>
  );
}
