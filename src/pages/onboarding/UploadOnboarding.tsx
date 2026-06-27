import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Image, Table, Trash2, Rocket } from 'lucide-react';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
}

export default function UploadOnboarding() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [socialMedia, setSocialMedia] = useState({ instagram: '', twitter: '' });

    const handleFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;
        const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
            id: `file-${Date.now()}-${Math.random()}`,
            name: f.name,
            size: f.size,
            type: f.type,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
        if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel'))
            return <Table className="w-5 h-5 text-green-400" />;
        return <FileText className="w-5 h-5 text-blue-400" />;
    };

    const handleAnalyze = () => {
        navigate('/onboarding/analyzing');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <div className="px-6 pt-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">Upload Documents (Optional)</span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-lg mx-auto space-y-8 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-heading font-bold mb-2">Share your business data</h2>
                        <p className="text-gray-400">Upload relevant documents to get more accurate AI recommendations</p>
                    </div>

                    {/* Drag & Drop Area */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                        className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${dragActive
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload className={`w-10 h-10 mb-4 ${dragActive ? 'text-blue-400' : 'text-gray-500'}`} />
                        <p className="text-sm font-medium text-gray-300 text-center">
                            Drag & drop files here, or click to browse
                        </p>
                        <p className="text-xs text-gray-600 mt-2">PDFs, CSV, Excel, Images</p>
                        <input
                            id="file-input"
                            type="file"
                            multiple
                            accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                    </div>

                    {/* Quick Upload Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: FileText, label: '📄 PDFs', accept: '.pdf' },
                            { icon: Table, label: '📊 CSV/Excel', accept: '.csv,.xlsx,.xls' },
                            { icon: Image, label: '🖼️ Images', accept: '.jpg,.jpeg,.png' },
                        ].map(({ label, accept }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = accept;
                                    input.multiple = true;
                                    input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files);
                                    input.click();
                                }}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.06] transition-all"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Uploaded Files */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-400">Uploaded Files ({files.length})</h3>
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                                >
                                    {getFileIcon(file.type)}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white truncate">{file.name}</div>
                                        <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                                    </div>
                                    <button onClick={() => removeFile(file.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Social Media */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-400">📱 Social Media (Optional)</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📸</span>
                                <input
                                    type="text"
                                    value={socialMedia.instagram}
                                    onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                                    placeholder="Instagram username"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg">𝕏</span>
                                <input
                                    type="text"
                                    value={socialMedia.twitter}
                                    onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                                    placeholder="X / Twitter username"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-8 pt-4">
                <button
                    onClick={handleAnalyze}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all duration-300"
                >
                    <Rocket className="w-5 h-5" />
                    Analyze My Business
                </button>
                {files.length === 0 && (
                    <button onClick={handleAnalyze} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                        Skip for now →
                    </button>
                )}
            </div>
        </div>
    );
}
