import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('chat'); // This is the target_id (the other user's profile ID)
  
  const [session, setSession] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // 1. Load Session & Conversations (Matched Profiles)
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSession(session);

      const { data: matchRecords } = await supabase
        .from('matches')
        .select('target_id')
        .eq('user_id', session.user.id)
        .eq('direction', 'right');

      if (matchRecords && matchRecords.length > 0) {
        const targetIds = matchRecords.map(m => m.target_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', targetIds);
        
        if (profiles) {
          const formattedConvos = profiles.map(p => ({
            id: p.id,
            name: p.name || 'UNKNOWN USER',
            role: p.looking_for ? `Looking for ${p.looking_for}` : 'Creator',
            lastMessage: 'Tap to view chat...' // In a real app, query the latest message
          }));
          setConversations(formattedConvos);
        }
      }
    }
    loadData();
  }, []);

  // 2. Load Messages for Active Chat
  useEffect(() => {
    if (!session || !activeChatId) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeChatId}),and(sender_id.eq.${activeChatId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    }

    loadMessages();

    // 3. Realtime Subscription
    const channel = supabase.channel('realtime messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${session.user.id}`
      }, payload => {
        if (payload.new.sender_id === activeChatId) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session, activeChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session || !activeChatId) return;
    
    const msg = {
      sender_id: session.user.id,
      receiver_id: activeChatId,
      text: newMessage,
      created_at: new Date()
    };

    // Optimistic UI update
    setMessages(prev => [...prev, msg]);
    setNewMessage("");

    await supabase.from('messages').insert([msg]);
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={styles.content}
      >
        <div style={styles.header}>
          <h1 className="font-display" style={styles.title}>INBOX</h1>
        </div>

        <div style={styles.layout}>
          {/* Inbox List */}
          <div style={{...styles.inboxList, display: activeChat ? 'none' : 'flex', '@media (minWidth: 768px)': { display: 'flex' }}}>
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                style={{
                  ...styles.inboxItem,
                  background: activeChatId === conv.id ? 'var(--jelly-mint)' : 'var(--canvas-black)',
                  borderColor: activeChatId === conv.id ? 'var(--absolute-black)' : 'var(--hazard-white)'
                }}
                onClick={() => setSearchParams({ chat: conv.id })}
              >
                <div className="font-display" style={{
                  ...styles.inboxName,
                  color: activeChatId === conv.id ? 'var(--absolute-black)' : 'var(--hazard-white)'
                }}>
                  {conv.name}
                </div>
                <div className="font-mono" style={{
                  ...styles.inboxRole,
                  color: activeChatId === conv.id ? 'var(--absolute-black)' : 'var(--jelly-mint)'
                }}>
                  {conv.role}
                </div>
                <div style={{
                  ...styles.inboxMessage,
                  color: activeChatId === conv.id ? 'var(--absolute-black)' : 'var(--secondary-text)'
                }}>
                  {conv.lastMessage}
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="font-mono" style={{color: 'var(--secondary-text)'}}>NO CONVERSATIONS YET</div>
            )}
          </div>

          {/* Active Chat Area */}
          <div style={{...styles.chatArea, display: activeChat ? 'flex' : 'none', '@media (minWidth: 768px)': { display: 'flex' }}}>
            {activeChat ? (
              <>
                <div style={styles.chatHeader}>
                  <button 
                    className="font-mono" 
                    style={styles.backBtn}
                    onClick={() => setSearchParams({})}
                  >
                    ← BACK
                  </button>
                  <h2 className="font-display" style={styles.chatTitle}>{activeChat.name}</h2>
                </div>
                
                <div style={styles.chatMessages}>
                  {messages.length === 0 && (
                    <div className="font-mono" style={{margin: 'auto', color: 'var(--secondary-text)'}}>SAY HELLO!</div>
                  )}
                  {messages.map((m, i) => {
                    const isMine = m.sender_id === session?.user?.id;
                    return (
                      <div key={i} style={isMine ? styles.messageBubbleRight : styles.messageBubbleLeft}>
                        {m.text}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div style={styles.chatInputArea}>
                  <input 
                    type="text" 
                    placeholder="TYPE A MESSAGE..." 
                    className="verge-input font-mono" 
                    style={styles.chatInput}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="verge-button" style={styles.sendBtn} onClick={handleSendMessage}>SEND</button>
                </div>
              </>
            ) : (
              <div className="font-mono" style={styles.emptyChat}>
                SELECT A CONVERSATION
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '120px 24px 64px 24px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  content: {
    maxWidth: '1280px',
    height: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: 'clamp(60px, 8vw, 90px)',
    margin: 0,
    lineHeight: 0.9,
    color: 'var(--hazard-white)',
  },
  layout: {
    display: 'flex',
    flex: 1,
    gap: '24px',
    minHeight: 0, 
  },
  inboxList: {
    flex: '1 1 350px',
    maxWidth: '400px',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  inboxItem: {
    padding: '24px',
    borderRadius: 'var(--border-radius-card)',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  inboxName: {
    fontSize: '32px',
    lineHeight: 1,
    marginBottom: '8px',
  },
  inboxRole: {
    fontSize: '11px',
    marginBottom: '12px',
  },
  inboxMessage: {
    fontSize: '14px',
    lineHeight: 1.4,
  },
  chatArea: {
    flex: '2 1 0',
    border: '1px solid var(--hazard-white)',
    borderRadius: 'var(--border-radius-card)',
    flexDirection: 'column',
    background: 'var(--canvas-black)',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '24px',
    borderBottom: '1px solid var(--hazard-white)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'var(--verge-ultraviolet)',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--hazard-white)',
    cursor: 'pointer',
    fontSize: '12px',
  },
  chatTitle: {
    margin: 0,
    fontSize: '40px',
    color: 'var(--hazard-white)',
    lineHeight: 1,
  },
  chatMessages: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    background: 'var(--surface-slate)',
    color: 'var(--hazard-white)',
    padding: '16px 24px',
    borderRadius: '0 20px 20px 20px',
    maxWidth: '80%',
    lineHeight: 1.5,
    border: '1px solid var(--image-frame)',
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    background: 'var(--jelly-mint)',
    color: 'var(--absolute-black)',
    padding: '16px 24px',
    borderRadius: '20px 0 20px 20px',
    maxWidth: '80%',
    lineHeight: 1.5,
  },
  chatInputArea: {
    padding: '24px',
    borderTop: '1px solid var(--hazard-white)',
    display: 'flex',
    gap: '16px',
  },
  chatInput: {
    flex: 1,
    border: '1px solid var(--hazard-white)',
  },
  sendBtn: {
    padding: '0 32px',
  },
  emptyChat: {
    margin: 'auto',
    color: 'var(--secondary-text)',
    fontSize: '14px',
  }
};
