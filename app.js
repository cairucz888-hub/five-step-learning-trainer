const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const storeKey = "five-step-learning-trainer-state";

const sampleTopics = [
  "为什么懂了一个知识，却说不出来、用不出来？",
  "认知不是知识，而是一种技能",
  "没有动作的认知，只是知识库存",
  "为什么复述比收藏更重要？",
  "普通人怎样把学习变成短视频表达？",
  "为什么不要死记原文，而要记结构？",
];

const steps = [
  {
    title: "抓骨架",
    label: "STEP 1",
    time: "建议 2 分钟",
    duration: 120,
    intro: "先别急着背原文。把这个知识拆成五个问题，骨架抓住了，后面才说得出来。",
    hint: "下一步建议：进入“立即说”，合上原文，用自己的话说 30 秒。",
  },
  {
    title: "立即说",
    label: "STEP 2",
    time: "建议 30 秒",
    duration: 30,
    intro: "不要等准备完美。现在就说，哪怕只说 30 秒。说不出来的地方，就是接下来要补的地方。",
    hint: "下一步建议：进入“允许烂”，把卡住、漏掉、说错的地方找出来。",
  },
  {
    title: "允许烂",
    label: "STEP 3",
    time: "建议 2 分钟",
    duration: 120,
    intro: "一开始说得烂是正常的。重点不是表现好，而是把漏洞暴露出来，再回去补。",
    hint: "下一步建议：进入“关键词”，把整段内容压成几个能记住的词。",
  },
  {
    title: "关键词",
    label: "STEP 4",
    time: "建议 1 分钟",
    duration: 60,
    intro: "不要背整段话。记住几个关键词，它们会帮你在开播时把结构重新搭起来。",
    hint: "下一步建议：进入“做迁移”，把这个知识放到你自己的真实场景里用一次。",
  },
  {
    title: "做迁移",
    label: "STEP 5",
    time: "建议 2 分钟",
    duration: 120,
    intro: "知识真正变成你的，不是因为你会说，而是因为你能把它放进自己的生活、社群、短视频或工作里用一次。",
    hint: "本轮完成。可以保存练习单，开播前照着“我的60秒表达”再说一遍。",
  },
];

const els = {
  todayCount: $("#todayCount"),
  streakCount: $("#streakCount"),
  completionScore: $("#completionScore"),
  topicInput: $("#topicInput"),
  sampleBtn: $("#sampleBtn"),
  clearBtn: $("#clearBtn"),
  stepLabel: $("#stepLabel"),
  stepTitle: $("#stepTitle"),
  stepTime: $("#stepTime"),
  stepIntro: $("#stepIntro"),
  stepBody: $("#stepBody"),
  nextHint: $("#nextHint"),
  timerRing: $("#timerRing"),
  timeLabel: $("#timeLabel"),
  timerBtn: $("#timerBtn"),
  resetBtn: $("#resetBtn"),
  nextBtn: $("#nextBtn"),
  summaryText: $("#summaryText"),
  copyBtn: $("#copyBtn"),
  saveBtn: $("#saveBtn"),
  historyList: $("#historyList"),
  clearHistoryBtn: $("#clearHistoryBtn"),
  toast: $("#toast"),
};

let timerId = null;
let startedAt = 0;
let toastId = null;
let state = loadState();

