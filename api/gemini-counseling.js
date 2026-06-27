/**
 * [보안 안내]
 * - 프론트엔드에 API 키를 직접 넣으면 개발자 도구(Network/Source 탭)에서 노출됩니다.
 * - Gemini API 호출은 반드시 이 Vercel Serverless Function에서만 처리합니다.
 * - .env / .env.local 파일은 절대 GitHub에 커밋하지 마세요 (.gitignore에 등록).
 * - Vercel 배포 시: Project Settings → Environment Variables 에 GEMINI_API_KEY 를 등록하세요.
 * - Gemini로 전송하는 데이터는 학생 이름·학번·사진 경로를 제외한 최소 정보로 제한합니다.
 */

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // 환경 변수 확인 (코드 내에 API 키를 절대 직접 적지 않습니다)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.",
    });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body || {};

  // 필수 값 검증
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error: "studentAlias, gradeSummary, learningTraits, teacherConcern 은 모두 필수입니다.",
    });
  }

  // Gemini에게 보낼 프롬프트 구성
  // - 학생을 단정적으로 판단/진단하지 않도록 명시
  // - 교사가 학생을 이해하고 대화할 수 있는 방향으로 응답 유도
  const prompt = `
당신은 교사를 지원하는 학생 상담 전략 도우미입니다.
아래 학생 데이터와 교사의 고민을 바탕으로 상담 전략을 제안하세요.

[중요 원칙]
- 학생을 단정적으로 판단하거나 진단하지 마세요.
- "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다" 같은 단정적인 표현은 피하세요.
- 교사가 학생을 이해하고 열린 대화를 할 수 있도록 돕는 방향으로 응답하세요.
- 상담 전략은 참고용이며, 최종 판단은 교사가 학생의 상황을 종합적으로 고려해 내린다는 점을 반드시 안내하세요.

[학생 데이터 (익명)]
- 식별 코드: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성: ${learningTraits}

[교사 고민]
${teacherConcern}

[응답 형식] 아래 6개 항목을 순서대로, 각 항목 앞에 번호와 제목을 붙여 작성하세요.

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원
`.trim();

  try {
    // Gemini REST API 호출 (내장 fetch, SDK 미사용)
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API 오류:", errText);
      return res.status(502).json({
        success: false,
        error: `Gemini API 호출 실패 (${geminiResponse.status})`,
      });
    }

    const geminiData = await geminiResponse.json();
    const result =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!result) {
      return res.status(502).json({
        success: false,
        error: "Gemini 응답에서 텍스트를 추출하지 못했습니다.",
      });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("서버리스 함수 오류:", err);
    return res.status(500).json({
      success: false,
      error: "서버 내부 오류가 발생했습니다.",
    });
  }
}
