/**
 * [보안 안내]
 * - 이 파일(프론트엔드)에는 Gemini API 키를 절대 넣지 마세요.
 *   개발자 도구의 Sources/Network 탭에서 누구나 볼 수 있습니다.
 * - Gemini API 호출은 /api/gemini-counseling (Vercel Serverless Function)에서만 처리합니다.
 * - .env / .env.local 파일은 GitHub에 올리지 마세요.
 * - Vercel 배포 시 Project Settings → Environment Variables 에 GEMINI_API_KEY 를 등록하세요.
 * - Gemini에 전송하는 데이터는 학생 이름·학번·사진 경로를 제외한 최소 정보로 제한합니다.
 */

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

// 학생 인덱스 → 익명 별칭 (Gemini 전송 시 이름·학번 대신 사용)
const STUDENT_ALIASES = ["학생 A", "학생 B", "학생 C"];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map((student, index) => renderStudentCard(student, index)).join("")}
    </section>

    ${renderCounselingPanel()}
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");

  // 상담 패널 이벤트 바인딩
  bindCounselingPanel();
}

function renderStudentCard(student, index) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <button
          class="counseling-select-btn primary-button"
          type="button"
          data-student-index="${index}"
          aria-label="${student.name} 학생 상담 전략 요청"
        >
          🤖 상담 전략 요청
        </button>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

// ─── AI 상담 전략 도우미 패널 ─────────────────────────────────────────────

function renderCounselingPanel() {
  return `
    <section class="counseling-panel" aria-labelledby="counselingPanelTitle">
      <div class="counseling-panel-header">
        <div>
          <p class="eyebrow">AI Assistant</p>
          <h2 id="counselingPanelTitle">AI 학생 상담 전략 도우미</h2>
          <p class="counseling-panel-desc">학생 카드의 <strong>상담 전략 요청</strong> 버튼을 누른 뒤, 상담 고민을 입력하면 Gemini가 전략을 제안합니다.</p>
        </div>
      </div>

      <!-- 선택된 학생 표시 -->
      <div id="counselingStudentInfo" class="counseling-student-info counseling-empty-state" aria-live="polite">
        <p>아직 선택된 학생이 없습니다. 위 학생 카드에서 <strong>상담 전략 요청</strong>을 눌러주세요.</p>
      </div>

      <!-- 교사 고민 입력 -->
      <div class="counseling-input-area">
        <label for="counselingConcern" class="counseling-label">교사 상담 고민 입력</label>
        <textarea
          id="counselingConcern"
          class="counseling-textarea"
          rows="4"
          placeholder="예) 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?&#10;예) 과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?&#10;예) 친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?"
          aria-label="교사 상담 고민 입력"
        ></textarea>
      </div>

      <!-- 전송 데이터 미리보기 -->
      <details class="counseling-preview" id="counselingPreviewDetails">
        <summary class="counseling-preview-summary">전송 데이터 미리보기 (Gemini에 실제로 전달되는 내용)</summary>
        <pre id="counselingPreviewJson" class="counseling-preview-json">학생을 선택하고 고민을 입력하면 미리보기가 표시됩니다.</pre>
        <p class="counseling-preview-note">⚠️ 이름, 학번, 사진 경로, 비밀번호는 전송되지 않습니다.</p>
      </details>

      <!-- 요청 버튼 -->
      <div class="counseling-actions">
        <button id="counselingSubmitBtn" class="primary-button counseling-submit-btn" type="button" disabled>
          AI 상담 전략 받기
        </button>
        <p id="counselingValidationMsg" class="counseling-validation-msg" role="alert" aria-live="polite"></p>
      </div>

      <!-- 로딩 -->
      <div id="counselingLoading" class="counseling-loading hidden" aria-live="polite">
        <span class="counseling-spinner" aria-hidden="true"></span>
        AI가 상담 전략을 생성하는 중입니다…
      </div>

      <!-- 오류 -->
      <p id="counselingError" class="counseling-error hidden" role="alert" aria-live="polite"></p>

      <!-- 결과 -->
      <div id="counselingResult" class="counseling-result hidden" aria-live="polite">
        <h3 class="counseling-result-title">📋 AI 상담 전략 결과</h3>
        <div id="counselingResultBody" class="counseling-result-body"></div>
      </div>

      <!-- 면책 안내 -->
      <p class="counseling-disclaimer">
        ⚠️ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
      </p>
    </section>
  `;
}

