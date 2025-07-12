import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User } from 'lucide-react';

interface MentionUser {
  id: string;
  name: string | null;
  email: string;
}

interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<any, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({
        id: item.id,
        label: item.name || item.email.split('@')[0],
      });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-2 max-w-xs">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            className={`w-full text-left p-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-foreground truncate">
                {item.name || item.email.split('@')[0]}
              </div>
              {item.name && (
                <div className="text-xs text-muted-foreground truncate">
                  {item.email}
                </div>
              )}
            </div>
          </button>
        ))
      ) : (
        <div className="p-2 text-sm text-muted-foreground">No members found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';