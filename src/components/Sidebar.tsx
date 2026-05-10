import { useState } from 'react';

interface SidebarProps {
  conversations: any[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export function Sidebar({ conversations, currentSessionId, onSelectSession, onNewSession }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`h-full flex flex-col bg-surface border-r border-border transition-all duration-300 ${isOpen ? 'w-[280px]' : 'w-0 overflow-hidden'}`}>
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-3 px-4 transition-colors font-medium tour-new-problem"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          <span>New Problem</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 px-2 mt-4">History</div>
        {conversations.length === 0 ? (
          <div className="text-sm text-subtle px-2 py-4 text-center">No recent conversations</div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectSession(conv.id)}
              className={`w-full text-left flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors truncate ${
                currentSessionId === conv.id ? 'bg-surface-2 text-white border border-border/50' : 'text-subtle hover:bg-surface-2/50 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              <span className="truncate text-sm font-medium">{conv.title || 'Unknown Problem'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
