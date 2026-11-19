import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import LoginForm from '@/components/auth/LoginForm';

async function LoginGate() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect('/dashboard');
  }
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#0a0b0d] text-[#f2efe8] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl bg-[#14151a] border border-white/10 p-8 text-center font-mono text-xs text-zinc-400">
            Checking session...
          </div>
        }
      >
        <LoginGate />
      </Suspense>
    </main>
  );
}
