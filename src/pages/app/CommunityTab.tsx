import { useEffect, useState } from 'react';
import {
    Search, Star, Download, Plus, Check, Filter, Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAgentStore } from '../../stores/agentStore';
import type { MarketplaceAgent, Agent } from '../../types';

export default function CommunityTab() {
    const [marketplaceAgents, setMarketplaceAgents] = useState<MarketplaceAgent[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<string | null>(null);

    const { agents, addAgent } = useAgentStore();

    useEffect(() => {
        Promise.all([api.getMarketplaceAgents(), api.getCategories()]).then(([a, c]) => {
            setMarketplaceAgents(a);
            setCategories(c);
            setTimeout(() => setLoaded(true), 200);
        });
    }, []);

    // Track already-added agents
    useEffect(() => {
        const ids = new Set(agents.map((a) => a.id));
        setAddedIds(ids);
    }, [agents]);

    const handleAdd = (mpAgent: MarketplaceAgent) => {
        const newAgent: Agent = {
            id: mpAgent.id,
            name: mpAgent.name,
            avatar: mpAgent.avatar,
            color: mpAgent.color,
            description: mpAgent.description,
            status: 'online',
            category: mpAgent.category,
            creator: mpAgent.creator,
        };
        addAgent(newAgent);
        setAddedIds((prev) => new Set(prev).add(mpAgent.id));
        setToast(`${mpAgent.name} added to your workspace!`);
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = marketplaceAgents.filter((a) => {
        const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.description.toLowerCase().includes(search.toLowerCase()) ||
            a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = !selectedCategory || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const featured = filtered.filter((a) => a.featured);
    const regular = filtered.filter((a) => !a.featured);

    return (
        <div className="h-full overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-gray-950">
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-8">
                {/* Header */}
                <div className={`transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white">Agent Marketplace</h1>
                            <p className="text-sm text-gray-500">Discover and add specialized AI agents to your workspace</p>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search agents, categories, or tags..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${!selectedCategory
                                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } border border-gray-200 dark:border-gray-700`}
                        >
                            <Filter className="w-3 h-3 inline mr-1" />All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    } border border-gray-200 dark:border-gray-700`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Section */}
                {featured.length > 0 && (
                    <div className={`transition-all duration-500 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">⭐ Featured</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {featured.map((agent) => (
                                <AgentCard key={agent.id} agent={agent} isAdded={addedIds.has(agent.id)} onAdd={handleAdd} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Agents */}
                <div className={`transition-all duration-500 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        All Agents ({filtered.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(regular.length > 0 ? regular : filtered).map((agent) => (
                            <AgentCard key={agent.id} agent={agent} isAdded={addedIds.has(agent.id)} onAdd={handleAdd} />
                        ))}
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg mb-1">No agents found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white shadow-xl shadow-green-500/25 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}

function AgentCard({ agent, isAdded, onAdd }: { agent: MarketplaceAgent; isAdded: boolean; onAdd: (a: MarketplaceAgent) => void }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm card-hover transition-all duration-300">
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${agent.color}15` }}
                >
                    {agent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{agent.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{agent.creator}</p>
                </div>
                {agent.featured && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full uppercase">
                        Featured
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{agent.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {agent.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {agent.rating}
                    </span>
                    <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {agent.downloads}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${agent.price === 'free' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                        {agent.price === 'free' ? 'Free' : `₹${agent.price}/mo`}
                    </span>
                    <button
                        onClick={() => onAdd(agent)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAdded
                            ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                    >
                        {isAdded ? (
                            <><Check className="w-3.5 h-3.5" /> Added</>
                        ) : (
                            <><Plus className="w-3.5 h-3.5" /> Add</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
