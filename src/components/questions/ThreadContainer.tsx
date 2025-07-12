
import { ReactNode } from 'react';
import { LottieIcon } from '@/components/common/LottieIcon';

interface ThreadContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const ThreadContainer = ({ children, title, subtitle }: ThreadContainerProps) => {
  return (
    <div className="glass-morphism rounded-xl border border-border/30 overflow-hidden animate-scale-in">
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-border/20 bg-gradient-to-r from-background/80 to-background/60">
          <div className="flex items-center gap-3">
            {/* Add a subtle Lottie icon - you can replace this URL with any discussion/chat Lottie */}
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-primary/20 rounded-full"></div>
            </div>
            
            <div className="flex-1">
              {title && (
                <h2 className="text-heading font-semibold text-foreground mb-1">{title}</h2>
              )}
              {subtitle && (
                <p className="text-body-sm text-muted-foreground font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="relative">
        {children}
        
        {/* Enhanced end of thread indicator */}
        <div className="px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent"></div>
            <div className="w-2 h-2 bg-border/40 rounded-full"></div>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent"></div>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2 font-medium">End of discussion thread</p>
        </div>
      </div>
    </div>
  );
};
