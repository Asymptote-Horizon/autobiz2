import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Users, IndianRupee, Target, AlertTriangle, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import type { OnboardingConfig } from '../../types';

const steps = [
    { title: 'Business Info', icon: Building2 },
    { title: 'Customer Size', icon: Users },
    { title: 'Revenue', icon: IndianRupee },
    { title: 'Goals', icon: Target },
    { title: 'Challenges', icon: AlertTriangle },
    { title: 'Team', icon: UserPlus },
];

const customerSizes = [
    { value: 'small', label: 'Small', desc: 'Less than 50 customers', emoji: '🏠' },
    { value: 'medium', label: 'Medium', desc: '50 – 500 customers', emoji: '🏢' },
    { value: 'large', label: 'Large', desc: '500+ customers', emoji: '🏗️' },
];

const revenueRanges = [
    { value: 'under-5l', label: 'Under ₹5 Lakh' },
    { value: '5l-25l', label: '₹5 – 25 Lakh' },
    { value: '25l-1cr', label: '₹25 Lakh – 1 Crore' },
    { value: '1cr-5cr', label: '₹1 – 5 Crore' },
    { value: 'above-5cr', label: 'Above ₹5 Crore' },
];

const teamSizes = [
    { value: '1-5', label: '1-5 people', emoji: '👤' },
    { value: '6-20', label: '6-20 people', emoji: '👥' },
    { value: '21-50', label: '21-50 people', emoji: '🏢' },
    { value: '50+', label: '50+ people', emoji: '🏗️' },
];

export default function GuidedOnboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [config, setConfig] = useState<OnboardingConfig | null>(null);
    const [form, setForm] = useState({
        businessName: '',
        industry: '',
        customerSize: '',
        revenueRange: '',
        goals: [] as string[],
        challenges: [] as string[],
        teamSize: '',
    });

    useEffect(() => {
        api.getOnboardingConfig().then(setConfig);
    }, []);

    const toggleItem = (field: 'goals' | 'challenges', item: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter((i) => i !== item)
                : [...prev[field], item],
        }));
    };

    const canProceed = () => {
        switch (step) {
            case 0: return form.businessName.trim() && form.industry;
            case 1: return form.customerSize;
            case 2: return form.revenueRange;
            case 3: return form.goals.length > 0;
            case 4: return form.challenges.length > 0;
            case 5: return form.teamSize;
            default: return false;
        }
    };

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1);
        } else {
            sessionStorage.setItem('onboardingData', JSON.stringify(form));
            navigate('/onboarding/upload');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Progress Bar */}
            <div className="px-6 pt-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => (step > 0 ? setStep(step - 1) : navigate('/welcome'))}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-400">
                        Step {step + 1} of {steps.length}
                    </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
                {/* Step Indicators */}
                <div className="flex justify-between mt-3">
                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={i}
                                className={`flex flex-col items-center gap-1 transition-all duration-300 ${i <= step ? 'opacity-100' : 'opacity-30'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i === step
                                            ? 'bg-blue-500 text-white'
                                            : i < step
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-white/5 text-gray-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] text-gray-500 hidden sm:block">{s.title}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-lg animate-fade-in" key={step}>
                    {/* Step 0: Business Info */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">Tell us about your business</h2>
                                <p className="text-gray-400">We'll customize your AI agents based on this</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                                <input
                                    type="text"
                                    value={form.businessName}
                                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                                    placeholder="e.g., Sharma Electronics"
                                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                                <select
                                    value={form.industry}
                                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                                >
                                    <option value="" className="bg-gray-900">Select Industry</option>
                                    {config?.industries.map((ind) => (
                                        <option key={ind} value={ind} className="bg-gray-900">
                                            {ind}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Customer Size */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">How many customers do you serve?</h2>
                                <p className="text-gray-400">This helps us recommend the right tools</p>
                            </div>
                            <div className="grid gap-3">
                                {customerSizes.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => setForm({ ...form, customerSize: size.value })}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${form.customerSize === size.value
                                                ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-2xl">{size.emoji}</span>
                                        <div>
                                            <div className="font-semibold text-white">{size.label}</div>
                                            <div className="text-sm text-gray-400">{size.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Revenue */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">Annual revenue range?</h2>
                                <p className="text-gray-400">This stays confidential — we use it to tailor insights</p>
                            </div>
                            <div className="grid gap-3">
                                {revenueRanges.map((range) => (
                                    <button
                                        key={range.value}
                                        onClick={() => setForm({ ...form, revenueRange: range.value })}
                                        className={`p-4 rounded-2xl border text-left transition-all duration-200 ${form.revenueRange === range.value
                                                ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                                            }`}
                                    >
                                        <span className="font-semibold text-white">{range.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Goals */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">What are your primary goals?</h2>
                                <p className="text-gray-400">Select all that apply</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {config?.business_goals.map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleItem('goals', goal)}
                                        className={`p-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-200 ${form.goals.includes(goal)
                                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                                                : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Challenges */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">What challenges do you face?</h2>
                                <p className="text-gray-400">We'll match you with agents that solve these</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {config?.challenges.map((challenge) => (
                                    <button
                                        key={challenge}
                                        onClick={() => toggleItem('challenges', challenge)}
                                        className={`p-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-200 ${form.challenges.includes(challenge)
                                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                                                : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        {challenge}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Team Size */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-heading font-bold mb-2">How big is your team?</h2>
                                <p className="text-gray-400">Last step — almost done!</p>
                            </div>
                            <div className="grid gap-3">
                                {teamSizes.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => setForm({ ...form, teamSize: size.value })}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${form.teamSize === size.value
                                                ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                                                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-2xl">{size.emoji}</span>
                                        <span className="font-semibold text-white">{size.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action */}
            <div className="px-6 pb-8">
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-2xl transition-all duration-300"
                >
                    {step < 5 ? 'Continue' : 'Next: Upload Documents'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
