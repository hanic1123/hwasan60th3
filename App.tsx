
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calculator, 
  School, 
  User as UserIcon, 
  ChevronRight, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MessageSquare,
  Bookmark,
  ArrowLeft,
  Settings,
  Star,
  LogIn,
  Loader2,
  Globe,
  MapPin,
  LogOut,
  Info
} from 'lucide-react';
import { UserProfile, SemesterData, HighSchool, SubjectGrade, Achievement } from './types';
import { 
  GRADE_1_SUBJECTS, 
  GRADE_2_SUBJECTS, 
  GRADE_3_SUBJECTS, 
  INITIAL_NON_ACADEMIC,
  MOCK_SCHOOLS 
} from './constants';
import { 
  getAchievement, 
  calculatePerfScale, 
  calculateTotalScore 
} from './utils/gradeUtils';
import { 
  getAIConsultation, 
  searchHighSchoolsViaAI, 
  calculateSchoolSpecificGrade
} from './services/geminiService';

// --- Components ---

const Button = ({ children, onClick, className = '', variant = 'primary', disabled, loading }: any) => {
  const variants: any = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50',
    outline: 'bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = 'number', max, min = 0, placeholder, disabled, step }: any) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      max={max}
      min={min}
      step={step}
      disabled={disabled}
      placeholder={disabled ? 'X' : placeholder}
      className={`border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all ${disabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed font-black text-center' : 'bg-white text-slate-700'}`}
    />
  </div>
);

// --- Main App Logic ---