function defaultState() {
  return {
    activeStep: 0,
    topic: "",
    duration: 120,
    remaining: 120,
    running: false,
    notes: {
      what: "",
      why: "",
      not: "",
      when: "",
      example: "",
      retell: "",
      stuck: "",
      repair: "",
      keywords: "",
      scene: "",
      action: "",
      result: "",
      opening: "",
    },
    checks: {},
    history: [],
    practiceLog: [],
    lastPracticeDate: "",
    streak: 0,
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(storeKey) || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function render() {
  renderRoute();
  renderStep();
  renderTimer();
  renderSummary();
  renderStats();
  renderHistory();
}

function renderRoute() {
  $$(".step-pill").forEach((button) => {
    const active = Number(button.dataset.step) === state.activeStep;
    button.classList.toggle("is-active", active);
  });
}

function renderStep() {
  const step = steps[state.activeStep];
  els.stepLabel.textContent = step.label;
  els.stepTitle.textContent = step.title;
  els.stepTime.textContent = step.time;
  els.stepIntro.textContent = step.intro;
  els.nextHint.textContent = step.hint;
  els.topicInput.value = state.topic;
  els.stepBody.innerHTML = buildStepBody(state.activeStep);
  bindDynamicInputs();
}

function buildStepBody(stepIndex) {
  if (stepIndex === 0) {
    return `
      <div class="question-grid">
        ${field("what", "What：它是什么？", "用一句人话说清楚，不要照抄原文。")}
        ${field("why", "Why：为什么重要？", "它解决了什么问题？为什么值得讲？")}
        ${field("not", "What else：它不是什么？", "边界在哪里？别把它说成万能方法。")}
        ${field("when", "When：什么时候用？", "它适合哪个真实场景？")}
        ${field("example", "Example：我的例子是什么？", "必须换成你自己的生活、社群或自媒体例子。", "wide")}
      </div>
    `;
  }

  if (stepIndex === 1) {
    return `
      <div class="practice-script">
        训练口令：合上原文，直接说 30 秒。<br />
        开头可以这样说：我今天想讲清楚一个问题：${escapeHtml(state.topic || "我刚学到的这个知识")}。
      </div>
      ${area("retell", "我刚才复述出来的内容", "说完后，把你记得住的内容写在这里。不要求完整。", "tall")}
      ${checklist([
        ["retell_no_text", "我没有照着原文念"],
        ["retell_30s", "我至少说了 30 秒"],
        ["retell_own_words", "我用了自己的话"],
      ])}
    `;
  }

  if (stepIndex === 2) {
    return `
      ${area("stuck", "哪里卡住了？", "写下刚才说不出来、说乱、说错、漏掉的地方。", "tall")}
      ${area("repair", "回去补什么？", "只补最关键的洞，不要重新学一大堆。")}
      ${checklist([
        ["bad_accept", "我允许这一轮说得不完整"],
        ["bad_found_gap", "我找到了至少一个漏洞"],
        ["bad_repair_one", "我只补一个最关键的地方"],
      ])}
    `;
  }

  if (stepIndex === 3) {
    return `
      <div class="keyword-row">
        <div class="keyword-chip">定义</div>
        <div class="keyword-chip">原因</div>
        <div class="keyword-chip">边界</div>
        <div class="keyword-chip">场景</div>
        <div class="keyword-chip">例子</div>
      </div>
      ${area("keywords", "我的关键词", "把这个知识压成 3-5 个词。开播时靠这些词找回结构。")}
      ${checklist([
        ["key_not_full_text", "我没有背整段话"],
        ["key_has_structure", "关键词能帮我找回结构"],
        ["key_under_5", "关键词控制在 5 个以内"],
      ])}
    `;
  }

  return `
    <div class="question-grid">
      ${field("scene", "我要迁移到哪个场景？", "生活、社群、短视频、课程、工作，都可以。")}
      ${field("action", "今天做哪个动作？", "动作要小，今天就能做。")}
      ${field("result", "怎么判断用出来了？", "有没有说出来、拍出来、讲给别人、改变一个选择。")}
      ${field("opening", "我的 60 秒开播表达", "把这次训练变成一段可以直接讲的开头。", "wide")}
    </div>
    ${checklist([
      ["move_real_scene", "我找到了真实场景"],
      ["move_today_action", "我有今天能做的小动作"],
      ["move_result", "我知道怎么判断它是否用出来了"],
    ])}
  `;
}

function field(key, label, help, extraClass = "") {
  return `
    <div class="question-card ${extraClass}">
      <label for="${key}">${label}</label>
      <small>${help}</small>
      <textarea id="${key}" data-note="${key}">${escapeHtml(state.notes[key] || "")}</textarea>
    </div>
  `;
}

function area(key, label, help, size = "") {
  return `
    <div class="note-area">
      <label for="${key}">${label}</label>
      <small>${help}</small>
      <textarea id="${key}" class="${size}" data-note="${key}">${escapeHtml(state.notes[key] || "")}</textarea>
    </div>
  `;
}

function checklist(items) {
  return `
    <div class="checklist">
      ${items
        .map(([key, label]) => {
          const checked = state.checks[key] ? "checked" : "";
          return `<label><input type="checkbox" data-check="${key}" ${checked} />${label}</label>`;
        })
        .join("")}
    </div>
  `;
}

function bindDynamicInputs() {
  $$("[data-note]").forEach((input) => {
    input.addEventListener("input", () => {
      state.notes[input.dataset.note] = input.value;
      saveState();
      renderSummary();
      renderStats();
    });
  });

  $$("[data-check]").forEach((input) => {
    input.addEventListener("change", () => {
      state.checks[input.dataset.check] = input.checked;
      saveState();
      renderStats();
    });
  });
}

function renderTimer() {
  const minutes = Math.floor(state.remaining / 60);
  const seconds = state.remaining % 60;
  const progress = state.duration ? 360 * (1 - state.remaining / state.duration) : 0;
  els.timeLabel.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.timerRing.style.setProperty("--progress", `${progress}deg`);
  els.timerBtn.textContent = state.running ? "暂停" : "开始";
  els.timerBtn.classList.toggle("is-running", state.running);
  $$(".duration-button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.seconds) === state.duration);
  });
}

function renderSummary() {
  els.summaryText.value = buildSummary();
}

function buildSummary() {
  const n = state.notes;
  return [
    "【五步学习法练习单】",
    `主题：${state.topic || "未填写"}`,
    "",
    "1. 抓骨架",
    `- 是什么：${n.what || "未填写"}`,
    `- 为什么：${n.why || "未填写"}`,
    `- 边界：${n.not || "未填写"}`,
    `- 场景：${n.when || "未填写"}`,
    `- 我的例子：${n.example || "未填写"}`,
    "",
    "2. 30秒复述",
    n.retell || "未填写",
    "",
    "3. 补洞",
    `- 卡住处：${n.stuck || "未填写"}`,
    `- 回去补：${n.repair || "未填写"}`,
    "",
    "4. 关键词",
    n.keywords || "未填写",
    "",
    "5. 做迁移",
    `- 场景：${n.scene || "未填写"}`,
    `- 今日动作：${n.action || "未填写"}`,
    `- 判断结果：${n.result || "未填写"}`,
    "",
    "我的60秒表达：",
    n.opening || "未填写",
  ].join("\n");
}

function renderStats() {
  const today = todayKey();
  const todayCount = state.practiceLog.filter((item) => item.date === today).length;
  els.todayCount.textContent = todayCount;
  els.streakCount.textContent = state.streak;
  els.completionScore.textContent = `${completion()}%`;
}

function completion() {
  const requiredNotes = ["what", "why", "not", "when", "example", "retell", "stuck", "repair", "keywords", "scene", "action", "result", "opening"];
  const noteDone = requiredNotes.filter((key) => (state.notes[key] || "").trim().length >= 2).length;
  const checked = Object.values(state.checks).filter(Boolean).length;
  const score = Math.round(((noteDone / requiredNotes.length) * 78) + Math.min(22, checked * 2));
  return Math.min(100, score);
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.innerHTML = "<li>还没有练习记录。完成一轮后，点“保存今天这轮练习”。</li>";
    return;
  }

  els.historyList.innerHTML = state.history
    .slice(0, 8)
    .map((item) => {
      return `
        <li>
          <strong>${escapeHtml(item.topic || "未命名主题")}</strong>
          ${escapeHtml(item.date)} · 完成度 ${item.score}%
        </li>
      `;
    })
    .join("");
}

