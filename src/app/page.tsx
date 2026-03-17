// src/app/page.tsx
import { Suspense } from 'react';
import TourneyApp from '@/components/TourneyApp';

export default function Home() {
  return (
    <main>
      <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
          <div className="spinner" />
          <p style={{ color:'var(--text2)', fontSize:14 }}>Loading TourneyEdge AI...</p>
        </div>
      }>
        <TourneyApp />
      </Suspense>
    </main>
  );
}
