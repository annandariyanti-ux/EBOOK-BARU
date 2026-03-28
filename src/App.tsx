import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  PenTool, 
  Download, 
  Loader2, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  User,
  Type as TypeIcon,
  Layers,
  Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateOutline, generateChapterContent, type EbookOutline } from './lib/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Chapter {
  title: string;
  description: string;
  content?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export default function App() {
  const [step, setStep] = useState<'input' | 'outline' | 'generating' | 'preview'>('input');
  const [topic, setTopic] = useState('');
  const [pages, setPages] = useState(35);
  const [tone, setTone] = useState('Professional & Informative');
  const [author, setAuthor] = useState('');
  const [outline, setOutline] = useState<EbookOutline | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const ebookRef = useRef<HTMLDivElement>(null);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !author) return;

    setIsGeneratingOutline(true);
    setError(null);
    try {
      const generatedOutline = await generateOutline(topic, tone, author, pages);
      setOutline(generatedOutline);
      setChapters(generatedOutline.chapters.map(c => ({
        ...c,
        status: 'pending'
      })));
      setStep('outline');
    } catch (err) {
      console.error(err);
      setError('Gagal membuat kerangka buku. Silakan coba lagi.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const startWritingChapters = async () => {
    setStep('generating');
    setCurrentChapterIndex(0);
  };

  useEffect(() => {
    if (step === 'generating' && currentChapterIndex >= 0 && currentChapterIndex < chapters.length) {
      const generateNext = async () => {
        const index = currentChapterIndex;
        const chapter = chapters[index];
        
        if (chapter.status === 'completed') {
          setCurrentChapterIndex(prev => prev + 1);
          return;
        }

        setChapters(prev => prev.map((c, i) => i === index ? { ...c, status: 'generating' } : c));

        try {
          const content = await generateChapterContent(
            outline!.title,
            chapter.title,
            chapter.description,
            tone,
            author,
            outline!
          );
          
          setChapters(prev => prev.map((c, i) => i === index ? { ...c, content, status: 'completed' } : c));
          
          if (index === chapters.length - 1) {
            setStep('preview');
          } else {
            setCurrentChapterIndex(prev => prev + 1);
          }
        } catch (err) {
          console.error(err);
          setChapters(prev => prev.map((c, i) => i === index ? { ...c, status: 'error' } : c));
          setError(`Gagal membuat bab: ${chapter.title}.`);
          setStep('preview'); // Go to preview anyway to show what we have
        }
      };

      generateNext();
    }
  }, [step, currentChapterIndex, chapters.length]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#E6E6E6]">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-white/80 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Aden Generator Ebook AI</h1>
          </div>
          {step === 'preview' && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setStep('input')}
                className="text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors"
              >
                Buat Baru
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#333] transition-all active:scale-95"
              >
                <Printer size={16} />
                Cetak / Simpan PDF
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 print:p-0 print:max-w-none">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-serif italic text-[#1A1A1A]">Tulis Mahakarya Anda</h2>
                <p className="text-[#666] max-w-lg mx-auto">
                  Berikan detail buku Anda, dan biarkan AI kami menyusun eBook profesional yang siap jual dalam hitungan menit.
                </p>
              </div>

              <form onSubmit={handleStartGeneration} className="bg-white border border-[#E5E5E5] rounded-3xl p-8 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#999] flex items-center gap-2">
                      <FileText size={14} /> Topik / Niche
                    </label>
                    <input 
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Contoh: Strategi Digital Marketing 2024"
                      className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#999] flex items-center gap-2">
                      <User size={14} /> Nama Penulis
                    </label>
                    <input 
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#999] flex items-center gap-2">
                      <TypeIcon size={14} /> Nada / Gaya Bahasa
                    </label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1A1A1A] transition-all outline-none appearance-none"
                    >
                      <option>Professional & Informative</option>
                      <option>Casual & Friendly</option>
                      <option>Inspirational & Motivating</option>
                      <option>Technical & Deep</option>
                      <option>Storytelling & Narrative</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#999] flex items-center gap-2">
                      <Layers size={14} /> Target Halaman (30-40)
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="30"
                        max="40"
                        value={pages}
                        onChange={(e) => setPages(parseInt(e.target.value))}
                        className="flex-1 accent-[#1A1A1A]"
                      />
                      <span className="font-mono font-bold text-lg w-8">{pages}</span>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isGeneratingOutline}
                  className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#333] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-black/5"
                >
                  {isGeneratingOutline ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Menyusun Kerangka...
                    </>
                  ) : (
                    <>
                      <PenTool size={20} />
                      Mulai Generate Ebook
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'outline' && outline && (
            <motion.div
              key="outline"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep('input')}
                  className="flex items-center gap-2 text-[#666] hover:text-[#1A1A1A] transition-colors"
                >
                  <ArrowLeft size={18} /> Kembali
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-[#999]">Langkah 2: Konfirmasi Kerangka</span>
              </div>

              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 shadow-sm space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#999]">Judul Buku</h3>
                  <h2 className="text-4xl font-serif font-bold">{outline.title}</h2>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#999]">Daftar Isi</h3>
                  <div className="space-y-4">
                    {outline.chapters.map((chapter, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-[#F9F9F9] border border-transparent hover:border-[#E5E5E5] transition-all">
                        <span className="font-mono font-bold text-[#CCC] text-xl">{(i + 1).toString().padStart(2, '0')}</span>
                        <div className="space-y-1">
                          <h4 className="font-bold text-[#1A1A1A]">{chapter.title}</h4>
                          <p className="text-sm text-[#666] leading-relaxed">{chapter.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={startWritingChapters}
                  className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#333] transition-all flex items-center justify-center gap-3"
                >
                  Konfirmasi & Mulai Menulis
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 py-12"
            >
              <div className="text-center space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-[#F0F0F0] rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-[#1A1A1A] rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '2s' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono font-bold text-xl">
                      {Math.round((currentChapterIndex / chapters.length) * 100)}%
                    </span>
                  </div>
                </div>
                <h2 className="text-3xl font-serif italic">AI Sedang Menulis...</h2>
                <p className="text-[#666]">Kami sedang menyusun konten berkualitas tinggi untuk setiap bab buku Anda.</p>
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                {chapters.map((chapter, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      chapter.status === 'generating' ? "bg-white border-[#1A1A1A] shadow-lg scale-105" : "bg-[#F9F9F9] border-transparent opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#999]">{(i + 1).toString().padStart(2, '0')}</span>
                      <span className="font-medium text-sm truncate max-w-[200px]">{chapter.title}</span>
                    </div>
                    {chapter.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                    {chapter.status === 'generating' && <Loader2 size={16} className="animate-spin text-[#1A1A1A]" />}
                    {chapter.status === 'pending' && <div className="w-4 h-4 rounded-full border border-[#CCC]" />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'preview' && outline && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 print:space-y-0"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3 print:hidden">
                  <CheckCircle2 size={18} className="rotate-45" />
                  {error}
                </div>
              )}

              <div ref={ebookRef} className="bg-white print:shadow-none shadow-2xl shadow-black/5 rounded-[40px] print:rounded-none overflow-hidden border border-[#E5E5E5] print:border-none">
                {/* Cover Page */}
                <div className="min-h-[800px] flex flex-col items-center justify-center p-20 text-center space-y-12 bg-[#1A1A1A] text-white break-after-page">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">E-BOOK MASTERPIECE</span>
                    <h1 className="text-7xl font-serif font-bold leading-tight">{outline.title}</h1>
                    <div className="w-24 h-1 bg-white mx-auto opacity-20"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-light opacity-80">Ditulis Oleh</p>
                    <p className="text-3xl font-serif italic">{author}</p>
                  </div>
                </div>

                {/* Table of Contents */}
                <div className="p-20 min-h-[800px] break-after-page bg-white">
                  <h2 className="text-4xl font-serif font-bold mb-16 border-b pb-8">Daftar Isi</h2>
                  <div className="space-y-6">
                    {chapters.map((chapter, i) => (
                      <div key={i} className="flex items-baseline justify-between group">
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-[#CCC] text-lg">{(i + 1).toString().padStart(2, '0')}</span>
                          <span className="text-xl font-medium">{chapter.title}</span>
                        </div>
                        <div className="flex-1 border-b border-dotted border-[#E5E5E5] mx-4 mb-1"></div>
                        <span className="font-mono text-[#999]">Hal. {i * 4 + 3}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Chapters */}
                {chapters.map((chapter, i) => (
                  <div key={i} className="p-20 min-h-[800px] break-after-page bg-white prose prose-slate max-w-none">
                    <div className="mb-12 space-y-4">
                      <span className="font-mono text-[#999] text-sm uppercase tracking-widest">Bab {(i + 1).toString().padStart(2, '0')}</span>
                      <h2 className="text-5xl font-serif font-bold !mt-0">{chapter.title}</h2>
                      <div className="w-16 h-1 bg-[#1A1A1A]"></div>
                    </div>
                    
                    <div className="text-[#333] leading-relaxed text-lg space-y-6">
                      {chapter.content ? (
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h3 className="text-3xl font-bold mt-12 mb-6" {...props} />,
                            h2: ({node, ...props}) => <h4 className="text-2xl font-bold mt-10 mb-4" {...props} />,
                            h3: ({node, ...props}) => <h5 className="text-xl font-bold mt-8 mb-3" {...props} />,
                            p: ({node, ...props}) => <p className="mb-6 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                            li: ({node, ...props}) => <li className="pl-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-[#1A1A1A]" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#1A1A1A] pl-6 italic my-8 text-[#666]" {...props} />,
                          }}
                        >
                          {chapter.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-[#F9F9F9] rounded-3xl border border-dashed border-[#E5E5E5]">
                          <p className="text-[#999] italic">Konten tidak tersedia atau gagal digenerate.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Back Cover */}
                <div className="min-h-[800px] flex flex-col items-center justify-center p-20 text-center space-y-8 bg-[#F9F9F9] border-t border-[#E5E5E5]">
                  <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-8">
                    <BookOpen className="text-white w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold">Terima Kasih Telah Membaca</h2>
                  <p className="text-[#666] max-w-md">
                    Ebook ini digenerate secara otomatis menggunakan Aden Generator Ebook AI. 
                    Semua konten disusun untuk memberikan nilai maksimal bagi pembaca.
                  </p>
                  <div className="pt-12">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#999]">Diterbitkan Oleh</p>
                    <p className="text-lg font-serif italic">{author}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] py-12 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[#999] text-sm">
          <p>© 2026 Aden Generator Ebook AI. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#1A1A1A] transition-colors">Bantuan</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:border-none { border: none !important; }
          .break-after-page { page-break-after: always; }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}} />
    </div>
  );
}
