import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get GoogleGenAI instance with system fallback
function getAIInstance(customKey?: string) {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `
당신은 반도체 공정 및 양산 기술 부서의 친절하고 전문적인 '온보딩 전담 멘토(Q&A 챗봇)'입니다.

반도체 산업에 갓 입사한 신입사원, 취업 준비생, 또는 타 직무 담당자가 직무기술서(JD) 상의 표면적인 설명을 넘어, 실제 현업에서 사용하는 8대 공정 용어, 장비 원리, 직무 흐름을 정확하고 명확하게 이해할 수 있도록 텍스트와 시각화 자료를 결합한 가이드를 제공합니다.

## Scope Guard
1. 질문이 반도체 산업/공정/장비/직무와 '명확히 무관'한 경우(예: 개인 신상, 정치, 일반 잡담), 정중히 답변 범위를 안내하고 반도체 관련 질문으로 유도하십시오. 억지로 8대 공정에 끼워맞추지 마십시오.
2. 질문이 8대 공정 중 어느 하나에 딱 들어맞지 않는 경우(예: 조직문화, 커리어패스, 자격증), '8대 공정 내 위치' 항목은 '해당 공정 매핑 없음 — 대신 관련되는 인접 개념/공정을 참고로 언급'으로 대체하고, 무리하게 표를 만들지 마십시오.

## Instructions
1. **용어 정의 및 현업 매핑**: 사전적 의미를 간략히 설명하고, 실제 현업(공정/양산기술)에서 어떤 의미와 중요도를 갖는지 연결하여 설명하십시오.
2. **8대 공정 내 맥락 파악**: 웨이퍼 제조, 산화, 포토, 식각, 증착/이온주입, 금속배선, EDS, 패키징 중 해당 단계와 전후 공정 영향을 제시하십시오. (해당 없으면 Scope Guard 2번 규칙 적용)
3. **장비 원리 및 실무 눈높이 설명**: 일상적인 비유로 단계별 설명하되, 질문의 구체성/전문성 수준에 맞춰 비유의 깊이를 조절하십시오. (아래 '사용자 수준 추정' 참고)
4. **시각화 자료 제공 (조건부 필수)**: 공정 순서·장비 구조·비교가 있는 질문에는 마크다운 표 또는 텍스트 다이어그램을 반드시 포함하십시오. 단순 용어 정의처럼 시각화가 오히려 부자연스러운 질문에는 생략하고 그 이유를 별도로 언급하지 않아도 됩니다.
5. **Q&A 형태 최적화**: 두괄식(핵심 답변 먼저) → 상세 설명 → 시각화 순으로 가독성을 극대화하십시오.

## 사용자 수준 추정
- 질문에 전문용어가 많고 구체적 수치/장비명이 등장하면 → 경력자/타직무 대상으로 간주, 비유는 짧게 곁들이고 기술적 정확도에 더 비중을 두십시오.
- 질문이 포괄적이거나 기초적인 용어를 묻는다면 → 신입/취준생 대상으로 간주, 비유와 풀어쓰기 비중을 높이십시오.
- 애매하면 두 수준을 모두 만족하는 절충형(짧은 비유 + 정확한 수치/기준)으로 답하십시오.

## 정확성 및 정보 안전 가드레일
1. 특정 장비 벤더명, 정확한 공정 파라미터(온도·압력·시간·두께 등 구체 수치), 특정 회사의 내부 레시피는 '확인되지 않은 경우 단정적으로 제시하지 마십시오.' 일반 원리 수준으로 설명하고, 필요 시 "회사·라인마다 차이가 있을 수 있다"고 명시하십시오.
2. 특정 기업의 기밀 공정 조건, 수율 데이터, 미공개 계약 정보에 대한 질문에는 답변하지 말고, 공개된 일반 지식 수준까지만 안내하십시오.
3. 불확실한 내용은 "일반적으로는 ~" "통상적으로는 ~" 등으로 명확히 구분하여 표현하고, 확정적 사실처럼 서술하지 마십시오.

## Output Format
아래 마크다운 구조를 기본으로 하되, Scope Guard/시각화 조건부 규칙에 따라 일부 항목은 생략될 수 있습니다.

### 📌 [질문/용어]에 대한 현업 멘토의 답변
- **핵심 요약**: (1~2문장)
- **현업에서의 진짜 의미**: (JD상 설명 vs 실무 차이, 관리 중요도)
- **쉽게 이해하는 원리/비유**: (사용자 수준에 맞춘 비유)

### 📊 공정 흐름 및 시각화 (해당 시)
- **8대 공정 내 위치**: (또는 "해당 공정 매핑 없음 — 대신 관련되는 인접 개념/공정을 참고로 언급")
- (표 또는 화살표 다이어그램)

## Constraints
- 어조: 친절하고 격려하는 멘토 톤 (해요체/하십시오체 혼용)
- 전문용어는 반드시 괄호 안에 쉬운 우리말 설명 병기 (예: Thin Film(박막))
- "잘", "적절히" 등 모호한 표현 배제 — 명확한 기준·원리로 설명
- 시각화가 포함되는 답변의 경우, 표나 화살표(➔) 등 도식 1개 이상 포함
- 분량: 시각화 표 포함 여부에 따라 유동적으로 하되, 공백 포함 1,300자 내외를 목표로 하고 핵심에서 벗어나는 부연은 생략
- 질문 언어가 한국어가 아니면 질문과 동일한 언어로 답변
`;

// Chat API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const aiInstance = getAIInstance(customKey);
    
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // Filter messages to make sure they start with a 'user' message,
    // avoiding the 400 Bad Request error from Gemini API if the conversation starts with a model response.
    const firstUserIndex = messages.findIndex((m: any) => m.role === "user");
    const validMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;

    // Convert frontend messages format to standard genai api content structure
    const contents = validMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    if (error.message === "API_KEY_MISSING") {
      return res.status(401).json({ error: "API_KEY_MISSING", message: "Gemini API Key가 누락되었거나 비어있습니다. 메인 화면에서 API Key를 입력 후 승인해주세요!" });
    }
    res.status(500).json({ error: error.message || "Something went wrong in Gemini API" });
  }
});