function buildAnonymizedPayload(student, index, teacherConcern) {
  // Gemini 전송용 익명화 데이터 생성
  // 학생 이름·학번·사진 경로·비밀번호는 절대 포함하지 않습니다.
  const alias = STUDENT_ALIASES[index] || `학생 ${index + 1}`;

  const gradeSummary = Object.entries(student.grades)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const learningTraits = [...student.traits, student.teacherMemo].join(" / ");

  return {
    studentAlias: alias,
    gradeSummary,
    learningTraits,
    teacherConcern: teacherConcern.trim(),
  };
}

function bindCounselingPanel() {
  let selectedStudentIndex = null;

  const studentInfoEl = document.querySelector("#counselingStudentInfo");
  const concernTextarea = document.querySelector("#counselingConcern");
  const previewJson = document.querySelector("#counselingPreviewJson");
  const submitBtn = document.querySelector("#counselingSubmitBtn");
  const validationMsg = document.querySelector("#counselingValidationMsg");
  const loadingEl = document.querySelector("#counselingLoading");
  const errorEl = document.querySelector("#counselingError");
  const resultEl = document.querySelector("#counselingResult");
  const resultBody = document.querySelector("#counselingResultBody");

  // 미리보기 갱신
  function updatePreview() {
    if (selectedStudentIndex === null) return;
    const concern = concernTextarea.value;
    const payload = buildAnonymizedPayload(
      STUDENTS[selectedStudentIndex],
      selectedStudentIndex,
      concern
    );
    previewJson.textContent = JSON.stringify(payload, null, 2);
  }

  // 학생 선택 버튼 이벤트
  adminView.addEventListener("click", (e) => {
    const btn = e.target.closest(".counseling-select-btn");
    if (!btn) return;

    const index = parseInt(btn.dataset.studentIndex, 10);
    if (isNaN(index) || !STUDENTS[index]) return;
    selectedStudentIndex = index;

    const student = STUDENTS[index];
    const alias = STUDENT_ALIASES[index] || `학생 ${index + 1}`;

    // 화면용: 이름·학번 그대로 표시 / Gemini 전송용: 익명 별칭 표시
    studentInfoEl.className = "counseling-student-info counseling-student-selected";
    studentInfoEl.innerHTML = `
      <div class="counseling-student-row">
        <div>
          <p class="counseling-student-label">선택된 학생 (화면 표시용)</p>
          <p class="counseling-student-name">${student.name} <span class="counseling-student-id">학번 ${student.id}</span></p>
        </div>
        <div>
          <p class="counseling-student-label">Gemini 전송용 (익명)</p>
          <p class="counseling-student-alias">${alias}</p>
        </div>
      </div>
    `;

    submitBtn.disabled = false;
    validationMsg.textContent = "";
    // 결과·오류 초기화
    resultEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    updatePreview();

    // 패널로 스크롤
    document.querySelector(".counseling-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // 고민 입력 → 미리보기 갱신
  concernTextarea.addEventListener("input", updatePreview);

  // 전송
  submitBtn.addEventListener("click", async () => {
    if (selectedStudentIndex === null) {
      validationMsg.textContent = "먼저 학생을 선택해주세요.";
      return;
    }

    const concern = concernTextarea.value.trim();
    if (!concern) {
      validationMsg.textContent = "상담 고민을 먼저 입력해주세요.";
      concernTextarea.focus();
      return;
    }

    validationMsg.textContent = "";
    resultEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    errorEl.textContent = "";
    loadingEl.classList.remove("hidden");
    submitBtn.disabled = true;

    // Gemini 전송용 익명화 데이터만 서버로 보냄
    // 프론트엔드는 /api/gemini-counseling 으로 POST만 전송합니다.
    const payload = buildAnonymizedPayload(
      STUDENTS[selectedStudentIndex],
      selectedStudentIndex,
      concern
    );

    try {
      const response = await fetch("/api/gemini-counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "알 수 없는 오류");
      }

      // 결과 표시 (줄바꿈 → <br>, 번호 항목 강조)
      const formatted = data.result
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/(^\d+\.\s.+?)(<br>|$)/gm, "<strong>$1</strong>$2");

      resultBody.innerHTML = formatted;
      resultEl.classList.remove("hidden");
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      errorEl.textContent =
        "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
      errorEl.classList.remove("hidden");
    } finally {
      loadingEl.classList.add("hidden");
      submitBtn.disabled = false;
    }
  });
}

showOnly(loginView);