function switchStep(index) {
  state.activeStep = clamp(index, 0, steps.length - 1);
  setDuration(steps[state.activeStep].duration, false);
  saveState();
  render();
}

function nextStep() {
  if (state.activeStep >= steps.length - 1) {
    savePractice();
    return;
  }
  switchStep(state.activeStep + 1);
  showToast(`已进入下一步：${steps[state.activeStep].title}`);
}

function setDuration(seconds, shouldRender = true) {
  state.running = false;
  stopTimer();
  state.duration = seconds;
  state.remaining = seconds;
  saveState();
  if (shouldRender) renderTimer();
}

function toggleTimer() {
  if (state.running) {
    state.running = false;
    stopTimer();
  } else {
    state.running = true;
    startedAt = Date.now();
    timerId = window.setInterval(tick, 250);
  }
  saveState();
  renderTimer();
}

function tick() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  if (elapsed <= 0) return;
  state.remaining = Math.max(0, state.remaining - elapsed);
  startedAt = Date.now();
  renderTimer();
  if (state.remaining <= 0) {
    state.running = false;
    stopTimer();
    saveState();
    renderTimer();
    showToast("本步计时结束，可以进入下一步。");
  }
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  setDuration(state.duration);
}

function randomTopic() {
  const current = state.topic;
  let next = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
  if (sampleTopics.length > 1 && next === current) {
    next = sampleTopics[(sampleTopics.indexOf(next) + 1) % sampleTopics.length];
  }
  state.topic = next;
  saveState();
  renderSummary();
  els.topicInput.value = state.topic;
}

