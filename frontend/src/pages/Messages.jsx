import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Send, Paperclip, Image as ImageIcon, X, File, Camera, Headphones, User, List, Calendar, Sticker } from 'lucide-react';

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('chat'); 
  
  const [session, setSession] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [fileType, setFileType] = useState('image/*');
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Load Session & Conversations
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSession(session);

      const { data: mySwipes } = await supabase
        .from('matches')
        .select('target_id')
        .eq('user_id', session.user.id)
        .eq('direction', 'right');

      const { data: theirSwipes } = await supabase
        .from('matches')
        .select('user_id')
        .eq('target_id', session.user.id)
        .eq('direction', 'right');

      const myTargets = mySwipes?.map(m => m.target_id) || [];
      const whoSwipedMe = theirSwipes?.map(m => m.user_id) || [];
      
      const mutualTargetIds = myTargets.filter(id => whoSwipedMe.includes(id));

      const dummyUser = {
        id: 'dummy-user-123',
        name: 'Alice (Test)',
        role: 'UI/UX Designer',
        lastMessage: 'Tap to view chat...',
        avatar: 'https://ui-avatars.com/api/?name=Alice&background=3cffd0&color=000'
      };

      let formattedConvos = [dummyUser]; // Always start with dummy user for testing

      if (mutualTargetIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', mutualTargetIds);
        
        if (profiles) {
          const dbConvos = profiles.map(p => ({
            id: p.id,
            name: p.name || 'UNKNOWN USER',
            role: p.looking_for ? `Looking for ${p.looking_for}` : 'Creator',
            lastMessage: 'Tap to view chat...',
            avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=random`
          }));
          formattedConvos = [...formattedConvos, ...dbConvos];
        }
      }
      
      setConversations(formattedConvos);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content = newMessage, metadata = null) => {
    if (!content.trim() && !metadata) return;
    
    const msg = {
      sender_id: session.user.id,
      receiver_id: activeChatId,
      content: content,
      metadata: metadata,
      created_at: new Date()
    };

    setMessages(prev => [...prev, msg]);
    if (content === newMessage) setNewMessage("");

    await supabase.from('messages').insert([msg]);
  };

  const handleFileUpload = async (file, type = 'image') => {
    if (!file || !session) return;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      let contentPrefix = '';
      if (type === 'image') contentPrefix = '[IMAGE]';
      else if (type === 'audio') contentPrefix = '[AUDIO]';
      else contentPrefix = '[DOCUMENT]';

      await handleSendMessage(`${contentPrefix}${publicUrl}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please make sure the media bucket is configured.');
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (activeChatId) setIsDragging(true);
  }, [activeChatId]);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!activeChatId) return;
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, 'image');
    }
  }, [activeChatId, session]);

  const activeChat = conversations.find(c => c.id === activeChatId);

  const renderMessageContent = (msg) => {
    const text = msg.content || msg.text || '';
    if (text.startsWith('[IMAGE]')) {
      const url = text.replace('[IMAGE]', '');
      return <img src={url} alt="Attachment" style={styles.messageImage} />;
    }
    if (text.startsWith('[AUDIO]')) {
      const url = text.replace('[AUDIO]', '');
      return <audio controls src={url} style={{maxWidth: '220px'}} />;
    }
    if (text.startsWith('[DOCUMENT]')) {
      const url = text.replace('[DOCUMENT]', '');
      return <a href={url} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>📎 Download Document</a>;
    }
    if (text.startsWith('[STICKER]')) {
      const url = text.replace('[STICKER]', '');
      return <img src={url} alt="Sticker" style={{width: '100px', height: '100px'}} />;
    }
    
    if (msg.metadata?.type === 'poll') {
      return (
        <div style={styles.pollCard}>
          <strong>📊 {msg.metadata.question}</strong>
          {msg.metadata.options.map((opt, i) => (
            <div key={i} style={styles.pollOption}>{opt}</div>
          ))}
        </div>
      );
    }
    if (msg.metadata?.type === 'event') {
      return (
        <div style={styles.eventCard}>
          <strong>📅 {msg.metadata.title}</strong>
          <div>{msg.metadata.date}</div>
        </div>
      );
    }

    return <span style={{ wordBreak: 'break-word' }}>{text}</span>;
  };

  const attachmentOptions = [
    { id: 'doc', label: 'Document', icon: File, color: '#7f66ff' },
    { id: 'photo', label: 'Photos & videos', icon: ImageIcon, color: '#007bfc' },
    { id: 'camera', label: 'Camera', icon: Camera, color: '#ff2e74' },
    { id: 'audio', label: 'Audio', icon: Headphones, color: '#ff8a00' },
    { id: 'contact', label: 'Contact', icon: User, color: '#009de2' },
    { id: 'poll', label: 'Poll', icon: List, color: '#00bfa5' },
    { id: 'event', label: 'Event', icon: Calendar, color: '#889eb2' },
    { id: 'sticker', label: 'New sticker', icon: Sticker, color: '#00e676' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.glassContainer}>
        {/* Sidebar */}
        <div className={`sidebar ${activeChat ? 'active-chat' : ''}`} style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h1 className="font-display" style={styles.title}>CHATS</h1>
          </div>
          
          <div style={styles.inboxList}>
            <AnimatePresence>
              {conversations.map((conv, i) => (
                <motion.div 
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    ...styles.inboxItem,
                    background: activeChatId === conv.id ? 'rgba(60, 255, 208, 0.1)' : 'transparent',
                    borderLeft: activeChatId === conv.id ? '4px solid var(--jelly-mint)' : '4px solid transparent'
                  }}
                  onClick={() => setSearchParams({ chat: conv.id })}
                >
                  <img src={conv.avatar} alt={conv.name} style={styles.avatar} />
                  <div style={styles.inboxItemContent}>
                    <div className="font-sans" style={{...styles.inboxName, color: activeChatId === conv.id ? 'var(--jelly-mint)' : 'var(--hazard-white)'}}>
                      {conv.name}
                    </div>
                    <div style={styles.inboxMessage}>
                      {conv.lastMessage}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {conversations.length === 0 && (
              <div className="font-mono" style={{color: 'var(--secondary-text)', padding: '24px', textAlign: 'center'}}>
                NO MATCHES YET.<br/><br/>SWIPE TO CONNECT!
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div 
          className={`chat-area ${activeChat ? 'active-chat' : ''}`}
          style={styles.chatArea}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Animated Background */}
          <div style={styles.animatedBg}>
            <div style={{...styles.blob, top: '10%', left: '20%', animationDelay: '0s'}} />
            <div style={{...styles.blob, bottom: '20%', right: '10%', animationDelay: '2s'}} />
          </div>

          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.dragOverlay}
              >
                <div style={styles.dragContent}>
                  <ImageIcon size={48} color="var(--jelly-mint)" />
                  <h2 className="font-display">DROP IMAGE HERE</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeChat ? (
            <>
              <div style={styles.chatHeader}>
                <button 
                  className="font-mono" 
                  style={styles.backBtn}
                  onClick={() => setSearchParams({})}
                >
                  ←
                </button>
                <img src={activeChat.avatar} alt={activeChat.name} style={styles.headerAvatar} />
                <div>
                  <h2 className="font-sans" style={styles.chatTitle}>{activeChat.name}</h2>
                  <div className="font-mono" style={styles.chatSubtitle}>{activeChat.role}</div>
                </div>
              </div>
              
              <div style={styles.chatMessages}>
                {messages.length === 0 && (
                  <div className="font-mono" style={{margin: 'auto', color: 'var(--secondary-text)', zIndex: 1}}>SAY HELLO TO {activeChat.name}!</div>
                )}
                {messages.map((m, i) => {
                  const isMine = m.sender_id === session?.user?.id;
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        ...(isMine ? styles.messageBubbleRight : styles.messageBubbleLeft),
                        background: isMine ? 'var(--jelly-mint)' : 'rgba(255, 255, 255, 0.05)',
                        color: isMine ? 'var(--absolute-black)' : 'var(--hazard-white)',
                        border: isMine ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {renderMessageContent(m)}
                    </motion.div>
                  );
                })}
                {uploading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{...styles.messageBubbleRight, background: 'var(--jelly-mint)', color: 'var(--absolute-black)'}}
                  >
                    Uploading image...
                  </motion.div>
                )}
                <div ref={messagesEndRef} style={{height: '1px'}} />
              </div>

              <div style={{...styles.chatInputArea, position: 'relative'}}>
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      style={styles.attachmentMenu}
                    >
                      {attachmentOptions.map(opt => (
                        <div 
                          key={opt.id}
                          style={styles.menuItem}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            if (opt.id === 'photo') {
                              setFileType('image/*');
                              setTimeout(() => fileInputRef.current?.click(), 0);
                            } else if (opt.id === 'doc') {
                              setFileType('.pdf,.doc,.docx,.txt');
                              setTimeout(() => fileInputRef.current?.click(), 0);
                            } else if (opt.id === 'audio') {
                              setFileType('audio/*');
                              setTimeout(() => fileInputRef.current?.click(), 0);
                            } else if (opt.id === 'poll') {
                              setShowPollModal(true);
                            } else if (opt.id === 'event') {
                              setShowEventModal(true);
                            } else if (opt.id === 'sticker') {
                              handleSendMessage('[STICKER]https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMThjczNsdDBwYnc2M24zbHVrcTFrbnYwaGVweWY5cmU0cnJyeTVkZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MDxuzRvxF39V6/giphy.gif');
                            } else {
                              alert("Coming soon!");
                            }
                            setShowAttachmentMenu(false);
                          }}
                        >
                          <div style={{ color: opt.color }}>
                            <opt.icon size={20} />
                          </div>
                          <span className="font-sans">{opt.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={styles.inputWrapper}>
                  <button 
                    style={styles.iconBtn} 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    title="Attach"
                  >
                    <Paperclip size={20} color="var(--secondary-text)" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept={fileType}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        let type = 'doc';
                        if (fileType.includes('image')) type = 'image';
                        if (fileType.includes('audio')) type = 'audio';
                        handleFileUpload(e.target.files[0], type);
                      }
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="font-sans" 
                    style={styles.chatInput}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    style={{
                      ...styles.sendBtn,
                      background: newMessage.trim() ? 'var(--jelly-mint)' : 'rgba(255, 255, 255, 0.1)',
                      color: newMessage.trim() ? 'var(--absolute-black)' : 'var(--secondary-text)'
                    }} 
                    onClick={() => handleSendMessage()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            {showPollModal && (
              <div style={styles.dragOverlay}>
                <div style={{...styles.dragContent, background: '#202c33', padding: '24px', borderRadius: '16px', minWidth: '300px'}}>
                  <h3 style={{margin: '0 0 16px 0'}}>Create Poll</h3>
                  <input style={{...styles.chatInput, borderBottom: '1px solid rgba(255,255,255,0.2)'}} placeholder="Question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                  <input style={{...styles.chatInput, borderBottom: '1px solid rgba(255,255,255,0.2)'}} placeholder="Options (comma separated)" value={pollOptions} onChange={e => setPollOptions(e.target.value)} />
                  <div style={{display: 'flex', gap: '12px', marginTop: '16px', width: '100%', justifyContent: 'flex-end'}}>
                    <button style={{...styles.iconBtn, color: '#fff'}} onClick={() => setShowPollModal(false)}>Cancel</button>
                    <button style={{...styles.iconBtn, background: 'var(--jelly-mint)', color: '#000', padding: '8px 16px', borderRadius: '16px', width: 'auto'}} onClick={() => {
                      handleSendMessage('', { type: 'poll', question: pollQuestion, options: pollOptions.split(',').map(o=>o.trim()) });
                      setShowPollModal(false);
                    }}>Send</button>
                  </div>
                </div>
              </div>
            )}
            
            {showEventModal && (
              <div style={styles.dragOverlay}>
                <div style={{...styles.dragContent, background: '#202c33', padding: '24px', borderRadius: '16px', minWidth: '300px'}}>
                  <h3 style={{margin: '0 0 16px 0'}}>Create Event</h3>
                  <input style={{...styles.chatInput, borderBottom: '1px solid rgba(255,255,255,0.2)'}} placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} />
                  <input type="datetime-local" style={{...styles.chatInput, borderBottom: '1px solid rgba(255,255,255,0.2)'}} value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  <div style={{display: 'flex', gap: '12px', marginTop: '16px', width: '100%', justifyContent: 'flex-end'}}>
                    <button style={{...styles.iconBtn, color: '#fff'}} onClick={() => setShowEventModal(false)}>Cancel</button>
                    <button style={{...styles.iconBtn, background: 'var(--jelly-mint)', color: '#000', padding: '8px 16px', borderRadius: '16px', width: 'auto'}} onClick={() => {
                      handleSendMessage('', { type: 'event', title: eventTitle, date: new Date(eventDate).toLocaleString() });
                      setShowEventModal(false);
                    }}>Send</button>
                  </div>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="font-mono" style={styles.emptyChat}>
              <div style={styles.emptyChatCircle}>
                <Send size={32} color="var(--jelly-mint)" />
              </div>
              <div>SELECT A CHAT TO START MESSAGING</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blobBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .sidebar {
          display: flex;
        }
        .chat-area {
          display: flex;
        }
        @media (max-width: 768px) {
          .sidebar.active-chat {
            display: none !important;
          }
          .chat-area.active-chat {
            display: flex !important;
          }
          .chat-area:not(.active-chat) {
            display: none !important;
          }
          .sidebar:not(.active-chat) {
            width: 100% !important;
            border-right: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    padding: '80px 24px 24px 24px', // Space for navbar
    background: 'var(--canvas-black)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box'
  },
  glassContainer: {
    width: '100%',
    maxWidth: '1200px',
    height: '100%',
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(20px)',
  },
  sidebar: {
    width: '350px',
    minWidth: '300px',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.2)',
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: '32px',
    margin: 0,
    color: 'var(--hazard-white)',
  },
  inboxList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  inboxItem: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255, 255, 255, 0.1)'
  },
  inboxItemContent: {
    flex: 1,
    overflow: 'hidden'
  },
  inboxName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  inboxMessage: {
    fontSize: '14px',
    color: 'var(--secondary-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatArea: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
    background: 'rgba(0, 0, 0, 0.4)',
  },
  animatedBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
    pointerEvents: 'none'
  },
  blob: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(60,255,208,0.05) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    animation: 'blobBounce 10s infinite ease-in-out',
  },
  dragOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px dashed var(--jelly-mint)',
    margin: '16px',
    borderRadius: '16px'
  },
  dragContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    color: 'var(--hazard-white)'
  },
  chatHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(10px)',
    zIndex: 10
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--hazard-white)',
    cursor: 'pointer',
    fontSize: '24px',
    display: 'none', // Hide on desktop, would show on mobile in responsive layout
  },
  headerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  chatTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'var(--hazard-white)',
  },
  chatSubtitle: {
    fontSize: '12px',
    color: 'var(--secondary-text)',
    marginTop: '2px'
  },
  chatMessages: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    padding: '12px 18px',
    borderRadius: '18px 18px 18px 4px',
    maxWidth: '70%',
    fontSize: '15px',
    lineHeight: 1.5,
    fontFamily: 'var(--font-sans)',
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    padding: '12px 18px',
    borderRadius: '18px 18px 4px 18px',
    maxWidth: '70%',
    fontSize: '15px',
    lineHeight: 1.5,
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 4px 12px rgba(60, 255, 208, 0.1)'
  },
  messageImage: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginTop: '4px'
  },
  chatInputArea: {
    padding: '20px 24px',
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    zIndex: 10
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    padding: '8px 16px',
    transition: 'border-color 0.3s ease'
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s'
  },
  chatInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--hazard-white)',
    fontSize: '15px',
    outline: 'none',
    padding: '8px 0',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyChat: {
    margin: 'auto',
    color: 'var(--secondary-text)',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    zIndex: 1
  },
  emptyChatCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid rgba(60, 255, 208, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(60, 255, 208, 0.05)'
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: '70px',
    left: '24px',
    background: '#233138',
    borderRadius: '16px',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    width: '240px'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 24px',
    cursor: 'pointer',
    color: '#d1d7db',
    fontSize: '15px',
    transition: 'background 0.2s',
  },
  pollCard: {
    background: 'rgba(0,0,0,0.2)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '200px'
  },
  pollOption: {
    background: 'rgba(255,255,255,0.1)',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  eventCard: {
    background: 'rgba(0,0,0,0.2)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px'
  }
};

