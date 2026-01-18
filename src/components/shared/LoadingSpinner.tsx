interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Caricamento...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: 16,
    }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
