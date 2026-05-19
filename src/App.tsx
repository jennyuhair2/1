import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, Image as ImageIcon, ArrowRight, Loader2, Camera, User, UserRound, RefreshCcw } from 'lucide-react';

type Gender = 'male' | 'female' | 'auto';

export default function App() {
  const [activeTab, setActiveTab] = useState<'transform' | 'review'>('transform');
  
  // Transform State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<Gender>('auto');
  const [error, setError] = useState<string | null>(null);

  // Review State
  const [selectedDesigner, setSelectedDesigner] = useState('제니 원장');
  const [customerReview, setCustomerReview] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('상냥하게');
  const [generatedReply, setGeneratedReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const designers = ['제니 원장', '바다 디자이너', '원석 디자이너', '유화 디자이너', '범수 디자이너', '차니 디자이너', '채원 디자이너', '지수 디자이너'];
  const styles = ['상냥하게', '정중하게', '친근하게', '장난스럽게', '다나까'];

  const generateReply = async () => {
    if (!customerReview.trim()) return;
    setReplyLoading(true);
    setReplyError(null);
    try {
      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designer: selectedDesigner, review: customerReview, style: selectedStyle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '답글 생성에 실패했습니다.');
      setGeneratedReply(data.reply);
    } catch (err: any) {
      setReplyError(err.message);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setTransformedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const transformImage = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: originalImage,
          gender: gender === 'auto' ? null : gender 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API 사용량이 초과되었습니다. 잠시 후 다시 시도하거나 설정에서 API 키를 확인해주세요.');
        }
        throw new Error(data.error || '이미지 변환에 실패했습니다.');
      }

      setTransformedImage(data.image);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setTransformedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-0 md:h-16 flex flex-col md:flex-row items-center">
          <div className="flex items-center justify-center md:justify-start w-full md:w-1/4 shrink-0 mb-4 md:mb-0">
            <span className="font-bold text-base md:text-lg tracking-widest text-white uppercase whitespace-nowrap">JENNY U HAIR BOUTIQUE</span>
          </div>
          <nav className="flex items-center justify-center gap-8 md:gap-12 flex-grow">
            <button 
              onClick={() => setActiveTab('transform')}
              className={`text-base md:text-lg font-semibold transition-all pb-1 ${activeTab === 'transform' ? 'text-white border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'}`}
            >
              AI 변환
            </button>
            <button 
              onClick={() => setActiveTab('review')}
              className={`text-base md:text-lg font-semibold transition-all pb-1 ${activeTab === 'review' ? 'text-white border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'}`}
            >
              리뷰답글
            </button>
          </nav>
          <div className="w-1/4 hidden md:block" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 font-sans">
        <AnimatePresence mode="wait">
          {activeTab === 'transform' ? (
            <motion.div 
              key="transform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              {/* Left Column: Upload & Options */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 shadow-sm overflow-hidden relative">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 1단계: 사진 업로드
                  </h2>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer
                      transition-all duration-300 relative group overflow-hidden
                      ${originalImage ? 'border-indigo-500' : 'border-neutral-800 hover:border-indigo-500 hover:bg-neutral-800/50'}
                    `}
                  >
                    {originalImage ? (
                      <>
                        <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-sm font-medium">사진 변경</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="bg-neutral-800 p-4 rounded-full inline-block mb-4">
                          <ImageIcon className="w-8 h-8 text-neutral-500" />
                        </div>
                        <p className="font-medium text-neutral-200">클릭하여 시술 사진 업로드</p>
                        <p className="text-xs text-neutral-500 mt-2">JPG, PNG 또는 WEBP (최대 10MB)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {originalImage && !transformedImage && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-6"
                    >
                      <div>
                        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                          성별
                        </h3>
                        <div className="flex bg-neutral-800 p-1 rounded-xl gap-1">
                          {(['auto', 'male', 'female'] as Gender[]).map((g) => (
                            <button
                              key={g}
                              onClick={() => setGender(g)}
                              className={`
                                flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all capitalize flex items-center justify-center gap-2
                                ${gender === g ? 'bg-indigo-600 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}
                              `}
                            >
                              {g === 'male' && <User className="w-4 h-4" />}
                              {g === 'female' && <UserRound className="w-4 h-4" />}
                              {g === 'auto' && <RefreshCcw className="w-4 h-4" />}
                              {g === 'male' ? '남성' : g === 'female' ? '여성' : '자동'}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={transformImage}
                        disabled={loading}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold text-sm tracking-tight flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
                      >
                        실행 <Sparkles className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </div>

                {error && (
                  <div 
                    className="bg-red-950/40 border border-red-500/50 p-6 rounded-2xl text-red-100 text-sm flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg"
                  >
                    <div className="p-2 bg-red-500/20 rounded-full shrink-0">
                      <RefreshCcw className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">⚠️ 변환 오류 발생</p>
                      <p className="opacity-90 leading-relaxed">{error}</p>
                      <p className="text-xs text-red-400/80 mt-2">일시적인 할당량 초과일 경우 약 30초 후 다시 시도해 주세요.</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Right Column: Result */}
              <div className="lg:sticky lg:top-28">
                <div className={`
                  bg-neutral-900 rounded-3xl p-8 shadow-2xl relative min-h-[400px] flex flex-col justify-center
                  ${transformedImage ? 'ring-2 ring-neutral-800' : ''}
                  transition-all duration-500
                `}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> AI 결과
                  </h2>

                  <div className="aspect-square bg-neutral-950 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative shadow-inner border border-neutral-800">
                    {loading ? (
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-neutral-400 animate-pulse font-medium">얼굴 보정 중...</p>
                      </div>
                    ) : transformedImage ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full relative"
                      >
                        <img src={transformedImage} alt="Transformed" className="w-full h-full object-cover" />
                        <span className="absolute top-6 right-6 text-[10px] bg-indigo-600 px-2 py-1 rounded text-white font-bold tracking-widest">AI 보정 완료</span>
                      </motion.div>
                    ) : (
                      <div className="text-center p-6 text-neutral-700">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm italic">변환 준비 완료</p>
                      </div>
                    )}
                  </div>

                  {transformedImage && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-8 flex gap-4"
                    >
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = transformedImage;
                          link.download = 'refined-portrait.png';
                          link.click();
                        }}
                        className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors"
                      >
                        다운로드
                      </button>
                      <button 
                        onClick={reset}
                        className="flex-1 border border-neutral-800 text-white py-4 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
                      >
                        다시 시작
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Options Panel */}
                <div className="md:col-span-1 space-y-8">
                  <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-6">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">디자이너 선택</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {designers.map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDesigner(d)}
                            className={`
                              text-left px-5 py-4 rounded-xl text-base font-medium transition-all
                              ${selectedDesigner === d ? 'bg-indigo-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-400 hover:text-white'}
                            `}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-6">답글 스타일</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {styles.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedStyle(s)}
                            className={`
                              px-4 py-4 rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center text-center
                              ${selectedStyle === s ? 'bg-white text-black shadow-lg' : 'bg-neutral-800 text-neutral-400 hover:text-white'}
                            `}
                          >
                            <span>{s}</span>
                            {s === '다나까' && (
                              <span className="text-[9px] opacity-60 font-normal mt-0.5 leading-tight">
                                (클레임 or 남자디자이너)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Panel */}
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-neutral-900 rounded-3xl p-10 border border-neutral-800 space-y-8 shadow-xl">
                    <div className="space-y-6">
                      <h3 className="text-xs uppercase tracking-widest text-neutral-500">고객 리뷰 내용</h3>
                      <textarea
                        value={customerReview}
                        onChange={(e) => setCustomerReview(e.target.value)}
                        placeholder="고객님이 남겨주신 리뷰를 여기에 복사해주세요..."
                        className="w-full h-40 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>

                    <button
                      onClick={generateReply}
                      disabled={replyLoading || !customerReview.trim()}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold text-base tracking-tight flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                      {replyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      답글 생성하기
                    </button>

                    {replyError && (
                      <p className="text-red-400 text-xs text-center">{replyError}</p>
                    )}

                    {generatedReply && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-6 border-t border-neutral-800"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase tracking-widest text-indigo-500 font-bold">생성된 답글</h3>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedReply);
                            }}
                            className="text-[10px] bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors font-bold uppercase"
                          >
                            복사하기
                          </button>
                        </div>
                        <div className="bg-neutral-950 p-8 rounded-2xl border border-neutral-800 text-neutral-200 text-lg leading-loose whitespace-pre-wrap tracking-wide">
                          {generatedReply}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 border-t border-neutral-800 py-12 text-center text-xs text-white bg-neutral-950">
      </footer>
    </div>
  );
}
