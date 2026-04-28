'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f2f6fb',
        color: '#14263f',
      }}
    >
      <section
        style={{
          maxWidth: 560,
          width: '100%',
          borderRadius: 24,
          padding: 24,
          background: '#ffffff',
          border: '1px solid rgba(20, 38, 63, 0.1)',
          boxShadow: '0 20px 40px rgba(20, 38, 63, 0.08)',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em' }}>
          ERROR DE LA APP
        </p>
        <h2 style={{ margin: '12px 0 8px', fontSize: 32 }}>Algo falló al renderizar.</h2>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(20, 38, 63, 0.72)' }}>
          Puedes intentar recargar esta vista. Si vuelve a pasar, revisamos el módulo que esté
          lanzando la excepción.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 18,
            height: 44,
            padding: '0 18px',
            border: 'none',
            borderRadius: 14,
            background: '#183f67',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
      </section>
    </main>
  );
}
