import { Plus, MessageSquare, History, User, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  conversations: any[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export function Sidebar({ conversations, currentSessionId, onSelectSession, onNewSession }: SidebarProps) {
  return (
    <div className="h-full w-full flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Header / New Session */}
      <div className="p-5 shrink-0">
        <button
          onClick={onNewSession}
          className="w-full group relative flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl py-3.5 px-4 transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span className="font-semibold tracking-wide">New Problem</span>
        </button>
      </div>

      {/* History Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-text-subtle uppercase tracking-[0.2em] mb-1">
          <History className="w-3 h-3" />
          <span>Recent Sessions</span>
        </div>
        
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-text-subtle" />
            </div>
            <p className="text-xs text-text-subtle font-medium">No history yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectSession(conv.id)}
                className={`w-full group text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  currentSessionId === conv.id 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  currentSessionId === conv.id ? 'bg-primary text-white' : 'bg-surface-3 group-hover:bg-surface-2'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none mb-1">
                    {conv.title || 'Untitled Problem'}
                  </p>
                  <p className="text-[10px] text-text-subtle truncate uppercase tracking-tight">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer / User Profile Placeholder */}
      <div className="p-4 border-t border-border bg-surface-2/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-inner">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">Test User</p>
            <p className="text-xs text-text-subtle truncate">test@example.com</p>
          </div>
          <button className="p-2 text-text-subtle hover:text-text hover:bg-surface-3 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
