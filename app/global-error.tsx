'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#132842',
          color: '#f4f8fc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <section
          style={{
            maxWidth: 560,
            width: '100%',
            borderRadius: 24,
            padding: 24,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em' }}>
            ERROR GLOBAL
          </p>
          <h1 style={{ margin: '12px 0 8px', fontSize: 34 }}>La aplicacion se detuvo.</h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(244,248,252,0.82)' }}>
            {error.message || 'Hubo un problema inesperado.'}
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
              background: '#f0bc5a',
              color: '#14263f',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </section>
      </body>
    </html>
  );
}
