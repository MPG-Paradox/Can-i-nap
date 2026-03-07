'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function DashboardRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const zone = searchParams.get('zone');

  useEffect(() => {
    if (zone) {
      router.replace(`/?zone=${zone}`);
    } else {
      router.replace('/');
    }
  }, [zone, router]);

  return null;
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardRedirect />
    </Suspense>
  );
}
