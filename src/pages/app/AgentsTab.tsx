import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    Send, Paperclip, Mic, Phone, PhoneOff, MicOff, Volume2,
    MoreVertical, Search, Plus, Wrench, Bot, X,
    Image, FileText, Camera, Trash2, Info, BellOff, CheckSquare, FolderPlus,
} from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import type { Agent, Message } from '../../types';

function AgentAvatar({ agent, size = 'md' }: { agent: Agent; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
    const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-lg', lg: 'w-12 h-12 text-xl', xl: 'w-20 h-20 text-4xl' };
    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: `${agent.color}20` }}
        >
            {agent.avatar}
        </div>
    );
}

function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = { online: 'bg-green-500', busy: 'bg-amber-500', offline: 'bg-gray-400' };
    return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.offline} ring-2 ring-white dark:ring-gray-900`} />;
}

import { api } from '../../services/api';

function ChatBubble({ message, agent }: { message: Message; agent: Agent | null }) {
    const isUser = message.type === 'user';
    const isTool = message.type === 'tool_execution';
    const [actionStatus, setActionStatus] = useState<'pending' | 'approved' | 'denied' | 'error'>('pending');
    const [actionMessage, setActionMessage] = useState('');

    if (isTool) {
        return (
            <div className="flex justify-center my-3 px-4 animate-fade-in">
                <div className="chat-bubble-tool flex items-start gap-2 text-sm">
                    <Wrench className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                        <div className="font-medium text-amber-800 dark:text-amber-300 text-xs mb-0.5">
                            {message.tool?.replace(/_/g, ' ')?.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{message.content}</div>
                    </div>
                </div>
            </div>
        );
    }

    // Check for approval token
    const approvalMatch = !isUser ? message.content.match(/approve ([a-zA-Z0-9]{8})/) : null;
    const approvalToken = approvalMatch ? approvalMatch[1] : null;

    const handleApprove = async () => {
        if (!approvalToken) return;
        const res = await api.approveAction(approvalToken);
        if (res.status === 'executed' || res.status === 'approved') {
            setActionStatus('approved');
            setActionMessage((res.message as string) || 'Action approved and executed.');
        } else {
            setActionStatus('error');
            setActionMessage((res.message as string) || 'Failed to approve action.');
        }
    };

    const handleDeny = async () => {
        if (!approvalToken) return;
        const res = await api.denyAction(approvalToken);
        if (res.status === 'denied') {
            setActionStatus('denied');
            setActionMessage((res.message as string) || 'Action denied.');
        } else {
            setActionStatus('error');
            setActionMessage((res.message as string) || 'Failed to deny action.');
        }
    };

    // Replace the raw "Reply approve..." string with a cleaner version if we are showing buttons
    let displayContent = message.content;
    if (approvalToken) {
        displayContent = displayContent.replace(/Reply \*\*"approve [a-zA-Z0-9]{8}"\*\* to allow, or \*\*"deny [a-zA-Z0-9]{8}"\*\* to cancel\./g, '');
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4 animate-slide-up`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                {!isUser && agent && <AgentAvatar agent={agent} size="sm" />}
                <div>
                    <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-agent'}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <>
                                <div className="text-sm leading-relaxed agent-markdown">
                                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                                </div>
                                {approvalToken && actionStatus === 'pending' && (
                                    <div className="mt-3 flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <button onClick={handleApprove} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-sm">
                                            Approve Action
                                        </button>
                                        <button onClick={handleDeny} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors shadow-sm">
                                            Deny
                                        </button>
                                    </div>
                                )}
                                {approvalToken && actionStatus !== 'pending' && (
                                    <div className={`mt-3 text-xs font-medium p-2.5 rounded-lg border ${
                                        actionStatus === 'approved' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' :
                                        actionStatus === 'denied' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' :
                                        'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'
                                    }`}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {actionStatus === 'approved' ? '✅ Action Executed' : actionStatus === 'denied' ? '❌ Action Denied' : '⚠️ Error'}
                                        </div>
                                        <div className="opacity-80 text-[11px] leading-snug">{actionMessage}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className={`text-[10px] text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left ml-1'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Attachment Menu ────────────────────────────────────── */
function AttachmentMenu({ onFileSelect, onClose }: { onFileSelect: (file: File) => void; onClose: () => void }) {
    const photoRef = useRef<HTMLInputElement>(null);
    const docRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            onClose();
        }
    };

    return (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] animate-slide-up z-50">
            <button
                onClick={() => photoRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                Photos & Videos
            </button>
            <input ref={photoRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

            <button
                onClick={() => docRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Documents
            </button>
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.csv,.xlsx,.xls,.txt" className="hidden" onChange={handleFile} />

            <button
                onClick={() => cameraRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                Camera
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </div>
    );
}

/* ── Three-Dot Options Menu ────────────────────────────── */
function AgentOptionsMenu({ agent, onClose }: { agent: Agent; onClose: () => void }) {
    const { clearChatHistory, removeAgent } = useAgentStore();

    return (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-1.5 min-w-[180px] animate-fade-in z-50">
            <button
                onClick={() => { clearChatHistory(agent.id); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <Trash2 className="w-4 h-4 text-gray-400" /> Clear Chat
            </button>
            <button
                onClick={onClose}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <Info className="w-4 h-4 text-gray-400" /> Agent Info
            </button>
            <button
                onClick={onClose}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <BellOff className="w-4 h-4 text-gray-400" /> Mute
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button
                onClick={() => { removeAgent(agent.id); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
                <Trash2 className="w-4 h-4" /> Delete Agent
            </button>
        </div>
    );
}

/* ── Call UI Overlay ───────────────────────────────────── */
function CallOverlay({ agent, onEnd }: { agent: Agent; onEnd: () => void }) {
    const [elapsed, setElapsed] = useState(0);
    const [muted, setMuted] = useState(false);
    const [speaker, setSpeaker] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center text-white animate-fade-in">
            {/* Pulsing ring */}
            <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: agent.color, margin: '-12px' }} />
                <AgentAvatar agent={agent} size="xl" />
            </div>

            <h2 className="text-2xl font-heading font-bold mb-1">{agent.name}</h2>
            <p className="text-gray-400 text-sm mb-2">Voice Call</p>
            <p className="text-lg font-mono text-green-400 mb-12">{formatTime(elapsed)}</p>

            <div className="flex items-center gap-6">
                <button
                    onClick={() => setMuted(!muted)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                    onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all"
                >
                    <PhoneOff className="w-7 h-7" />
                </button>
                <button
                    onClick={() => setSpeaker(!speaker)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${speaker ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Volume2 className="w-6 h-6" />
                </button>
            </div>

            <p className="text-xs text-gray-600 mt-8">Voice assistant coming soon</p>
        </div>
    );
}

/* ── Group Dialog ──────────────────────────────────────── */
function GroupDialog({ agentIds, onClose }: { agentIds: string[]; onClose: () => void }) {
    const [groupName, setGroupName] = useState('');
    const { createGroup } = useAgentStore();

    const handleCreate = () => {
        if (groupName.trim()) {
            createGroup(groupName.trim(), agentIds);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-4">Create Agent Group</h3>
                <p className="text-sm text-gray-500 mb-3">{agentIds.length} agents selected</p>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 mb-4"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={!groupName.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-all">
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function AgentsTab() {
    const {
        agents, currentAgent, chatHistory, agentGroups, loading, sendingMessage,
        fetchAgents, setCurrentAgent, sendMessage, sendMessageWithFile,
    } = useAgentStore();
    const { language } = useAppStore();

    const [input, setInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showCallUI, setShowCallUI] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Grouping
    const [selectMode, setSelectMode] = useState(false);
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
    const [showGroupDialog, setShowGroupDialog] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    // Auto-select agent from URL params (e.g. from Business tab recommendations)
    useEffect(() => {
        const agentParam = searchParams.get('agent');
        if (agentParam && agents.length > 0) {
            const agent = agents.find((a) => a.id === agentParam);
            if (agent) {
                setCurrentAgent(agent);
                setShowSidebar(false);
                setSearchParams({}, { replace: true });
            }
        }
    }, [agents, searchParams, setCurrentAgent, setSearchParams]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, currentAgent]);

    const handleSend = () => {
        if (!currentAgent) return;
        if (selectedFile) {
            sendMessageWithFile(input.trim() || 'Please analyse this file.', selectedFile);
            setSelectedFile(null);
            setInput('');
            return;
        }
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput('');
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setShowAttachMenu(false);
    };

    const toggleSelectAgent = (agentId: string) => {
        setSelectedAgentIds((prev) => {
            const next = new Set(prev);
            if (next.has(agentId)) next.delete(agentId);
            else next.add(agentId);
            return next;
        });
    };

    const currentMessages = currentAgent ? chatHistory[currentAgent.id] || [] : [];
    const filteredAgents = agents.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Organize agents by groups
    const ungroupedAgents = filteredAgents.filter((a) => !a.groupId);
    const groupedAgentMap: Record<string, Agent[]> = {};
    for (const group of agentGroups) {
        groupedAgentMap[group.id] = filteredAgents.filter((a) => a.groupId === group.id);
    }

    return (
        <div className="h-full flex">
            {/* Call Overlay */}
            {showCallUI && currentAgent && (
                <CallOverlay agent={currentAgent} onEnd={() => setShowCallUI(false)} />
            )}

            {/* Group Dialog */}
            {showGroupDialog && (
                <GroupDialog
                    agentIds={Array.from(selectedAgentIds)}
                    onClose={() => { setShowGroupDialog(false); setSelectMode(false); setSelectedAgentIds(new Set()); }}
                />
            )}

            {/* ── Sidebar ────────────────────────────────────── */}
            <div
                className={`${showSidebar ? 'flex' : 'hidden lg:flex'
                    } flex-col w-full lg:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                            {language === 'hi' ? 'एजेंट्स' : 'Agents'}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setSelectMode(!selectMode); setSelectedAgentIds(new Set()); }}
                                className={`p-2 rounded-lg transition-colors ${selectMode ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                title="Select agents to group"
                            >
                                <CheckSquare className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={language === 'hi' ? 'एजेंट खोजें...' : 'Search agents...'}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        />
                    </div>
                </div>

                {/* Agent List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <div className="skeleton w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-32 mb-2" />
                                    <div className="skeleton h-3 w-48" />
                                </div>
                            </div>
                        ))
                        : (
                            <>
                                {/* Grouped agents */}
                                {agentGroups.map((group) => {
                                    const groupAgents = groupedAgentMap[group.id] || [];
                                    if (groupAgents.length === 0) return null;
                                    return (
                                        <div key={group.id}>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                                                <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{group.name}</span>
                                                <span className="text-[10px] text-gray-400 ml-auto">{groupAgents.length}</span>
                                            </div>
                                            {groupAgents.map((agent) => (
                                                <AgentListItem
                                                    key={agent.id}
                                                    agent={agent}
                                                    isActive={currentAgent?.id === agent.id}
                                                    selectMode={selectMode}
                                                    isSelected={selectedAgentIds.has(agent.id)}
                                                    onSelect={() => toggleSelectAgent(agent.id)}
                                                    onClick={() => { setCurrentAgent(agent); setShowSidebar(false); }}
                                                    indent
                                                />
                                            ))}
                                        </div>
                                    );
                                })}at

                                {/* Ungrouped agents */}
                                {ungroupedAgents.map((agent) => (
                                    <AgentListItem
                                        key={agent.id}
                                        agent={agent}
                                        isActive={currentAgent?.id === agent.id}
                                        selectMode={selectMode}
                                        isSelected={selectedAgentIds.has(agent.id)}
                                        onSelect={() => toggleSelectAgent(agent.id)}
                                        onClick={() => { setCurrentAgent(agent); setShowSidebar(false); }}
                                    />
                                ))}
                            </>
                        )}
                </div>

                {/* Floating Group Button */}
                {selectMode && selectedAgentIds.size >= 2 && (
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setShowGroupDialog(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                            <FolderPlus className="w-4 h-4" />
                            Group {selectedAgentIds.size} Agents
                        </button>
                    </div>
                )}
            </div>

            {/* ── Chat Area ───────────────────────────────────── */}
            <div
                className={`${!showSidebar ? 'flex' : 'hidden lg:flex'
                    } flex-col flex-1 bg-gray-50 dark:bg-gray-950`}
            >
                {currentAgent ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <AgentAvatar agent={currentAgent} />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{currentAgent.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    <StatusDot status={currentAgent.status} />
                                    <span className="text-xs text-gray-500 capitalize">{currentAgent.status}</span>
                                    {currentAgent.model && (
                                        <span className="text-xs text-gray-400 ml-2">• {currentAgent.model}</span>
                                    )}
                                </div>
                            </div>
                            {/* Call Button */}
                            <button
                                onClick={() => setShowCallUI(true)}
                                className="p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                                title="Voice Call"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                            {/* Three-dot menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {showOptionsMenu && (
                                    <AgentOptionsMenu agent={currentAgent} onClose={() => setShowOptionsMenu(false)} />
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin py-4" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                            backgroundSize: '20px 20px',
                        }}>
                            {currentMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ backgroundColor: `${currentAgent.color}15` }}>
                                        {currentAgent.avatar}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{currentAgent.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{currentAgent.description}</p>
                                    <p className="text-xs text-gray-400 mt-2">Send a message to get started</p>
                                    {currentAgent.id === 'data-001' && (
                                        <div className="mt-4 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">🟢 Connected to AI Backend</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {currentMessages.map((msg) => (
                                <ChatBubble key={msg.id} message={msg} agent={currentAgent} />
                            ))}
                            {sendingMessage && (
                                <div className="flex justify-start mb-3 px-4">
                                    <div className="flex items-end gap-2">
                                        <AgentAvatar agent={currentAgent} size="sm" />
                                        <div className="chat-bubble-agent flex gap-1 py-3">
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* File Preview */}
                        {selectedFile && (
                            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-blue-700 dark:text-blue-300 truncate flex-1">{selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                    <X className="w-4 h-4 text-blue-500" />
                                </button>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-end gap-2">
                                {/* Attachment */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                        className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    {showAttachMenu && (
                                        <AttachmentMenu
                                            onFileSelect={handleFileSelect}
                                            onClose={() => setShowAttachMenu(false)}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder={language === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
                                        rows={1}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                                        style={{ minHeight: 40, maxHeight: 120 }}
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() && !selectedFile}
                                    className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center px-6">
                            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-5">
                                <Bot className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-heading font-bold text-gray-700 dark:text-gray-200 mb-2">
                                {language === 'hi' ? 'एजेंट चुनें' : 'Select an Agent'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                {language === 'hi'
                                    ? 'बातचीत शुरू करने के लिए बाईं ओर से एजेंट चुनें'
                                    : 'Choose an agent from the sidebar to start a conversation'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Click-away overlay for menus */}
            {(showAttachMenu || showOptionsMenu) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowAttachMenu(false); setShowOptionsMenu(false); }} />
            )}
        </div>
    );
}

/* ── Agent List Item (extracted for grouping support) ─── */
function AgentListItem({ agent, isActive, selectMode, isSelected, onSelect, onClick, indent }: {
    agent: Agent;
    isActive: boolean;
    selectMode: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onClick: () => void;
    indent?: boolean;
}) {
    return (
        <button
            onClick={selectMode ? onSelect : onClick}
            className={`w-full flex items-center gap-3 p-4 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${isActive ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                } ${indent ? 'pl-8' : ''}`}
        >
            {selectMode && (
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
            )}
            <div className="relative">
                <AgentAvatar agent={agent} />
                <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={agent.status} />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {agent.name}
                    </span>
                    {agent.timestamp && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(agent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {agent.lastMessage || agent.description}
                </p>
            </div>
        </button>
    );
}
