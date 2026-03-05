import type { ReactNode } from 'react';
import { SignIn } from '@clerk/clerk-react';
import styles from './AuthGate.module.css';

interface AuthGateProps {
  error?: string;
  onBack?: () => void;
  brandContent?: ReactNode;
  subtitle?: string;
  redirectUrl?: string;
  accentColor?: string;
}

export function AuthGate({
  error,
  onBack,
  brandContent,
  subtitle = 'Sign in to continue.',
  redirectUrl = '/retro',
  accentColor = '#bf00ff',
}: AuthGateProps) {
  return (
    <div className={styles.container}>
      {brandContent ?? (
        <span className={styles.brand}>
          Retro<span className={styles.brandAccent}>Retro</span>
        </span>
      )}
      {error ? (
        <div className={styles.errorCard}>
          <p className={styles.errorText}>{error}</p>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>
              Sign out and try again
            </button>
          )}
        </div>
      ) : (
        <>
          <p className={styles.subtitle}>{subtitle}</p>
          <SignIn
            forceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
            appearance={{
              variables: {
                colorPrimary: accentColor,
                colorBackground: '#14141f',
                colorText: '#ffffff',
                colorTextSecondary: '#b0b0c0',
                colorTextOnPrimaryBackground: '#ffffff',
                colorInputBackground: 'rgba(255, 255, 255, 0.06)',
                colorInputText: '#ffffff',
                colorNeutral: '#ffffff',
                borderRadius: '8px',
                fontFamily: "'Space Grotesk Variable', sans-serif",
              },
              elements: {
                rootBox: { width: '100%', maxWidth: '380px' },
                card: {
                  background: '#14141f',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'none',
                },
                socialButtonsBlockButton: {
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                },
                socialButtonsBlockButtonText: {
                  color: '#ffffff',
                },
                headerTitle: {
                  color: '#ffffff',
                },
                headerSubtitle: {
                  color: '#b0b0c0',
                },
                footerActionLink: {
                  color: accentColor,
                },
                dividerLine: {
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                },
                dividerText: {
                  color: '#6a6a7a',
                },
              },
            }}
          />
        </>
      )}
    </div>
  );
}