export default function App() {
  const [view, setView] = useState<'splash' | 'login' | 'menu' | 'academic' | 'non-academic' | 'entrance' | 'semester-detail' | 'school-detail'>('splash');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<HighSchool | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEntranceTab, setActiveEntranceTab] = useState<'bookmarks' | 'search' | 'ai'>('bookmarks');
  const [searchResults, setSearchResults] = useState<HighSchool[]>(MOCK_SCHOOLS);
  const [isSearching, setIsSearching] = useState(false);
  const [loginData, setLoginData] = useState({ id: '', pw: '' });
  
  // 로그인 상태 복구
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('hwasan_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('menu');
      } else {
        setView('login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (!loginData.id) return alert('아이디를 입력해주세요.');
    const newUser: UserProfile = {
      id: loginData.id,
      username: loginData.id,
      semesters: {},
      nonAcademic: INITIAL_NON_ACADEMIC,
      bookmarks: [],
    };
    setUser(newUser);
    localStorage.setItem('hwasan_user', JSON.stringify(newUser));
    setView('menu');
  };

  const handleLogout = () => {
    if(confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('hwasan_user');
      setUser(null);
      setView('login');
    }
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('hwasan_user', JSON.stringify(updated));
  };

  const handleGlobalSearch = async () => {
    if (!searchTerm) {
      setSearchResults(MOCK_SCHOOLS);
      return;
    }
    setIsSearching(true);
    const results = await searchHighSchoolsViaAI(searchTerm);
    if (results && results.length > 0) {
      // 검색된 결과도 현재 세션의 결과 목록에 유지
      setSearchResults(results);
    }
    setIsSearching(false);
  };

  const totalScore = useMemo(() => {
    if (!user) return 0;
    return calculateTotalScore(user.semesters, user.nonAcademic).toFixed(2);
  }, [user]);

  // --- 입력 차단 로직 (화산중 전형 요강 준수) ---
  const isInputDisabled = (semester: string, subjectName: string, field: string) => {
    const grade = semester[0];
    if (grade === '1') {
      if (field === 'midterm') {
        return !['국어', '수학', '영어', '과학', '사회', '기가', '도덕'].includes(subjectName);
      }
      if (field === 'final') {
        return !['국어', '수학', '영어', '과학', '사회', '기가', '도덕', '한문'].includes(subjectName);
      }
    } else {
      // 2, 3학년 지필고사
      if (field === 'paperTest') {
        return !['국어', '수학', '영어', '과학', '역사', '기가'].includes(subjectName);
      }
    }
    return false;
  };

  // --- Sub Views ---

  const renderSplash = () => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 relative animate-pulse">
        <div className="w-28 h-28 bg-blue-100 rounded-3xl flex items-center justify-center mb-4 overflow-hidden border-4 border-blue-50 shadow-xl">
           <img src="https://picsum.photos/seed/hwasan/300" alt="Hwasan Logo" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
          <School className="w-5 h-5 text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">화산중 성적을 부탁해</h1>
      <p className="text-blue-500 font-bold text-sm">성공적인 고등학교 진학의 동반자</p>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-10 space-y-8 shadow-2xl border-none rounded-[40px]">
        <div className="flex justify-center">
           <div className="p-4 bg-blue-50 rounded-[32px] border-4 border-white shadow-inner">
             <img src="https://picsum.photos/seed/hwasan/200" className="w-20 h-20 rounded-[24px] shadow-sm" />
           </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Login</h2>
          <p className="text-sm text-slate-400 font-medium">화산중학교 학생들을 위한 개인화 시스템</p>
        </div>
        <div className="space-y-4">
          <Input 
            label="ID" 
            type="text" 
            placeholder="아이디를 입력하세요" 
            value={loginData.id} 
            onChange={(v:string) => setLoginData(prev => ({...prev, id: v}))}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="비밀번호를 입력하세요" 
            value={loginData.pw}
            onChange={(v:string) => setLoginData(prev => ({...prev, pw: v}))}
          />
          <Button className="w-full py-5 text-xl font-black rounded-2xl mt-4 shadow-xl shadow-blue-100" onClick={handleLogin}>
            <LogIn className="w-6 h-6" />
            앱 시작하기
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-none">화산중 성적 매니저</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase mt-1 tracking-widest">Hwasan Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Authenticated</p>
            <p className="text-sm font-black text-blue-600 underline decoration-2 underline-offset-4">{user?.username}님</p>
          </div>
          <button onClick={handleLogout} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-slate-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 flex-1 max-w-2xl mx-auto w-full">
        <Card className="p-8 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white relative overflow-hidden shadow-2xl shadow-blue-200 border-none rounded-[32px]">
          <div className="absolute -top-10 -right-10 opacity-10">
            <Calculator className="w-48 h-48" />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-black opacity-80 uppercase tracking-widest mb-1">My Current Score</p>
              <h2 className="text-6xl font-black tracking-tighter">{totalScore} <span className="text-2xl font-bold opacity-40">/ 300</span></h2>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <Star className="w-7 h-7" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black opacity-80 uppercase">
              <span>Goal Progress</span>
              <span>{((Number(totalScore) / 300) * 100).toFixed(1)}% Completed</span>
            </div>
            <div className="bg-white/20 h-4 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <div className="bg-white h-full transition-all duration-1500 ease-out shadow-lg" style={{ width: `${(Number(totalScore) / 300) * 100}%` }} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setView('academic')}
            className="group flex items-center gap-5 p-7 bg-white rounded-[32px] border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50 transition-all text-left relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-600 rounded-3xl flex items-center justify-center text-blue-600 group-hover:text-white transition-all shadow-sm">
              <Calculator className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">내신 성적 산출</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">학년별 교과 점수 및 비교과 실시간 산출</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
               <ChevronRight className="w-6 h-6" />
            </div>
          </button>

          <button 
            onClick={() => setView('entrance')}
            className="group flex items-center gap-5 p-7 bg-white rounded-[32px] border border-slate-100 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-50 transition-all text-left relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-sky-50 group-hover:bg-sky-600 rounded-3xl flex items-center justify-center text-sky-600 group-hover:text-white transition-all shadow-sm">
              <School className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">고등학교 진학</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">대한민국 모든 고등학교 데이터 및 AI 상담</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">
               <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        </div>
      </main>
    </div>
  );

  const renderAcademicMenu = () => (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 py-5 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">성적 산출 센터</h1>
      </header>
      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        <div className="text-center py-8 bg-white rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3">Hwasan Middle School Score</p>
          <h2 className="text-6xl font-black text-blue-600 tracking-tighter">{totalScore} <span className="text-xl font-black text-slate-200">/ 300</span></h2>
          <div className="mt-6 flex justify-center gap-8 px-10">
             <div className="flex-1 bg-slate-50 p-4 rounded-3xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Academic (240)</p>
                <p className="font-black text-slate-800 text-lg tracking-tight">분석 완료</p>
             </div>
             <div className="flex-1 bg-slate-50 p-4 rounded-3xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Non-Academic (60)</p>
                <p className="font-black text-slate-800 text-lg tracking-tight">분석 완료</p>
             </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            className="flex-1 py-7 flex flex-col items-center gap-2 rounded-[32px] shadow-2xl shadow-blue-100 border-none"
            onClick={() => {}}
          >
            <BookOpen className="w-8 h-8" />
            <span className="font-black text-lg">교과 성적</span>
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 py-7 flex flex-col items-center gap-2 rounded-[32px] border-slate-100"
            onClick={() => setView('non-academic')}
          >
            <CheckCircle2 className="w-8 h-8" />
            <span className="font-black text-lg">비교과 성적</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['1학년 1학기', '1학년 2학기', '2학년 1학기', '2학년 2학기', '3학년 1학기', '3학년 2학기'].map((sem) => (
            <button
              key={sem}
              onClick={() => {
                setSelectedSemester(sem);
                setView('semester-detail');
              }}
              className="p-6 bg-white rounded-[28px] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex justify-between items-center group shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-inner">
                   <Settings className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-black text-slate-700">{sem}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-all" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );

  const renderSemesterDetail = () => {
    if (!selectedSemester || !user) return null;
    const isGrade1 = selectedSemester.startsWith('1');
    const isGrade2 = selectedSemester.startsWith('2');
    const isGrade3 = selectedSemester.startsWith('3');
    const subjects = isGrade1 ? GRADE_1_SUBJECTS : isGrade2 ? GRADE_2_SUBJECTS : GRADE_3_SUBJECTS;
    
    const data: SemesterData = user.semesters[selectedSemester] || { 
      isFreeSemester: false, 
      subjects: subjects.map(name => ({ name, rawScore: 0, achievement: 'A' as Achievement })) 
    };

    const handleToggleFree = (val: boolean) => {
      const updated = { ...user };
      updated.semesters[selectedSemester] = {
        ...data,
        isFreeSemester: val,
        subjects: data.subjects.map(s => ({ 
          ...s, 
          achievement: val ? 'P' : 'A' as Achievement, 
          rawScore: val ? '-' : 0 
        }))
      };
      handleUpdateUser(updated);
    };

    const handleUpdateSubject = (index: number, field: string, val: any) => {
      const updated = { ...user };
      const currentSub: SubjectGrade = { ...data.subjects[index], [field]: Number(val) };
      
      let calculatedRaw = 0;
      const isArtsPe = ['미술', '음악', '체육'].includes(currentSub.name);
      
      if (isGrade1) {
        const mid = currentSub.midterm || 0;
        const fin = currentSub.final || 0;
        const perf = currentSub.performance || 0;
        if (['국어', '수학', '영어', '과학', '사회', '기가', '도덕'].includes(currentSub.name)) {
          calculatedRaw = (mid * 0.3) + (fin * 0.3) + perf;
        } else if (currentSub.name === '한문') {
          calculatedRaw = (fin * 0.3) + perf;
        } else {
          calculatedRaw = perf;
        }
      } else {
        const pA = calculatePerfScale(currentSub.perfA || 0);
        const pB = calculatePerfScale(currentSub.perfB || 0);
        const pC = calculatePerfScale(currentSub.perfC || 0);
        const pD = calculatePerfScale(currentSub.perfD || 0);
        const jt = currentSub.paperTest || 0;
        if (['국어', '수학', '역사'].includes(currentSub.name) || (currentSub.name === '과학' && isGrade2 && selectedSemester.includes('1학기'))) {
          calculatedRaw = (pA * 0.2) + (pB * 0.2) + (pC * 0.2) + (pD * 0.2) + (jt * 0.2);
        } else if (currentSub.name === '과학') {
           calculatedRaw = (pA * 0.18) + (pB * 0.17) + (pC * 0.18) + (pD * 0.17) + (jt * 0.3);
        } else if (currentSub.name === '영어') {
          const w = selectedSemester.includes('1학기') ? {A:0.1, B:0.1, C:0.25, D:0.25, JT:0.3} : {A:0.1, B:0.2, C:0.2, D:0.2, JT:0.3};
          calculatedRaw = (pA * w.A) + (pB * w.B) + (pC * w.C) + (pD * w.D) + (jt * w.JT);
        } else if (currentSub.name === '기가' || (isGrade3 && currentSub.name === '한문')) {
          calculatedRaw = (pA * 0.2) + (pB * 0.1) + (pC * 0.1) + (pD * 0.3) + (jt * 0.3);
        } else if (currentSub.name === '사회' && isGrade3) {
          calculatedRaw = (pA * 0.15) + (pB * 0.15) + (pC * 0.2) + (pD * 0.2) + (jt * 0.3);
        } else if (['음악'].includes(currentSub.name)) {
          calculatedRaw = (pA * 0.2) + (pB * 0.3) + (pC * 0.2) + (pD * 0.3);
        } else {
          calculatedRaw = (pA * 0.25) + (pB * 0.25) + (pC * 0.25) + (pD * 0.25);
        }
      }

      currentSub.rawScore = Number(calculatedRaw.toFixed(1));
      currentSub.achievement = getAchievement(currentSub.rawScore, isArtsPe);
      
      if (!updated.semesters[selectedSemester]) updated.semesters[selectedSemester] = data;
      updated.semesters[selectedSemester].subjects[index] = currentSub;
      handleUpdateUser(updated);
    };

    return (
      <div className="min-h-screen bg-white">
        <header className="px-6 py-5 border-b flex items-center justify-between sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('academic')} className="p-2 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{selectedSemester} 상세</h1>
          </div>
          <div className={`px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-sm ${data.isFreeSemester ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {data.isFreeSemester ? '자유학기제 모드' : '성적 산출 모드'}
          </div>
        </header>
        <main className="p-6 space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 shadow-inner">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${data.isFreeSemester ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">자유학기제 설정</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enable P/F Mode</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={data.isFreeSemester} 
              onChange={(e) => handleToggleFree(e.target.checked)}
              className="w-10 h-10 rounded-xl accent-blue-600 cursor-pointer shadow-sm transition-all"
            />
          </div>

          <div className="overflow-x-auto rounded-[32px] border border-slate-100 shadow-2xl bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b">
                  <th className="p-5 font-black uppercase tracking-widest">Subject</th>
                  <th className="p-5 font-black text-center uppercase tracking-widest">Grading</th>
                  {isGrade1 ? (
                    <>
                      <th className="p-2 text-center font-black">MID</th>
                      <th className="p-2 text-center font-black">FIN</th>
                      <th className="p-2 text-center font-black">PERF</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2 text-center font-black">S.A</th>
                      <th className="p-2 text-center font-black">S.B</th>
                      <th className="p-2 text-center font-black">S.C</th>
                      <th className="p-2 text-center font-black">S.D</th>
                      <th className="p-2 text-center font-black">PAPER</th>
                    </>
                  )}
                  <th className="p-5 text-right font-black uppercase tracking-widest">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((sub, idx) => (
                  <tr key={idx} className="border-b last:border-none hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-800 bg-slate-50/30 text-sm">{sub.name}</td>
                    <td className="p-2 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-black text-xs shadow-md transition-all ${
                        sub.achievement === 'A' ? 'bg-green-500 text-white' :
                        sub.achievement === 'P' ? 'bg-blue-600 text-white' : 
                        sub.achievement === 'E' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {sub.achievement}
                      </div>
                    </td>
                    {isGrade1 ? (
                      <>
                        <td className="p-1 px-2">
                           <Input 
                             label="30%"
                             value={sub.midterm || ''} 
                             onChange={(v: any) => handleUpdateSubject(idx, 'midterm', v)} 
                             disabled={data.isFreeSemester || isInputDisabled(selectedSemester, sub.name, 'midterm')}
                           />
                        </td>
                        <td className="p-1 px-2">
                           <Input 
                             label="30%"
                             value={sub.final || ''} 
                             onChange={(v: any) => handleUpdateSubject(idx, 'final', v)} 
                             disabled={data.isFreeSemester || isInputDisabled(selectedSemester, sub.name, 'final')}
                           />
                        </td>
                        <td className="p-1 px-2">
                           <Input 
                             label="PERF"
                             value={sub.performance || ''} 
                             onChange={(v: any) => handleUpdateSubject(idx, 'performance', v)} 
                             disabled={data.isFreeSemester}
                           />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-1 px-1"><Input label="S.A" value={sub.perfA || ''} onChange={(v: any) => handleUpdateSubject(idx, 'perfA', v)} max={8} disabled={data.isFreeSemester}/></td>
                        <td className="p-1 px-1"><Input label="S.B" value={sub.perfB || ''} onChange={(v: any) => handleUpdateSubject(idx, 'perfB', v)} max={8} disabled={data.isFreeSemester}/></td>
                        <td className="p-1 px-1"><Input label="S.C" value={sub.perfC || ''} onChange={(v: any) => handleUpdateSubject(idx, 'perfC', v)} max={8} disabled={data.isFreeSemester}/></td>
                        <td className="p-1 px-1"><Input label="S.D" value={sub.perfD || ''} onChange={(v: any) => handleUpdateSubject(idx, 'perfD', v)} max={8} disabled={data.isFreeSemester}/></td>
                        <td className="p-1 px-1">
                           <Input 
                             label="PAPER"
                             value={sub.paperTest || ''} 
                             onChange={(v: any) => handleUpdateSubject(idx, 'paperTest', v)} 
                             disabled={data.isFreeSemester || isInputDisabled(selectedSemester, sub.name, 'paperTest')}
                           />
                        </td>
                      </>
                    )}
                    <td className="p-5 font-black text-right text-blue-600 text-base tabular-nums bg-blue-50/20">{sub.rawScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-blue-50 rounded-[28px] border border-blue-100 flex gap-4 shadow-sm">
             <Info className="w-6 h-6 text-blue-600 shrink-0" />
             <p className="text-xs text-blue-700 leading-relaxed font-bold">
               화산중 지침에 따라 시험이 없는 항목(미술 중간고사 등)은 비활성화(X) 처리되었습니다. 자유학기제 설정 시 모든 점수는 'P'로 자동 환산됩니다.
             </p>
          </div>
        </main>
      </div>
    );
  };

  /**
   * FIX: Added missing renderNonAcademic component to handle user's non-academic score inputs
   * including attendance, volunteer hours, and behavior points.
   */
  const renderNonAcademic = () => {
    if (!user) return null;
    const { attendance, volunteer, behavior } = user.nonAcademic;

    const handleUpdateAttendance = (type: 'absences' | 'tardies' | 'earlyLeaves' | 'results', gradeIdx: number, val: string) => {
      const updated = { ...user };
      const newArr = [...updated.nonAcademic.attendance[type]] as [number, number, number];
      newArr[gradeIdx] = Math.max(0, Number(val));
      updated.nonAcademic.attendance[type] = newArr;
      handleUpdateUser(updated);
    };

    const handleUpdateVolunteer = (field: string, val: any) => {
      const updated = { ...user };
      (updated.nonAcademic.volunteer as any)[field] = val;
      handleUpdateUser(updated);
    };

    const handleUpdateBehavior = (grade: 'grade1' | 'grade2' | 'grade3', field: 'base' | 'extra', val: string) => {
      const updated = { ...user };
      updated.nonAcademic.behavior[grade][field] = Number(val);
      handleUpdateUser(updated);
    };

    return (
      <div className="min-h-screen bg-white">
        <header className="px-6 py-5 border-b flex items-center gap-4 sticky top-0 z-40 bg-white shadow-sm">
          <button onClick={() => setView('academic')} className="p-2 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">비교과 성적 입력</h1>
        </header>
        <main className="p-6 space-y-10 max-w-4xl mx-auto pb-20">
          <section className="space-y-4">
            <h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              출결 상황
            </h3>
            <Card className="overflow-hidden border-slate-100 shadow-sm">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-4 font-black text-slate-400 uppercase">구분</th>
                    <th className="p-4 font-black text-slate-700">1학년</th>
                    <th className="p-4 font-black text-slate-700">2학년</th>
                    <th className="p-4 font-black text-slate-700">3학년</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['absences', 'tardies', 'earlyLeaves', 'results'] as const).map((type) => (
                    <tr key={type}>
                      <td className="p-4 font-black text-slate-500 bg-slate-50/30">
                        {type === 'absences' ? '결석' : type === 'tardies' ? '지각' : type === 'earlyLeaves' ? '조퇴' : '결과'}
                      </td>
                      {[0, 1, 2].map((gIdx) => (
                        <td key={gIdx} className="p-2">
                          <Input 
                            value={attendance[type][gIdx]} 
                            onChange={(v: string) => handleUpdateAttendance(type, gIdx, v)} 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              봉사 활동
            </h3>
            <Card className="p-6 border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  label="총 봉사 시간 (h)" 
                  value={volunteer.hours} 
                  onChange={(v: string) => handleUpdateVolunteer('hours', Number(v))} 
                />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">적용 기준</label>
                  <select 
                    value={volunteer.specialCase} 
                    onChange={(e) => handleUpdateVolunteer('specialCase', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white text-slate-700"
                  >
                    <option value="none">일반 (30시간 만점)</option>
                    <option value="30h">30시간 기준</option>
                    <option value="20h">20시간 기준</option>
                    <option value="disabled">장애학생 (만점)</option>
                  </select>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              행동발달 및 특별활동 (가산점)
            </h3>
            <Card className="overflow-hidden border-slate-100 shadow-sm">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-4 font-black text-slate-400 uppercase">학년</th>
                    <th className="p-4 font-black text-slate-700">기본 점수 (3.0)</th>
                    <th className="p-4 font-black text-slate-700">가산점 (최대 2.0)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['grade1', 'grade2', 'grade3'] as const).map((grade, idx) => (
                    <tr key={grade}>
                      <td className="p-4 font-black text-slate-500 bg-slate-50/30">{idx + 1}학년</td>
                      <td className="p-2">
                        <Input 
                          value={behavior[grade].base} 
                          onChange={(v: string) => handleUpdateBehavior(grade, 'base', v)} 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={behavior[grade].extra} 
                          onChange={(v: string) => handleUpdateBehavior(grade, 'extra', v)} 
                          max={2} 
                          step={0.5}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </main>
      </div>
    );
  };

  const renderEntrance = () => {
    if (!user) return null;
    const bookmarkedSchools = user.bookmarks.map(id => searchResults.find(s => s.id === id)).filter(Boolean) as HighSchool[];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="px-6 py-5 border-b bg-white flex items-center gap-4 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight underline underline-offset-8 decoration-blue-600 decoration-4">진학 로드맵</h1>
        </header>

        <div className="p-4 bg-white border-b sticky top-[73px] z-20 shadow-md">
          <div className="flex bg-slate-100 p-1.5 rounded-[24px] shadow-inner">
            <button 
              onClick={() => setActiveEntranceTab('bookmarks')}
              className={`flex-1 py-3.5 rounded-[20px] text-xs font-black transition-all ${activeEntranceTab === 'bookmarks' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}
            >
              MY GOALS
            </button>
            <button 
              onClick={() => setActiveEntranceTab('search')}
              className={`flex-1 py-3.5 rounded-[20px] text-xs font-black transition-all ${activeEntranceTab === 'search' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}
            >
              ALL SCHOOLS
            </button>
            <button 
              onClick={() => setActiveEntranceTab('ai')}
              className={`flex-1 py-3.5 rounded-[20px] text-xs font-black transition-all ${activeEntranceTab === 'ai' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400'}`}
            >
              AI CONSULT
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full">
          {activeEntranceTab === 'bookmarks' && (
            <div className="space-y-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><Bookmark className="w-5 h-5 text-blue-600"/> Bookmarked Targets</h2>
              {bookmarkedSchools.length === 0 ? (
                <div className="py-24 text-center space-y-4 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-inner">
                    <Bookmark className="w-10 h-10 text-slate-200" />
                  </div>
                  <p className="text-sm font-black text-slate-300">목표 고등학교를 추가하여 진학 가능성을 분석하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {bookmarkedSchools.map(school => (
                    <Card key={school.id} className="cursor-pointer hover:shadow-2xl transition-all duration-500 group border-none shadow-lg active:scale-95" onClick={() => { setSelectedSchool(school); setView('school-detail'); }}>
                      <div className="relative h-48 overflow-hidden">
                         <img src={school.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                         <div className="absolute top-4 left-4">
                           <span className="bg-blue-600 text-white px-4 py-1 rounded-xl text-[10px] font-black shadow-2xl border border-white/20 uppercase tracking-widest">{school.type}</span>
                         </div>
                         <div className="absolute bottom-4 left-6 right-6 text-white">
                            <h3 className="text-2xl font-black tracking-tight">{school.name}</h3>
                            <p className="text-xs font-bold opacity-80 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-sky-400"/> {school.location}</p>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeEntranceTab === 'search' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="학교 이름 또는 지역명 (예: 과학고, 서울)" 
                    className="w-full pl-14 pr-4 py-5 bg-white rounded-[24px] border-2 border-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none font-bold text-sm shadow-xl transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                  />
                </div>
                <Button onClick={handleGlobalSearch} loading={isSearching} className="px-10 rounded-[24px] shadow-2xl shadow-blue-100 font-black">
                   GO
                </Button>
              </div>

              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{searchTerm ? `'${searchTerm}' RESULTS` : 'HIGH SCHOOL EXPLORER'}</h3>
                {isSearching && <p className="text-[10px] text-blue-600 font-bold animate-pulse">고속 데이터 연결 중...</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(school => (
                  <Card key={school.id} className="cursor-pointer hover:shadow-2xl transition-all duration-500 border-none shadow-lg group active:scale-95 bg-white rounded-[28px] overflow-hidden" onClick={() => { setSelectedSchool(school); setView('school-detail'); }}>
                    <div className="relative h-32 overflow-hidden">
                      <img src={school.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="flex justify-between items-end">
                           <div>
                             <p className="text-[9px] font-black opacity-60 uppercase leading-none mb-1">{school.type}</p>
                             <h3 className="font-black text-base line-clamp-1 leading-tight">{school.name}</h3>
                           </div>
                           <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeEntranceTab === 'ai' && <AIAdvisorSection currentScore={Number(totalScore)} />}
        </main>
      </div>
    );
  };

  const renderSchoolDetail = () => {
    if (!selectedSchool || !user) return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="font-black text-slate-800">학교 정보를 가져오는 중...</p>
        </div>
      </div>
    );
    
    const isBookmarked = user.bookmarks.includes(selectedSchool.id);
    const [calcResult, setCalcResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const toggleBookmark = () => {
      const updated = { ...user };
      if (isBookmarked) {
        updated.bookmarks = updated.bookmarks.filter(id => id !== selectedSchool.id);
      } else {
        updated.bookmarks = [...updated.bookmarks, selectedSchool.id];
      }
      handleUpdateUser(updated);
    };

    const runConversion = async () => {
      setIsCalculating(true);
      const result = await calculateSchoolSpecificGrade(selectedSchool.name, Number(totalScore));
      setCalcResult(result);
      setIsCalculating(false);
    };

    return (
      <div className="min-h-screen bg-white">
        <header className="px-6 py-5 border-b flex justify-between items-center sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <button onClick={() => setView('entrance')} className="p-2.5 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-3">
             <button onClick={toggleBookmark} className={`p-3 rounded-2xl transition-all shadow-md ${isBookmarked ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-white' : ''}`} />
             </button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto pb-24">
          <div className="relative h-80 sm:h-96 shadow-2xl">
            <img src={selectedSchool.imageUrl} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent flex items-end p-10">
               <div className="text-white space-y-3">
                 <span className="bg-blue-600 px-4 py-1 rounded-xl text-[11px] font-black uppercase shadow-2xl border border-white/20 tracking-widest">{selectedSchool.type}</span>
                 <h1 className="text-4xl font-black tracking-tighter leading-tight">{selectedSchool.name}</h1>
                 <p className="flex items-center gap-2 text-sm font-bold opacity-80"><MapPin className="w-4 h-4 text-sky-400 shadow-sm"/> {selectedSchool.location}</p>
               </div>
            </div>
          </div>
          
          <div className="p-8 space-y-10 -mt-10 bg-white rounded-t-[48px] relative z-10 shadow-inner">
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-2 h-7 bg-blue-600 rounded-full" />
                 <h3 className="font-black text-slate-800 text-xl tracking-tight">학교 프로필</h3>
              </div>
              <Card className="p-8 bg-slate-50 border-none space-y-8 rounded-[32px] shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2 inline-block">Admission Info</h4>
                    <p className="text-sm text-slate-700 font-black leading-relaxed">{selectedSchool.eligibility}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2 inline-block">Graduate Path</h4>
                    <p className="text-sm text-slate-700 font-black leading-relaxed">{selectedSchool.progressionRate}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2 inline-block mb-4">Core Mission</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-bold italic">"{selectedSchool.description}"</p>
                </div>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-2 h-7 bg-blue-600 rounded-full" />
                 <h3 className="font-black text-slate-800 text-xl tracking-tight">성적 환산 리포트</h3>
              </div>
              <Button 
                className="w-full py-6 rounded-[32px] flex items-center justify-center gap-4 shadow-2xl shadow-blue-100 text-2xl font-black transition-all hover:scale-102" 
                onClick={runConversion}
                loading={isCalculating}
              >
                <Calculator className="w-8 h-8" />
                환산 점수 분석 시작
              </Button>

              {calcResult && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 mt-6">
                  <Card className="p-10 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white shadow-2xl shadow-blue-300 border-none rounded-[40px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                       <School className="w-56 h-56" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black opacity-50 mb-4 uppercase tracking-[0.3em] text-sky-400">Target Analytics System</p>
                      <div className="flex items-baseline gap-4 mb-8">
                        <h3 className="text-7xl font-black tracking-tighter tabular-nums">{calcResult.convertedScore}</h3>
                        <span className="text-3xl font-bold opacity-30">/ {calcResult.maxScore}</span>
                      </div>
                      <div className="p-7 bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="w-5 h-5 text-sky-400"/>
                          <p className="font-black text-xs uppercase tracking-widest text-sky-200 opacity-90">Calculation Logic</p>
                        </div>
                        <p className="text-sm leading-relaxed font-black text-sky-50 whitespace-pre-line">{calcResult.explanation}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    );
  };

  switch (view) {
    case 'splash': return renderSplash();
    case 'login': return renderLogin();
    case 'menu': return renderMenu();
    case 'academic': return renderAcademicMenu();
    case 'semester-detail': return renderSemesterDetail();
    case 'non-academic': return renderNonAcademic();
    case 'entrance': return renderEntrance();
    case 'school-detail': return renderSchoolDetail();
    default: return renderSplash();
  }
}

// --- Helper Components ---

function AIAdvisorSection({ currentScore }: { currentScore: number }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    const result = await getAIConsultation(currentScore, query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 p-10 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden border-none animate-in fade-in zoom-in-95">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <MessageSquare className="w-32 h-32" />
        </div>
        <div className="flex items-center gap-4 mb-4">
           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-md">
             <Star className="w-7 h-7 text-white" />
           </div>
           <h2 className="text-2xl font-black tracking-tighter">AI 진학 Advisor</h2>
        </div>
        <p className="text-sm font-bold opacity-90 leading-relaxed">
          화산중학교 내신 <span className="text-white text-2xl font-black decoration-white/30 decoration-4 underline underline-offset-4 mx-1">{currentScore}점</span>을 기반으로 당신의 미래를 함께 고민합니다.
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-4">Advisor Consultation</label>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="상산고 합격 가능성을 알려줘" 
            className="flex-1 px-7 py-5 rounded-[28px] border-2 border-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 shadow-xl font-black text-sm transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <Button onClick={handleAsk} loading={loading} className="px-10 rounded-[28px] shadow-2xl shadow-blue-100 font-black">
            묻기
          </Button>
        </div>
      </div>

      {response && (
        <Card className="p-10 bg-white border-none animate-in fade-in slide-in-from-bottom-8 duration-1000 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] rounded-[48px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -z-10" />
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
               <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-sky-400 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
                 <img src="https://picsum.photos/seed/ai_avatar/200" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h4 className="font-black text-slate-800 text-lg tracking-tight">Hwasan Admission Team</h4>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Intelligence Assistant</p>
               </div>
            </div>
            <div className="space-y-8 relative">
              <p className="text-base text-slate-700 leading-relaxed font-bold whitespace-pre-wrap">{response}</p>
              <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[10px] text-slate-300 font-black italic tracking-widest">“PASSION DEFINES THE FUTURE.”</p>
                <Button variant="ghost" className="text-[10px] font-black px-5 py-2.5 hover:bg-slate-50 text-slate-400 border border-slate-100 rounded-xl" onClick={() => setResponse(null)}>상담 종료</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