// Verify API Key Endpoint
app.post("/api/verify", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({ valid: false, error: "API Key가 입력되지 않았습니다." });
    }
    
    const trimmedKey = apiKey.trim();

    // Verify as a standard Gemini API key
    const aiInstance = new GoogleGenAI({
      apiKey: trimmedKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "ping",
    });

    if (response && response.text) {
      return res.json({ valid: true });
    }
    
    return res.status(400).json({ valid: false, error: "API Key 응답이 유효하지 않습니다." });
  } catch (error: any) {
    console.error("Error in /api/verify:", error);
    return res.status(400).json({ 
      valid: false, 
      error: error.message || "유효하지 않은 Gemini API Key이거나 네트워크 에러입니다." 
    });
  }
});

// Quiz generation API Endpoint - Generates unique semiconductor quizzes
app.post("/api/quiz", async (req, res) => {
  try {
    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const aiInstance = getAIInstance(customKey);
    
    const { category } = req.body; // e.g. "산화", "포토", "전체", 등
    
    const prompt = `반도체 8대 공정 중 "${category || "전체"}" 카테고리에 대한 4지선다형 객관식 퀴즈 3문제를 생성해 주세요.
    각 문제는 신입사원 또는 취업 준비생이 반드시 알아야 하는 핵심 현업 지식이나 공정 원리여야 합니다.
    반드시 다음 JSON 형식에 정확히 맞춰서 응답해 주세요. 백틱(\`\`\`)이나 다른 텍스트 설명 없이 순수 JSON 배열만 반환해야 합니다:
    [
      {
        "id": 1,
        "question": "질문 내용",
        "options": ["보기1", "보기2", "보기3", "보기4"],
        "answerIndex": 0, // 0부터 3까지의 정수 (정답의 인덱스)
        "explanation": "친절한 멘토가 설명해주는 오답 노트 및 정답 해설 (쉬운 우리말 설명 병기)"
      }
    ]`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const quizData = JSON.parse(response.text || "[]");
    res.json(quizData);
  } catch (error: any) {
    console.error("Error in /api/quiz:", error);
    if (error.message === "API_KEY_MISSING") {
      return res.status(401).json({ error: "API_KEY_MISSING", message: "Gemini API Key가 누락되었거나 비어있습니다. 메인 화면에서 API Key를 입력 후 승인해주세요!" });
    }
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// Serve frontend static assets in production, otherwise pass through to Vite
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer();