function clearCurrent() {
  const fresh = defaultState();
  state.topic = "";
  state.notes = fresh.notes;
  state.checks = fresh.checks;
  state.activeStep = 0;
  setDuration(steps[0].duration, false);
  saveState();
  render();
  showToast("已清空当前练习。");
}

async function copySummary() {
  const text = buildSummary();
  try {
    await navigator.clipboard.writeText(text);
    showToast("练习单已复制，可以发到群里。");
  } catch {
    els.summaryText.focus();
    els.summaryText.select();
    document.execCommand("copy");
    showToast("练习单已复制。");
  }
}

function savePractice() {
  updateStreak();
  const item = {
    date: todayKey(),
    at: Date.now(),
    topic: state.topic || "未命名主题",
    score: completion(),
    summary: buildSummary(),
  };
  state.practiceLog.unshift({ date: todayKey(), at: Date.now() });
  state.history.unshift(item);
  state.practiceLog = state.practiceLog.slice(0, 120);
  state.history = state.history.slice(0, 30);
  saveState();
  renderStats();
  renderHistory();
  showToast("这一轮已经保存。开播前可以照着练习单再说一遍。");
}

function clearHistory() {
  state.history = [];
  state.practiceLog = [];
  state.lastPracticeDate = "";
  state.streak = 0;
  saveState();
  renderStats();
  renderHistory();
  showToast("历史记录已清空。");
}

function updateStreak() {
  const today = todayKey();
  const yesterday = dateKey(Date.now() - 86400000);
  if (state.lastPracticeDate === today) return;
  state.streak = state.lastPracticeDate === yesterday ? state.streak + 1 : 1;
  state.lastPracticeDate = today;
}

function todayKey() {
  return dateKey(Date.now());
}

function dateKey(time) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toastId);
  toastId = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bindEvents() {
  $$(".step-pill").forEach((button) => {
    button.addEventListener("click", () => switchStep(Number(button.dataset.step)));
  });

  $$(".duration-button").forEach((button) => {
    button.addEventListener("click", () => setDuration(Number(button.dataset.seconds)));
  });

  els.topicInput.addEventListener("input", () => {
    state.topic = els.topicInput.value;
    saveState();
    renderSummary();
  });

  els.sampleBtn.addEventListener("click", randomTopic);
  els.clearBtn.addEventListener("click", clearCurrent);
  els.timerBtn.addEventListener("click", toggleTimer);
  els.resetBtn.addEventListener("click", resetTimer);
  els.nextBtn.addEventListener("click", nextStep);
  els.copyBtn.addEventListener("click", copySummary);
  els.saveBtn.addEventListener("click", savePractice);
  els.clearHistoryBtn.addEventListener("click", clearHistory);
  window.addEventListener("beforeunload", stopTimer);
}

function boot() {
  state.running = false;
  if (!state.topic) state.topic = sampleTopics[0];
  if (!state.duration) {
    state.duration = steps[state.activeStep].duration;
    state.remaining = state.duration;
  }
  bindEvents();
  render();
}

boot();
