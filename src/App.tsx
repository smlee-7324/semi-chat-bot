import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  RotateCcw, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  Cpu, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  User,
  Check,
  ChevronRight,
  Info,
  Layers,
  Award,
  Zap,
  Target,
  FileText,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Sliders,
  Key,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";

// Types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  level?: "junior" | "senior" | "neutral";
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const PROCESS_ITEMS = [
  { id: "wafer", label: "01. 웨이퍼 제조", eng: "Wafer", desc: "고순도 실리콘 단결정봉을 잘라 원판 웨이퍼를 만드는 첫 단계" },
  { id: "oxidation", label: "02. 산화 공정", eng: "Oxidation", desc: "웨이퍼 표면에 절연 및 보호 역할을 하는 이산화실리콘막 형성" },
  { id: "photo", label: "03. 포토 공정", eng: "Photolithography", desc: "빛을 이용해 웨이퍼 위에 미세한 회로 패턴(밑그림)을 그리는 공정" },
  { id: "etching", label: "04. 식각 공정", eng: "Etching", desc: "불필요한 물질을 제거하여 원하는 미세 회로 패턴만 남기는 공정" },
  { id: "deposition", label: "05. 증착/이온주입", eng: "Deposition & Ion Implantation", desc: "얇은 박막(Thin Film)을 입히고 이온을 주입해 반도체 성질 부여" },
  { id: "metal", label: "06. 금속배선", eng: "Metal Interconnect", desc: "전기 신호가 통할 수 있도록 금속선을 연결하는 배선 공정" },
  { id: "eds", label: "07. EDS 공정", eng: "Electrical Sort", desc: "개별 칩들의 전기적 특성 검사를 통해 불량 유무 판정 및 양품 선별" },
  { id: "packaging", label: "08. 패키징", eng: "Packaging", desc: "웨이퍼의 칩을 개별 분리하여 외부 환경으로부터 보호하고 배선 연결" },
];

const SUGGESTED_QUESTIONS = [
  { text: "포토 공정 PR Coating 목적과 현업 관리 포인트", category: "photo" },
  { text: "식각 공정에서 Dry Etching과 Wet Etching의 실무적 차이", category: "etching" },
  { text: "EDS 수율(Yield) 관리와 양산기술 직무의 연관성", category: "eds" },
  { text: "증착 공정에서 ALD(원자층 증착) 기술의 원리와 장점", category: "deposition" },
  { text: "반도체 양산라인 온도 0.1도 정밀 제어가 왜 중요한가요?", category: "all" },
];

// Elegant Custom Markdown + Table Renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split("\n");
  const parsedElements: React.ReactNode[] = [];
  
  let currentTableHeaders: string[] = [];
  let currentTableRows: string[][] = [];
  let isInsideTable = false;
  let keyCounter = 0;

  const flushTable = () => {
    if (currentTableHeaders.length > 0 || currentTableRows.length > 0) {
      parsedElements.push(
        <div key={`table-${keyCounter++}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {currentTableHeaders.map((header, idx) => (
                  <th
                    key={`th-${idx}`}
                    className="px-4 py-2.5 text-left text-xs font-bold text-slate-700 bg-slate-100/80 border-r border-slate-200 last:border-r-0"
                  >
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentTableRows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/50 transition duration-150">
                  {row.map((cell, cIdx) => (
                    <td
                      key={`td-${cIdx}`}
                      className="px-4 py-2.5 text-xs text-slate-600 border-r border-slate-200 last:border-r-0"
                    >
                      {cell.trim().replace(/\*\*(.*?)\*\*/g, "$1")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTableHeaders = [];
      currentTableRows = [];
      isInsideTable = false;
    }
  };

  const parseInlineBold = (text: string) => {
    const regex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${lastIndex}`} className="font-semibold text-slate-900">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    const result = parts.map((part) => {
      if (typeof part === "string") {
        const parenthesizedRegex = /(\([A-Za-z\s/()\-]+(?:박막|식각|노광|산화|정렬|감광액|증착|검사|포장)?\))/g;
        const subParts = [];
        let subLastIndex = 0;
        let subMatch;
        while ((subMatch = parenthesizedRegex.exec(part)) !== null) {
          if (subMatch.index > subLastIndex) {
            subParts.push(part.substring(subLastIndex, subMatch.index));
          }
          subParts.push(
            <span key={`tech-${subLastIndex}`} className="text-blue-600 font-mono text-xs bg-blue-50/80 px-1.5 py-0.5 rounded ml-1 font-semibold">
              {subMatch[1]}
            </span>
          );
          subLastIndex = parenthesizedRegex.lastIndex;
        }
        if (subLastIndex < part.length) {
          subParts.push(part.substring(subLastIndex));
        }
        return subParts.length > 0 ? subParts : part;
      }
      return part;
    });

    return result.flat();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("|")) {
      isInsideTable = true;
      const cells = line.split("|").slice(1, -1);
      
      if (line.includes("---") || line.includes("- -")) {
        continue;
      }

      if (currentTableHeaders.length === 0) {
        currentTableHeaders = cells;
      } else {
        currentTableRows.push(cells);
      }
      continue;
    } else if (isInsideTable) {
      flushTable();
    }

    if (line.startsWith("###")) {
      const cleanTitle = line.replace("###", "").trim();
      parsedElements.push(
        <div key={`h3-${i}`} className="mt-6 mb-3 font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2 text-sm md:text-base">
          <span className="w-1 h-4 bg-blue-600 rounded-sm mr-2.5 inline-block"></span>
          {parseInlineBold(cleanTitle)}
        </div>
      );
      continue;
    }

    if (line.startsWith("##")) {
      const cleanTitle = line.replace("##", "").trim();
      parsedElements.push(
        <div key={`h2-${i}`} className="mt-8 mb-4 font-extrabold text-slate-900 border-l-4 border-blue-600 pl-3 text-base md:text-lg">
          {parseInlineBold(cleanTitle)}
        </div>
      );
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const cleanItem = line.trim().substring(2);
      parsedElements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside text-slate-600 space-y-2 ml-1 my-1.5 text-xs md:text-sm">
          <li>{parseInlineBold(cleanItem)}</li>
        </ul>
      );
      continue;
    }

    if (/^\d+\./.test(line.trim())) {
      parsedElements.push(
        <p key={`num-${i}`} className="text-slate-600 my-1.5 ml-1 text-xs md:text-sm pl-4 relative">
          <span className="absolute left-0 font-semibold text-blue-600">{line.trim().match(/^\d+\./)?.[0]}</span>
          {parseInlineBold(line.trim().replace(/^\d+\.\s*/, ""))}
        </p>
      );
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    parsedElements.push(
      <p key={`p-${i}`} className="text-slate-600 leading-relaxed text-xs md:text-sm mb-2.5">
        {parseInlineBold(line)}
      </p>
    );
  }

  flushTable();

  return <div className="space-y-1">{parsedElements}</div>;
};

