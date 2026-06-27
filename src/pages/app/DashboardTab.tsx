import { useEffect, useState } from 'react';
import {
    Settings, Upload, Users, ChevronRight, Plus, Trash2,
    Edit3, X, Sparkles, HardDrive, Cloud, Bell, Lock, Palette,
    Bot, Save, CheckCircle,
} from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useAppStore } from '../../stores/appStore';
import type { Agent } from '../../types';

const EMOJI_OPTIONS = ['🤖', '📊', '💼', '📢', '🎧', '📦', '⚙️', '💡', '🔍', '📋', '💰', '🛡️', '🧠', '📱', '🌐', '🎯'];
const COLOR_OPTIONS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#6366f1', '#f97316', '#0ea5e9', '#d946ef', '#84cc16'];

function Section({ title, icon: Icon, children, className = '' }: { title: string; icon: React.ElementType; children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${className}`}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <Icon className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

/* ── Agent Builder Modal ─────────────────────────────── */
function AgentBuilderModal({ onClose, onSave, editAgent }: {
    onClose: () => void;
    onSave: (agent: Partial<Agent>) => void;
    editAgent?: Agent | null;
}) {
    const [name, setName] = useState(editAgent?.name || '');
    const [description, setDescription] = useState(editAgent?.description || '');
    const [avatar, setAvatar] = useState(editAgent?.avatar || '🤖');
    const [color, setColor] = useState(editAgent?.color || '#6366f1');
    const [category, setCategory] = useState(editAgent?.category || 'General');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !description.trim()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        onSave({
            ...(editAgent ? { id: editAgent.id } : {}),
            name: name.trim(),
            description: description.trim(),
            avatar,
            color,
            category,
            status: 'online',
        });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                            {editAgent ? 'Edit Agent' : 'Build New Agent'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 py-5 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Agent Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Customer Insights Analyst"
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this agent do? What are its capabilities?"
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        >
                            {['General', 'Analytics', 'Communication', 'Marketing', 'Sales', 'Finance', 'HR', 'Support', 'Operations', 'Legal'].map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Avatar Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Avatar</label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setAvatar(emoji)}
                                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${avatar === emoji
                                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-110'
                                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Accent Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-900 dark:ring-white scale-110' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Preview</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${color}20` }}
                            >
                                {avatar}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{name || 'Agent Name'}</div>
                                <div className="text-xs text-gray-500">{category} • Online</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !description.trim() || saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {editAgent ? 'Update Agent' : 'Create Agent'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function DashboardTab() {
    const { agents, addAgent, removeAgent } = useAgentStore();
    const { theme, language } = useAppStore();
    const [loaded, setLoaded] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        setTimeout(() => setLoaded(true), 200);
    }, []);

    const handleCreateAgent = (config: Partial<Agent>) => {
        const newAgent: Agent = {
            id: config.id || `custom-${Date.now()}`,
            name: config.name || 'New Agent',
            avatar: config.avatar || '🤖',
            color: config.color || '#6366f1',
            description: config.description || '',
            status: 'online',
            category: config.category,
        };
        addAgent(newAgent);
        setShowBuilder(false);
        setEditingAgent(null);
        setToast(`${newAgent.name} created successfully!`);
        setTimeout(() => setToast(null), 3000);
    };

    const handleDelete = (agent: Agent) => {
        removeAgent(agent.id);
        setToast(`${agent.name} removed.`);
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="h-full overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
                {/* Header */}
                <div className={`transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                        {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your workspace, agents, and settings</p>
                </div>

                {/* Quick Stats */}
                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-500 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {[
                        { label: 'Active Agents', value: agents.filter((a) => a.status === 'online').length, icon: Bot, color: 'text-blue-500' },
                        { label: 'Total Agents', value: agents.length, icon: Users, color: 'text-purple-500' },
                        { label: 'Storage Used', value: '2.4 GB', icon: HardDrive, color: 'text-green-500' },
                        { label: 'API Calls Today', value: '1,247', icon: Cloud, color: 'text-amber-500' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Agent Management */}
                <div className={`transition-all duration-500 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <Section title="Agent Management" icon={Bot}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500">Your active AI agents</p>
                            <button
                                onClick={() => { setEditingAgent(null); setShowBuilder(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5" /> Build New Agent
                            </button>
                        </div>

                        <div className="space-y-2">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                        style={{ backgroundColor: `${agent.color}15` }}
                                    >
                                        {agent.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{agent.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{agent.description}</div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${agent.status === 'online'
                                        ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                                        : agent.status === 'busy'
                                            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500'
                                        }`}>
                                        {agent.status}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingAgent(agent); setShowBuilder(true); }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(agent)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {agents.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Bot className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No agents yet. Create your first one!</p>
                                </div>
                            )}
                        </div>
                    </Section>
                </div>

                {/* Data & Settings */}
                <div className={`grid lg:grid-cols-2 gap-6 transition-all duration-500 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <Section title="Data Management" icon={Upload}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Upload className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Upload Documents</div>
                                        <div className="text-xs text-gray-500">PDF, CSV, Excel files</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Cloud className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Cloud Sync</div>
                                        <div className="text-xs text-gray-500">Last synced: 2 min ago</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </Section>

                    <Section title="Settings" icon={Settings}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Palette className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Theme</div>
                                        <div className="text-xs text-gray-500 capitalize">{theme} Mode</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Notifications</div>
                                        <div className="text-xs text-gray-500">Push & Email alerts</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Security</div>
                                        <div className="text-xs text-gray-500">API keys & permissions</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Agent Builder Modal */}
            {showBuilder && (
                <AgentBuilderModal
                    editAgent={editingAgent}
                    onClose={() => { setShowBuilder(false); setEditingAgent(null); }}
                    onSave={handleCreateAgent}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white shadow-xl shadow-green-500/25 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
