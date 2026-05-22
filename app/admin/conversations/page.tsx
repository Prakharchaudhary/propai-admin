'use client';
import { useEffect, useState } from 'react';
import { leadsApi, chatApi } from '@/lib/api';

function formatTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ConversationsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    leadsApi.getAll()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        // Only leads that came from chatbot or have a sessionId
        const withSession = arr.filter(l => l.sessionId || l.source === 'chatbot');
        setLeads(withSession);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function loadConversation(lead: any) {
    setSelected(lead);
    setConversation(null);
    if (!lead.sessionId) return;
    setLoadingChat(true);
    try {
      const data = await chatApi.getSession(lead.sessionId);
      setConversation(data);
    } catch (e) { console.error(e); } finally { setLoadingChat(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-white text-2xl font-bold">Conversations</h1>
        <p className="text-slate-400 text-sm mt-0.5">AI chat sessions from leads</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Lead list */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="text-white text-sm font-medium">{leads.length} Conversations</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="text-slate-500 text-sm text-center py-8">Loading...</div>
            ) : leads.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8 px-4">No chatbot conversations yet. Leads from your AI chatbot will appear here.</div>
            ) : leads.map(lead => (
              <button
                key={lead._id}
                onClick={() => loadConversation(lead)}
                className={`w-full text-left px-4 py-3.5 hover:bg-slate-800/30 transition ${selected?._id === lead._id ? 'bg-blue-600/10 border-r-2 border-blue-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">
                    {lead.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm font-medium truncate">{lead.name}</div>
                    <div className="text-slate-500 text-xs">{lead.phone}</div>
                  </div>
                  <div className="text-slate-600 text-xs shrink-0">{formatTime(lead.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <div className="text-slate-500 text-sm">Select a conversation to view</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold">
                  {selected.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{selected.name}</div>
                  <div className="text-slate-500 text-xs">{selected.phone} · {selected.source?.replace('_', ' ')}</div>
                </div>
                {selected.intent && (
                  <div className="ml-auto flex flex-wrap gap-2">
                    {selected.intent.configuration && (
                      <span className="text-xs px-2.5 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/20 rounded-lg">{selected.intent.configuration}</span>
                    )}
                    {selected.intent.location && (
                      <span className="text-xs px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-lg">{selected.intent.location}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingChat ? (
                  <div className="text-slate-500 text-sm text-center py-8">Loading conversation...</div>
                ) : !conversation?.messages?.length ? (
                  <div className="text-slate-500 text-sm text-center py-8">No messages in this session</div>
                ) : conversation.messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shrink-0 mt-1">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      </div>
                    )}
                    <div className={`max-w-sm lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600/25 text-blue-100 rounded-tr-sm'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                      <div className="text-xs mt-1 opacity-50">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
