import { useNavigate } from 'react-router-dom';
import { Bot, Zap, ArrowRight, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

const floatingOrbs = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: 100 + Math.random() * 200,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 12,
}));

const features = [
    { icon: Bot, title: 'AI Agents', desc: 'Hire agents to automate tasks' },
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'Data-driven business insights' },
    { icon: Shield, title: 'Secure & Private', desc: 'Your data stays yours' },
];

export default function Welcome() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                {floatingOrbs.map((orb) => (
                    <div
                        key={orb.id}
                        className="absolute rounded-full opacity-[0.07] blur-3xl"
                        style={{
                            width: orb.size,
                            height: orb.size,
                            left: `${orb.x}%`,
                            top: `${orb.y}%`,
                            background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
                            animation: `float ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
                        }}
                    />
                ))}
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header
                    className={`flex items-center justify-between px-6 py-5 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-heading font-bold">
                            AutoBiz <span className="text-blue-400">AI</span>
                        </span>
                    </div>
                </header>

                {/* Hero */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
                    <div
                        className={`text-center max-w-2xl mx-auto transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            AI-Powered Business Platform for Indian SMEs
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold leading-tight mb-6">
                            Your Business,{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Supercharged
                            </span>
                            <br />
                            with AI Agents
                        </h1>

                        <p className="text-gray-400 text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
                            Hire AI agents to manage your emails, finances, marketing, and more. Built for Indian businesses that want to grow smarter.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/onboarding/guided')}
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <Zap className="w-5 h-5" />
                                Quick Start
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/onboarding/freetext')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                            >
                                Describe My Business
                            </button>
                        </div>
                    </div>

                    {/* Features Row */}
                    <div
                        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl w-full transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                    >
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div
                                key={title}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{title}</div>
                                    <div className="text-xs text-gray-500">{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer
                    className={`text-center py-6 text-gray-600 text-sm transition-all duration-700 delay-700 ${loaded ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    Made in India 🇮🇳 for Indian SMEs
                </footer>
            </div>
        </div>
    );
}
