
'use client';

import { useEffect } from 'react';
import { useRouter }from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// This page is deprecated and now redirects to the new unified issuance page.
export default function DeprecatedCapturaPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/emitir');
    }, [router]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 text-center">
                <p>Redirecionando para a nova página de emissão...</p>
                <Skeleton className="h-4 w-[250px] mx-auto" />
                <Skeleton className="h-4 w-[200px] mx-auto" />
            </div>
        </div>
    </div>
  );
}
