import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Agent, OnboardingConfig } from '../../types';

export default function ResultsScreen() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [config, setConfig] = useState<OnboardingConfig | null>(null);
    const [addedAgents, setAddedAgents] = useState<Set<string>>(new Set());
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        Promise.all([api.getAgents(), api.getOnboardingConfig()]).then(([a, c]) => {
            setAgents(a);
            setConfig(c);
            setTimeout(() => setLoaded(true), 200);
        });
    }, []);

    const recommended = config?.mock_response.recommended_agents || [];
    const summary = config?.mock_response.summary || '';

    const getAgent = (id: string) => agents.find((a) => a.id === id);

    const toggleAdd = (agentId: string) => {
        setAddedAgents((prev) => {
            const next = new Set(prev);
            if (next.has(agentId)) next.delete(agentId);
            else next.add(agentId);
            return next;
        });
    };

    const handleContinue = () => {
        navigate('/app/agents');
    };

    // Render markdown-like bold text
    const renderText = (text: string) => {
        return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                <div className={`text-center mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Analysis Complete
                    </div>
                    <h1 className="text-3xl font-heading font-bold">Your Business Results</h1>
                </div>

                {/* Split Layout */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left: Summary */}
                    <div className={`transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                        <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                            📊 Your Business Overview
                        </h2>
                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            {summary.split('\n\n').map((para, i) => (
                                <p key={i}>{renderText(para)}</p>
                            ))}
                        </div>
                    </div>

                    {/* Right: Recommended Agents */}
                    <div className={`transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                        <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                            🤖 Your AI Team
                        </h2>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
                            {recommended.map(({ agent_id, reason }) => {
                                const agent = getAgent(agent_id);
                                if (!agent) return null;
                                const isAdded = addedAgents.has(agent_id);
                                return (
                                    <div
                                        key={agent_id}
                                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${isAdded
                                                ? 'bg-blue-500/10 border-blue-500/30'
                                                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                            style={{ backgroundColor: `${agent.color}15` }}
                                        >
                                            {agent.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-white">{agent.name}</div>
                                            <div className="text-sm text-gray-400 mt-0.5">{reason}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleAdd(agent_id)}
                                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isAdded
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                                }`}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sign Up Section */}
                <div className={`mt-12 max-w-md mx-auto transition-all duration-700 delay-600 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-heading font-bold mb-1">Ready to get started?</h3>
                        <p className="text-sm text-gray-500">Sign up to access your personalized workspace</p>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#2F2F2F] text-white font-semibold hover:bg-[#3a3a3a] transition-all">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.4 24H1.8C.8 24 0 23.2 0 22.2V1.8C0 .8.8 0 1.8 0h20.4c1 0 1.8.8 1.8 1.8v20.4c0 1-.8 1.8-1.8 1.8H14.4v-9.3h3.1l.5-3.6h-3.6V8.7c0-1 .3-1.7 1.8-1.7h1.9V3.8c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.6H7.5v3.6h3.1V24h.8z" />
                            </svg>
                            Continue with Microsoft
                        </button>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-gray-950 text-gray-500">or skip for now</span>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all duration-300"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
