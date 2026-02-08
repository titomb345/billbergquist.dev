interface GameToastProps {
  message: string;
  visible: boolean;
  color: string;
  variant?: 'hint' | 'toast';
}

function GameToast({ message, visible, color, variant = 'toast' }: GameToastProps) {
  if (!visible) return null;

  return (
    <div
      className={`game-toast game-toast--${variant}`}
      style={{ '--toast-color': color } as React.CSSProperties}
    >
      {message}
    </div>
  );
}

export default GameToast;
