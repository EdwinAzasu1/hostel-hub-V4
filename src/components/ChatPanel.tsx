import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, Building2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  hostel_id: string;
  sender_id: string;
  sender_role: 'admin' | 'owner';
  message: string;
  created_at: string;
  read_at: string | null;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelId: string;
  hostelName: string;
  currentUserId: string;
  currentUserRole: 'admin' | 'owner';
}

export const ChatPanel = ({
  open,
  onOpenChange,
  hostelId,
  hostelName,
  currentUserId,
  currentUserRole,
}: ChatPanelProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Flag to suppress real-time DELETE events during a programmatic clear,
  // preventing a race where fetchMessages() re-runs before all rows are gone.
  const clearingRef = useRef(false);

  // Fetch messages + subscribe to live changes when panel opens
  useEffect(() => {
    if (!open || !hostelId) return;

    fetchMessages();

    // Listen for new messages AND deletions in real time
    const channel = supabase
      .channel(`chat-live-${hostelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `hostel_id=eq.${hostelId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === (payload.new as ChatMessage).id)) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `hostel_id=eq.${hostelId}`,
        },
        () => {
          // Skip if handleClearChat is managing state directly (avoids race
          // where a batch delete triggers multiple fetches mid-operation).
          if (clearingRef.current) return;
          // Re-fetch from DB to get the accurate post-delete state.
          // This handles cases where a message is deleted by the other party.
          fetchMessages();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, hostelId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read when panel is open
  useEffect(() => {
    if (!open || !hostelId || !currentUserId) return;
    const otherRole = currentUserRole === 'admin' ? 'owner' : 'admin';
    supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('hostel_id', hostelId)
      .eq('sender_role', otherRole)
      .is('read_at', null)
      .then(() => {});
  }, [open, hostelId, currentUserId, currentUserRole, messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('hostel_id', hostelId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load messages.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const { data, error } = await supabase.from('chat_messages').insert({
        hostel_id: hostelId,
        sender_id: currentUserId,
        sender_role: currentUserRole,
        message: text,
      }).select().single();
      if (error) throw error;
      // Optimistically append the sent message so the sender sees it immediately,
      // without waiting for the real-time subscription to fire.
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (data as ChatMessage).id)) return prev;
          return [...prev, data as ChatMessage];
        });
      }
    } catch {
      setInput(text); // restore input on failure
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    setClearing(true);
    clearingRef.current = true; // suppress real-time DELETE events during bulk clear
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('hostel_id', hostelId);
      if (error) throw error;
      setMessages([]);
      toast({ title: 'Chat cleared', description: 'All messages have been deleted.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to clear chat.', variant: 'destructive' });
    } finally {
      setClearing(false);
      setClearDialogOpen(false);
      // Re-enable real-time DELETE handling after a short delay so any
      // in-flight DELETE events from the bulk clear are drained first.
      setTimeout(() => { clearingRef.current = false; }, 1000);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date, msgs: [msg] });
    }
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
            <SheetTitle className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">Chat</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    {hostelName}
                  </p>
                </div>
              </div>
              {/* Clear chat button */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 transition-colors"
                  title="Clear all messages"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
                </div>
              </div>
            ) : (
              grouped.map(({ date, msgs }) => (
                <div key={date} className="space-y-2">
                  {/* Date divider */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-muted-foreground px-2 bg-background py-0.5 rounded-full border border-border">
                      {date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {msgs.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[82%] space-y-1">
                          {!isMe && (
                            <p className="text-xs text-muted-foreground px-1 font-medium">
                              {msg.sender_role === 'admin' ? '👤 Admin' : '🏠 Owner'}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                              isMe
                                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-sm shadow-sm'
                                : 'bg-muted text-foreground rounded-bl-sm border border-border'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <p className={`text-[11px] text-muted-foreground px-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span>{formatTime(msg.created_at)}</span>
                            {isMe && (
                              <span className={msg.read_at ? 'text-primary' : 'text-muted-foreground/60'}>
                                {msg.read_at ? '✓✓' : '✓'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <form
            onSubmit={handleSend}
            className="px-4 py-4 border-t border-border flex gap-2 flex-shrink-0 bg-background"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border-2 border-border focus:border-primary/60 transition-all"
              disabled={sending}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sending}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 shadow-sm flex-shrink-0"
            >
              {sending ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Clear chat confirmation */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Clear Conversation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>all messages</strong> in this chat for both parties. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearChat}
              disabled={clearing}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {clearing ? (
                <><div className="h-3.5 w-3.5 rounded-full border-2 border-destructive-foreground/40 border-t-destructive-foreground animate-spin mr-2" />Clearing…</>
              ) : 'Clear Chat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─── Unread badge ───────────────────────────────────────────────────────────
export const ChatUnreadBadge = ({
  hostelId,
  currentUserRole,
}: {
  hostelId: string;
  currentUserRole: 'admin' | 'owner';
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const otherRole = currentUserRole === 'admin' ? 'owner' : 'admin';

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('hostel_id', hostelId)
        .eq('sender_role', otherRole)
        .is('read_at', null);
      setCount(c || 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`unread-badge-${hostelId}-${currentUserRole}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `hostel_id=eq.${hostelId}` },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hostelId, currentUserRole]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
};
