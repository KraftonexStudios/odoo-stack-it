
import { Player } from '@lottiefiles/react-lottie-player';

interface LottieIconProps {
  src: string;
  className?: string;
  size?: number;
  autoplay?: boolean;
  loop?: boolean;
}

export const LottieIcon = ({ 
  src, 
  className = "", 
  size = 24, 
  autoplay = true, 
  loop = true 
}: LottieIconProps) => {
  return (
    <Player
      src={src}
      className={className}
      style={{ height: size, width: size }}
      autoplay={autoplay}
      loop={loop}
    />
  );
};