export default function App() {
  const [isLanding, setIsLanding] = useState(true);
  
  // Gemini API Key & Approval States
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("user_gemini_api_key") || "";
  });
  const [showApprovalPage, setShowApprovalPage] = useState(false);
  const [inputApiKey, setInputApiKey] = useState("");
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setInputApiKey(geminiApiKey);
  }, [geminiApiKey]);

  const handleRequireApiKey = (onSuccess: () => void) => {
    if (!geminiApiKey || geminiApiKey.trim() === "") {
      setKeySaveMessage({
        type: "error",
        text: "🔒 모든 온보딩 기능(대화, 퀴즈, 정밀 가이드 등)을 사용하시려면 먼저 유효한 Gemini API Key를 입력하고 승인받아야 합니다!"
      });
      setShowApprovalPage(true);
      return;
    }
    onSuccess();
  };

  const handleSaveApiKey = async (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    if (!trimmed) {
      localStorage.removeItem("user_gemini_api_key");
      setGeminiApiKey("");
      setKeySaveMessage({ type: "success", text: "Gemini API Key가 안전하게 해제되었습니다." });
      setTimeout(() => setKeySaveMessage(null), 4000);
      return;
    }

    setIsVerifyingKey(true);
    setKeySaveMessage(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        localStorage.setItem("user_gemini_api_key", trimmed);
        setGeminiApiKey(trimmed);
        setKeySaveMessage({ type: "success", text: "🔑 Gemini API Key가 정상적으로 승인 및 활성화되었습니다! 모든 기능이 잠금 해제되었습니다." });
        setTimeout(() => {
          setKeySaveMessage(null);
          setShowApprovalPage(false);
          setIsLanding(true);
        }, 2000);
      } else {
        setKeySaveMessage({ 
          type: "error", 
          text: `❌ 승인 실패: ${data.error || "입력하신 API Key가 유효하지 않습니다."}` 
        });
      }
    } catch (err: any) {
      setKeySaveMessage({ 
        type: "error", 
        text: `❌ 승인 오류: ${err.message || "네트워크 연결 또는 API 확인 실패"}` 
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };
  

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `안녕하세요! 반도체 공정 및 양산 기술 부서의 친절하고 전문적인 **온보딩 전담 멘토**입니다. 

8대 공정의 사전적 의미를 넘어, 실제 현업에서 사용하는 실무 용어, 장비 원리, 직무 기술서(JD) 너머의 생생한 팁들을 정확하고 알기 쉽게 가이드해 드리겠습니다.

**💡 이렇게 질문해 보세요:**
- "포토 공정의 PR 도포(Coating) 목적과 현업 관리 포인트를 알려주세요."
- "반도체 양산 라인의 온도 0.1도 정밀 제어가 왜 그토록 중요한가요?"
- "EDS(전기 검사) 공정과 패키징 공정의 유기적인 연관성을 알고 싶어요."

왼쪽의 공정 퀵 가이드를 활용해 멘토링을 받거나, 카테고리별 **반도체 실무 퀴즈**를 통해 실무 역량을 다져볼 수도 있습니다.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLevel, setUserLevel] = useState<"junior" | "neutral" | "senior">("neutral");
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  // Quiz state
  const [showQuizTab, setShowQuizTab] = useState(false);
  const [quizCategory, setQuizCategory] = useState("전체");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Scroll control state & refs
  const [autoScroll, setAutoScroll] = useState(true);
  const [isSmoothScroll, setIsSmoothScroll] = useState(true);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const quizScrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLanding && autoScroll) {
      const behavior = isSmoothScroll ? "smooth" : "auto";
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, [messages, isLoading, isLanding, autoScroll, isSmoothScroll]);

  const scrollToTop = () => {
    const behavior = isSmoothScroll ? "smooth" : "auto";
    if (showQuizTab) {
      quizScrollContainerRef.current?.scrollTo({ top: 0, behavior });
    } else {
      chatScrollContainerRef.current?.scrollTo({ top: 0, behavior });
    }
  };

  const scrollToBottom = () => {
    const behavior = isSmoothScroll ? "smooth" : "auto";
    if (showQuizTab) {
      if (quizScrollContainerRef.current) {
        quizScrollContainerRef.current.scrollTo({
          top: quizScrollContainerRef.current.scrollHeight,
          behavior
        });
      }
    } else {
      if (chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTo({
          top: chatScrollContainerRef.current.scrollHeight,
          behavior
        });
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    let levelPrefix = "";
    if (userLevel === "junior") {
      levelPrefix = "[질문자가 신입사원/취업준비생 수준이므로 친절한 비유와 쉬운 용어 풀어쓰기를 바탕으로 가이드해 주세요]\n";
    } else if (userLevel === "senior") {
      levelPrefix = "[질문자가 타 부서 경력자이거나 지식이 많으므로 짧은 비유 대신 기술적 정확도, 엄격한 공정 파라미터 및 구체적인 수치를 반영하여 심도 있게 가이드해 주세요]\n";
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
      level: userLevel,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) {
        headers["x-gemini-api-key"] = geminiApiKey;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: levelPrefix + text }
          ],
        }),
      });

      if (!response.ok) {
        let serverErrorMsg = "서버와의 연결이 원활하지 않습니다.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(serverErrorMsg);
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: data.text,
          timestamp: new Date(),
          level: userLevel,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: `⚠️ **오류 발생**: ${error.message || "답변을 가져오는 중 문제가 발생했습니다. 다시 시도해 주세요."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("지금까지의 멘토링 대화 내역을 초기화하시겠습니까?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `대화가 성공적으로 초기화되었습니다! 

반도체 8대 공정 및 양산기술 직무와 관련하여 궁금한 점을 새롭게 물어보세요.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleStartQuiz = async (category: string) => {
    setIsLanding(false);
    setQuizCategory(category);
    setQuizLoading(true);
    setShowQuizTab(true);
    setQuizzes([]);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setIsQuizCompleted(false);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) {
        headers["x-gemini-api-key"] = geminiApiKey;
      }

      const response = await fetch("/api/quiz", {
        method: "POST",
        headers,
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        let serverErrorMsg = "퀴즈를 불러오는 데 실패했습니다.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (e) {
          // ignore
        }
        throw new Error(serverErrorMsg);
      }

      const data = await response.json();
      setQuizzes(data);
    } catch (err: any) {
      alert(`퀴즈 생성 중 오류 발생: ${err.message || "잠시 후 다시 시도해 주세요."}`);
      setShowQuizTab(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);
    
    if (optionIndex === quizzes[currentQuizIndex].answerIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  // --- API KEY APPROVAL PAGE ---
  if (showApprovalPage) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden z-10 transition-all duration-300 hover:border-slate-700/60">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-800/80 pb-6">
            <button
              onClick={() => {
                setShowApprovalPage(false);
                setIsLanding(true);
              }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold group transition-all"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>소개 화면으로</span>
            </button>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold text-slate-400 font-mono">API APPROVAL CENTER</span>
            </div>
          </div>

          {/* Title Area */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Gemini API Key 승인 및 연동</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              본 시스템은 Google Gemini 3.5 LLM 엔진을 사용하여 반도체 현업 지식을 생성합니다.<br />
              모든 핵심 기능을 사용하기 위해 사용자의 Gemini API Key를 등록하고 검증받으세요.
            </p>
          </div>

          {/* Status Alert Badge */}
          <div className="mb-6">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              geminiApiKey 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {geminiApiKey ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">서비스 활성화 상태 (승인 완료)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      현재 귀하의 Gemini API Key가 성공적으로 검증 및 연동되어 모든 서비스(1:1 멘토링, 실무 모의 테스트, 공정 퀵 가이드)가 완벽하게 개방되었습니다.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold">서비스 제한 상태 (API 미승인)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      API 연동 승인을 받지 않아 핵심 기능이 모두 잠금 처리되어 있습니다. 기능을 잠금 해제하려면 아래 입력창에 발급받으신 Gemini API Key를 입력하여 승인 과정을 완료해 주십시오.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Input Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKeyPassword ? "text" : "password"}
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder={geminiApiKey ? "•••••••••••••••••••••••••••••••••••••" : "AIzaSy... 로 시작하는 Gemini API Key 입력"}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/80 hover:border-slate-700/80 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                  disabled={isVerifyingKey}
                />
                <button
                  type="button"
                  onClick={() => setShowKeyPassword(!showKeyPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={isVerifyingKey}
                >
                  {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {keySaveMessage && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                keySaveMessage.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {keySaveMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{keySaveMessage.text}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleSaveApiKey(inputApiKey)}
                disabled={isVerifyingKey}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 text-white font-bold text-xs py-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15"
              >
                {isVerifyingKey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>승인 여부 실시간 확인 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>API Key 검증 및 연동 승인</span>
                  </>
                )}
              </button>

              {geminiApiKey && (
                <button
                  onClick={() => {
                    setInputApiKey("");
                    handleSaveApiKey("");
                  }}
                  disabled={isVerifyingKey}
                  className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 border border-slate-700/60 font-semibold text-xs py-3.5 px-5 rounded-xl transition duration-150"
                >
                  연동 승인 해제
                </button>
              )}
            </div>
          </div>

          {/* Quick Help Guide */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-[11px] font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Gemini API Key 발급 방법</span>
            </h4>
            <ol className="list-decimal list-inside text-[11.5px] text-slate-400 space-y-2 leading-relaxed">
              <li>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>Google AI Studio API 키 발급 페이지</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                에 접속합니다. (Google 계정 필요)
              </li>
              <li>공간 생성을 수락하고 <strong className="text-slate-300">"Create API key"</strong> 파란색 버튼을 클릭합니다.</li>
              <li>생성된 키(<code className="bg-slate-950 font-mono px-1 py-0.5 rounded text-blue-400">AIzaSy...</code>)를 복사하여 위의 입력창에 넣고 승인을 누릅니다.</li>
            </ol>
            <div className="mt-5 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>로컬 보안: 데이터는 사용자의 브라우저 LocalStorage에만 암호화 안전 저장됩니다.</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- LANDING PAGE COMPONENT ---
  if (isLanding) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col overflow-x-hidden font-sans select-none">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Global Navigation Header */}
        <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-sm bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
              <Cpu className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight block">Onboarding Mentor</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider block uppercase">Semiconductor Guidance v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => setShowApprovalPage(true)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition duration-150 ${
                geminiApiKey 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/35" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/35 animate-pulse"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{geminiApiKey ? "API 승인 완료" : "API 키 승인 센터"}</span>
            </button>
            
            <button 
              onClick={() => handleRequireApiKey(() => { setIsLanding(false); setShowQuizTab(false); })}
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/40 transition duration-150 flex items-center gap-1"
            >
              {!geminiApiKey && <Lock className="w-3.5 h-3.5 text-slate-500" />}
              대화방 입장
            </button>
            <button 
              onClick={() => handleRequireApiKey(() => { setIsLanding(false); setShowQuizTab(false); })}
              className="relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-150"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {!geminiApiKey && <Lock className="w-3.5 h-3.5 text-blue-200" />}
                실무 멘토링 시작
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-16 pb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-blue-400 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>반도체 신입사원 & 취업준비생 필수 온보딩 플랫폼</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
            반도체 현업의 장벽을 낮추는 <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
              가장 확실한 1:1 온보딩 멘토
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed mb-10">
            직무기술서(JD) 상의 표면적인 설명에 답답하셨나요? <br className="hidden sm:inline" />
            실제 현업(공정/양산기술)에서 통제하는 8대 공정의 핵심 원리와 세부 장비 제어 포인트, 수율 결정 요소를 일상적인 비유와 시각화 지표로 일목요연하게 풀어 드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <button
              onClick={() => handleRequireApiKey(() => { setIsLanding(false); setShowQuizTab(false); })}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-blue-500/10 transition duration-150 flex items-center justify-center gap-2"
            >
              {geminiApiKey ? <Cpu className="w-4 h-4" /> : <Lock className="w-4 h-4 text-blue-200" />}
              1:1 멘토링 챗봇 시작
            </button>
            <button
              onClick={() => handleRequireApiKey(() => handleStartQuiz("전체"))}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60 text-sm font-semibold py-3.5 px-6 rounded-2xl transition duration-150 flex items-center justify-center gap-2"
            >
              {geminiApiKey ? <GraduationCap className="w-4 h-4 text-blue-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
              실무 퀴즈로 역량 진단
            </button>
          </div>

        </section>

        {/* Feature Bento Grid */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-white">현업에서 통하는 온보딩 멘토의 4가지 강점</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2">단순 지식 전달이 아닌 현직 스페셜리스트의 핵심을 담았습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Strengths Card 1 */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition duration-200">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">실제 현업 의미 매핑</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                "균일 도포" 등 단순한 기술서상 표현을 넘어, 실제 양산 라인에서 수율(Yield)과 어떤 직무 관계로 연결되는지 짚어줍니다.
              </p>
            </div>

            {/* Strengths Card 2 */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">3단계 맞춤형 멘토링</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                🐣신입/취준생용 쉬운 비유 설명부터, 💻경력자/타직무용 정밀 공정 조건 및 수치 중심의 명확한 기술 설명까지 유동적 제어.
              </p>
            </div>

            {/* Strengths Card 3 */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition duration-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">화살표/표 데이터 시각화</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                공정 선후관계와 복잡한 장비 구조 및 핵심 관리 인자(Control Point)를 일목요연한 텍스트 다이어그램과 표로 시각화합니다.
              </p>
            </div>

            {/* Strengths Card 4 */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/80 transition duration-200">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                <GraduationCap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">AI 기반 실무 모의테스트</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                8대 공정 분야별로 현직 멘토가 엄선한 4지선다 객관식 퀴즈와 친절한 한줄 코칭 오답 노트를 통해 실무 역량을 점검하세요.
              </p>
            </div>
          </div>
        </section>

        {/* 8-Major Processes Quick Navigator */}
        <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 border-t border-slate-800/60">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest block mb-2">Semiconductor Roadmap</span>
            <h2 className="text-lg md:text-xl font-bold text-white">미리보기: 반도체 8대 공정 핵심 맥락</h2>
            <p className="text-xs text-slate-400 mt-1">각 공정을 클릭해 멘토가 안내하는 대표적인 현업 관리의 실체와 핵심 키워드를 미리 탐색하세요.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROCESS_ITEMS.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleRequireApiKey(() => {
                  setSelectedProcessId(item.id);
                  setIsLanding(false);
                })}
                className="group relative bg-slate-800/20 hover:bg-slate-800/40 border border-slate-800 hover:border-blue-500/40 p-4.5 rounded-xl transition duration-150 text-left cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full group-hover:from-blue-500/10 transition duration-150"></div>
                <span className="text-[10px] font-mono text-blue-400 font-bold tracking-wide">STAGE 0{index + 1}</span>
                <h4 className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1 group-hover:text-white transition duration-150">
                  {item.label.split(". ")[1]}
                  <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Info & Safety Policy Board */}
        <section className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 mb-12 bg-slate-800/20 border border-slate-800/80 rounded-2xl">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">반도체 보안 및 정보 안전 가이드라인 준수</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                특정 장비의 폐쇄적 벤더사 기밀 정보, 각 수율 데이터, 보안 레시피 및 확인되지 않은 비공개 공정 파라미터는 답변에서 제외되며 엄격히 보호됩니다. 통상적인 기성 기술 및 전공 서적 수준의 공정 가이드를 친절하고 정확하게 학습할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="mt-auto py-8 border-t border-slate-800/80 bg-slate-950 text-center select-none relative z-10">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 font-mono">Semiconductor Onboarding Specialist 2026</span>
            </div>
            <p className="text-[11px] text-slate-500">
              본 시스템은 Google Gemini 3.5 LLM 인프라 및 전용 도식화 템플릿을 사용하여 실시간 교육 가이드를 생성합니다.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // --- MAIN APP (CHAT & QUIZ) COMPONENT ---
  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* LEFT SIDEBAR - Process List & Quiz Section */}
      <aside className="w-80 bg-[#1E293B] text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-700 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <button 
            onClick={() => setIsLanding(true)}
            className="flex items-center gap-2 group text-left hover:opacity-95 transition"
          >
            <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 group-hover:bg-blue-600/20">
              <ChevronLeft className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                소개 페이지로
              </h2>
              <p className="text-[9px] text-slate-400 tracking-wider">Onboarding Info</p>
            </div>
          </button>
          <span className="bg-blue-900/50 text-blue-300 border border-blue-800/80 text-[10px] px-2 py-0.5 rounded font-semibold">
            v2.0
          </span>
        </div>

        {/* Level Indicator Summary */}
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>멘토링 수준:</span>
          </div>
          <span className="font-semibold text-white bg-slate-700 px-2 py-0.5 rounded text-[11px]">
            {userLevel === "junior" ? "🐣 신입/취준생" : userLevel === "senior" ? "💻 경력자/타직무" : "⚙️ 일반/절충형"}
          </span>
        </div>

        {/* 8-Major Process Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="flex items-center justify-between px-2 py-1 mb-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
            <span>반도체 8대 핵심 공정</span>
            <BookOpen className="w-3.5 h-3.5" />
          </div>

          {PROCESS_ITEMS.map((item) => {
            const isSelected = selectedProcessId === item.id;
            return (
              <div
                key={item.id}
                className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                  isSelected
                    ? "bg-[#334155] border-blue-500/80 text-white shadow-sm"
                    : "bg-[#1E293B] border-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white"
                }`}
                onClick={() => {
                  setSelectedProcessId(isSelected ? null : item.id);
                  if (showQuizTab) setShowQuizTab(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? "text-blue-400" : "text-slate-200"}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 uppercase">
                    {item.eng}
                  </span>
                </div>
                
                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] text-slate-300 leading-relaxed transition-all duration-300">
                    <p className="mb-3 text-slate-400">{item.desc}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendMessage(`${item.label} (${item.eng})의 현업 양산 관리 핵심 포인트와 장비 원리를 시각화 표와 함께 자세히 가이드해줘.`);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        멘토 질문
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartQuiz(item.label.split(". ")[1]);
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/80 font-medium text-[10px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <GraduationCap className="w-3 h-3" />
                        퀴즈 풀기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-6 pt-2">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-400">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span>실무 역량 자가 검증</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">반도체 온보딩 모의 평가</h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                8대 공정의 이론 및 현업 실무 노하우를 점검할 수 있는 퀴즈 세션에 참여해 보세요.
              </p>
              <button
                onClick={() => handleStartQuiz("전체")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition duration-150 flex items-center justify-center gap-1.5"
              >
                <span>종합 실무 퀴즈 풀기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#161F30] text-center text-[11px] text-slate-500">
          <span>© 2026 Semiconductor Onboarding Mentor</span>
        </div>
      </aside>

      {/* MAIN VIEW - Chat or Quiz Panel */}
      <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
        {/* Top Header/Navigation */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLanding(true)}
              className="font-bold text-slate-800 text-sm tracking-wide hover:text-blue-600 transition flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>반도체 온보딩 멘토 챗봇</span>
            </button>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
              시스템 정상
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              <button
                onClick={() => setUserLevel("junior")}
                className={`px-2.5 py-1 rounded-md font-medium transition duration-150 ${
                  userLevel === "junior" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="신입사원 및 취업 준비생 대상 (쉬운 비유, 친절한 용어 풀이)"
              >
                🐣 신입/취준생
              </button>
              <button
                onClick={() => setUserLevel("neutral")}
                className={`px-2.5 py-1 rounded-md font-medium transition duration-150 ${
                  userLevel === "neutral" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="밸런스형 설명"
              >
                ⚖️ 일반
              </button>
              <button
                onClick={() => setUserLevel("senior")}
                className={`px-2.5 py-1 rounded-md font-medium transition duration-150 ${
                  userLevel === "senior" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="타 직무/경력자 대상 (정밀 공정 설명, 구체적인 수치와 기술 중심)"
              >
                💻 경력자
              </button>
            </div>



            <button
              onClick={() => setShowApprovalPage(true)}
              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition duration-150 flex items-center gap-1.5"
              title="API Key 승인 및 관리"
            >
              <Key className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold hidden sm:inline">API 승인 관리</span>
            </button>

            <button
              onClick={handleResetChat}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition duration-150"
              title="대화 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat / Quiz Panel Toggle View */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {showQuizTab ? (
            /* --- QUIZ VIEW SECTION --- */
            <div className="flex-1 relative min-h-0 bg-slate-50">
              <div ref={quizScrollContainerRef} className="absolute inset-0 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  
                  <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                    <div>
                      <span className="bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Semiconductor Mini Test
                      </span>
                      <h3 className="text-sm font-bold mt-1">반도체 실무 자가 진단 - {quizCategory}</h3>
                    </div>
                    <button
                      onClick={() => setShowQuizTab(false)}
                      className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition duration-150"
                    >
                      챗봇으로 돌아가기
                    </button>
                  </div>

                  {quizLoading ? (
                    <div className="flex-1 py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-medium text-slate-600">멘토가 실무 맞춤형 엄선 퀴즈 3문제를 생성 중입니다...</p>
                      <p className="text-xs text-slate-400 mt-1">잠시만 기다려 주세요.</p>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="flex-1 py-12 flex flex-col items-center justify-center text-center px-6">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                      <p className="text-sm font-medium text-slate-700">퀴즈를 생성하지 못했습니다.</p>
                      <button
                        onClick={() => handleStartQuiz(quizCategory)}
                        className="mt-4 bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-medium"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : !isQuizCompleted ? (
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-slate-500 font-medium">
                          문제 {currentQuizIndex + 1} / {quizzes.length}
                        </span>
                        <div className="w-32 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-base font-bold text-slate-800 leading-snug">
                          {quizzes[currentQuizIndex].question}
                        </h4>
                      </div>

                      <div className="space-y-2.5 mb-6">
                        {quizzes[currentQuizIndex].options.map((option, idx) => {
                          const isSelected = selectedAnswer === idx;
                          const isCorrectAnswer = idx === quizzes[currentQuizIndex].answerIndex;
                          let optionStyle = "border-slate-200 hover:bg-slate-50 bg-white";
                          let statusIcon = null;

                          if (selectedAnswer !== null) {
                            if (isSelected) {
                              if (isCorrectAnswer) {
                                optionStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-900";
                                statusIcon = <CheckCircle className="w-4 h-4 text-emerald-600" />;
                              } else {
                                optionStyle = "border-rose-500 bg-rose-50/70 text-rose-900";
                                statusIcon = <XCircle className="w-4 h-4 text-rose-600" />;
                              }
                            } else if (isCorrectAnswer) {
                              optionStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-900";
                              statusIcon = <CheckCircle className="w-4 h-4 text-emerald-600" />;
                            } else {
                              optionStyle = "border-slate-200 opacity-60 bg-white";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectAnswer(idx)}
                              disabled={selectedAnswer !== null}
                              className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium flex items-center justify-between transition-all duration-150 ${optionStyle}`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                                  isSelected ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-500"
                                }}`}>
                                  {idx + 1}
                                </span>
                                <span>{option}</span>
                              </span>
                              {statusIcon}
                            </button>
                          );
                        })}
                      </div>

                      {selectedAnswer !== null && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-6 animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            <span>멘토의 실무 한줄 코칭</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {quizzes[currentQuizIndex].explanation}
                          </p>
                        </div>
                      )}

                      <div className="mt-auto flex justify-end">
                        <button
                          onClick={handleNextQuizQuestion}
                          disabled={selectedAnswer === null}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
                            selectedAnswer === null
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-500 text-white"
                          }`}
                        >
                          <span>{currentQuizIndex === quizzes.length - 1 ? "결과 보기" : "다음 문제"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 flex-1 flex flex-col items-center text-center justify-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">퀴즈를 모두 완료했습니다!</h4>
                      <p className="text-xs text-slate-500 mb-6">수고하셨습니다. 정답률을 기반으로 멘토 피드백을 확인하세요.</p>

                      <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-5 w-full max-w-sm mb-6 flex justify-around">
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">카테고리</span>
                          <span className="text-sm font-extrabold text-slate-800">{quizCategory}</span>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">맞춘 문항</span>
                          <span className="text-sm font-extrabold text-slate-800">{quizScore} / {quizzes.length}</span>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">성취도</span>
                          <span className="text-sm font-extrabold text-blue-600">
                            {Math.round((quizScore / quizzes.length) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-blue-50/50 p-4 border border-blue-100 rounded-xl leading-relaxed max-w-md mb-8">
                        {quizScore === quizzes.length ? (
                          "🌟 대단합니다! 반도체 8대 공정의 핵심과 현업 실무 포인트를 완벽하게 이해하고 있습니다. 즉시 현업 프로젝트에 투입되어도 훌륭히 적응할 실력입니다!"
                        ) : quizScore >= 2 ? (
                          "👍 훌륭합니다! 전반적인 핵심 지식의 맥락을 잘 파악하고 있습니다. 애매했던 오답 가이드를 한 번 더 보며 수율 관리 요소를 보완하면 완벽합니다."
                        ) : (
                          "🐣 괜찮습니다! 이제 입사한 신입사원이거나 준비 단계이므로 용어와 원리가 낯선 것이 지극히 당연합니다. 온보딩 멘토에게 구체적인 질문을 보내 이해도를 다져나가 보세요."
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStartQuiz(quizCategory)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150"
                        >
                          다시 도전하기
                        </button>
                        <button
                          onClick={() => setShowQuizTab(false)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition duration-150"
                        >
                          멘토링 대화방으로 가기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Scroll Control Panel for Quiz */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30 select-none">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2 flex flex-col items-center gap-1.5 transition-all duration-200 hover:shadow-2xl">
                  {/* Scroll to Top */}
                  <button 
                    onClick={scrollToTop} 
                    className="w-9 h-9 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-150 group"
                    title="맨 위로 스크롤"
                  >
                    <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                  <div className="w-6 h-px bg-slate-100" />

                  {/* Auto Scroll Option */}
                  <button 
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative ${
                      autoScroll 
                        ? "bg-blue-50 text-blue-600" 
                        : "hover:bg-slate-50 text-slate-400"
                    }`}
                    title={`자동 스크롤: ${autoScroll ? "켜짐" : "꺼짐"}`}
                  >
                    <span className="text-[8px] font-extrabold tracking-wide">AUTO</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${autoScroll ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`}></span>
                  </button>

                  {/* Smooth Scroll Option */}
                  <button 
                    onClick={() => setIsSmoothScroll(!isSmoothScroll)}
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative ${
                      isSmoothScroll 
                        ? "bg-indigo-50 text-indigo-600" 
                        : "hover:bg-slate-50 text-slate-400"
                    }`}
                    title={`스크롤 효과: ${isSmoothScroll ? "부드럽게" : "빠르게"}`}
                  >
                    <span className="text-[8px] font-extrabold tracking-wide">SMOOTH</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSmoothScroll ? "bg-indigo-600" : "bg-slate-300"}`}></span>
                  </button>

                  <div className="w-6 h-px bg-slate-100" />

                  {/* Scroll to Bottom */}
                  <button 
                    onClick={scrollToBottom} 
                    className="w-9 h-9 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-150 group"
                    title="맨 아래로 스크롤"
                  >
                    <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- DEFAULT CHAT VIEW --- */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 relative min-h-0">
                <div ref={chatScrollContainerRef} className="absolute inset-0 overflow-y-auto px-6 py-6 space-y-6">
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 select-none shadow-sm ${
                          isUser 
                            ? "bg-blue-100 text-blue-600 border border-blue-200" 
                            : "bg-slate-800 text-slate-100 border border-slate-700"
                        }`}>
                          {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4 text-blue-400" />}
                        </div>

                        <div className="flex flex-col space-y-1 max-w-[85%]">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 select-none">
                            <span className="font-semibold text-slate-500">
                              {isUser ? "나 (Onboarding Client)" : "온보딩 멘토 (Process Specialist)"}
                            </span>
                            <span>•</span>
                            <span>
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className={`p-4 rounded-2xl text-slate-700 shadow-sm relative ${
                            isUser 
                              ? "bg-blue-600 text-white font-medium" 
                              : "bg-white border border-slate-200/80 text-slate-800"
                          }`}>
                            {!isUser && msg.id !== "welcome" && (
                              <div className="absolute -top-3 left-4 bg-blue-50 border border-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded text-[10px] shadow-sm select-none">
                                {msg.level === "junior" ? "🐣 신입/취준생 맞춤 멘토링" : msg.level === "senior" ? "💻 실무/전문가용 깊이" : "⚖️ 일반 온보딩 가이드"}
                              </div>
                            )}

                            {isUser ? (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            ) : (
                              <MarkdownRenderer content={msg.content} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-3 mr-auto max-w-4xl">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <div className="text-[11px] text-slate-400">
                          <span>온보딩 멘토가 분석 중...</span>
                        </div>
                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-3">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">현업 매핑 및 가이드 정리 중</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating Scroll Control Panel for Chat */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30 select-none">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2 flex flex-col items-center gap-1.5 transition-all duration-200 hover:shadow-2xl">
                    {/* Scroll to Top */}
                    <button 
                      onClick={scrollToTop} 
                      className="w-9 h-9 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-150 group"
                      title="맨 위로 스크롤"
                    >
                      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    <div className="w-6 h-px bg-slate-100" />

                    {/* Auto Scroll Option */}
                    <button 
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative ${
                        autoScroll 
                          ? "bg-blue-50 text-blue-600" 
                          : "hover:bg-slate-50 text-slate-400"
                      }`}
                      title={`자동 스크롤: ${autoScroll ? "켜짐" : "꺼짐"}`}
                    >
                      <span className="text-[8px] font-extrabold tracking-wide">AUTO</span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${autoScroll ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`}></span>
                    </button>

                    {/* Smooth Scroll Option */}
                    <button 
                      onClick={() => setIsSmoothScroll(!isSmoothScroll)}
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative ${
                        isSmoothScroll 
                          ? "bg-indigo-50 text-indigo-600" 
                          : "hover:bg-slate-50 text-slate-400"
                      }`}
                      title={`스크롤 효과: ${isSmoothScroll ? "부드럽게" : "빠르게"}`}
                    >
                      <span className="text-[8px] font-extrabold tracking-wide">SMOOTH</span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSmoothScroll ? "bg-indigo-600" : "bg-slate-300"}`}></span>
                    </button>

                    <div className="w-6 h-px bg-slate-100" />

                    {/* Scroll to Bottom */}
                    <button 
                      onClick={scrollToBottom} 
                      className="w-9 h-9 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-150 group"
                      title="맨 아래로 스크롤"
                    >
                      <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions Panel */}
              <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 overflow-x-auto flex items-center gap-2 select-none custom-scrollbar whitespace-nowrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  실무 핵심 추천 Q&A
                </span>
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    className="bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200/50 text-slate-600 text-xs px-3 py-1.5 rounded-full transition duration-150 inline-flex items-center gap-1 font-medium shadow-sm"
                  >
                    <span>{q.text}</span>
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </button>
                ))}
              </div>

              {/* Bottom Chat Input Form */}
              <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    placeholder="[여기에 질문을 입력하세요] 반도체 용어, 장비 원리 등 현업 지식을 물어보세요."
                    className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-sm h-11 px-5 rounded-full outline-none border border-transparent focus:border-blue-500 transition-all duration-150 shadow-inner"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2.5 shadow-sm transition duration-150 flex items-center justify-center flex-shrink-0"
                    title="전송"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-3 text-[10.5px] text-slate-400 select-none">
                  <p className="flex items-center gap-1">
                    <span>💡 특정 기업 기밀, 미공개 레시피 또는 수율 정보는 답변되지 않으며 일반 지식 수준까지만 제공됩니다.</span>
                  </p>
                  <p className="font-mono">
                    Target: {userLevel === "junior" ? "Junior (신입/취준)" : userLevel === "senior" ? "Senior (경력자)" : "General (공통)"}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
