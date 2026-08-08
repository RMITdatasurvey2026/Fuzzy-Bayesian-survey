const CRITERIA = [
  {
    code: "SEI",
    en: "Structural and Socioeconomic Inequality",
    vi: "Bất bình đẳng về cấu trúc và kinh tế - xã hội"
  },
  {
    code: "LWI",
    en: "Labor and Workforce Inequality",
    vi: "Bất bình đẳng về giới và lực lượng lao động"
  },
  {
    code: "PGI",
    en: "Power and Governance Inequality",
    vi: "Bất bình đẳng về quyền lực và quản trị"
  },
  {
    code: "ESG",
    en: "ESG-Driven Supply Chain Policy",
    vi: "Chính sách chuỗi cung ứng dựa trên ESG"
  },
  {
    code: "GAI",
    en: "GenAI-Enabled Decision Support",
    vi: "Hỗ trợ ra quyết định bằng Generative AI"
  },
  {
    code: "AAI",
    en: "Agentic AI Governance",
    vi: "Quản trị bằng Agentic AI"
  },
  {
    code: "HCSC",
    en: "Human-Centric Supply Chain Culture",
    vi: "Văn hóa chuỗi cung ứng lấy con người làm trung tâm"
  }
];

const OBJECTIVES = [
  { id: "scpo", label: "SCPO", tbody: document.getElementById("criteriaBody") },
  { id: "sesi", label: "SESI", tbody: document.getElementById("criteriaBody2") }
];

const el = {
  expertCode: document.getElementById("expertCode"),
  ageRange: document.getElementById("ageRange"),
  gender: document.getElementById("gender"),
  education: document.getElementById("education"),
  yearsExperience: document.getElementById("yearsExperience"),
  jobTitle: document.getElementById("jobTitle"),
  organization: document.getElementById("organization"),
  industrySector: document.getElementById("industrySector"),
  validateBtn: document.getElementById("validateBtn"),
  submitBtn: document.getElementById("submitBtn"),
  message: document.getElementById("message"),
  submitPopup: document.getElementById("submitPopup"),
  popupText: document.getElementById("popupText"),
  closePopupBtn: document.getElementById("closePopupBtn")
};

const appScriptUrl =
  window.SURVEY_CONFIG && window.SURVEY_CONFIG.appScriptUrl
    ? window.SURVEY_CONFIG.appScriptUrl.trim()
    : "";

function setMessage(text, type = "") {
  el.message.className = `message ${type}`.trim();
  el.message.textContent = text;
}

function showSubmitPopup(message) {
  el.popupText.textContent = message;
  el.submitPopup.classList.add("is-open");
  el.submitPopup.setAttribute("aria-hidden", "false");
}

function hideSubmitPopup() {
  el.submitPopup.classList.remove("is-open");
  el.submitPopup.setAttribute("aria-hidden", "true");
}

function buildTable(objective) {
  const tbody = objective.tbody;
  tbody.innerHTML = "";
  for (const c of CRITERIA) {
    const tr = document.createElement("tr");
    tr.dataset.code = c.code;
    tr.innerHTML = `
      <td><code>${c.code}</code></td>
      <td>
        <span class="criterion-title">${c.en}</span>
        <span class="criterion-sub">${c.vi}</span>
      </td>
      <td class="radio-cell">
        <input type="radio" name="best-${objective.id}" value="${c.code}" aria-label="Best ${c.code}">
      </td>
      <td class="radio-cell">
        <input type="radio" name="worst-${objective.id}" value="${c.code}" aria-label="${c.code} Worst">
      </td>
      <td>
        <input class="score-input best-vs" type="number" min="1" max="9" step="1" data-code="${c.code}" aria-label="Best vs ${c.code}">
      </td>
      <td>
        <input class="score-input vs-worst" type="number" min="1" max="9" step="1" data-code="${c.code}" aria-label="${c.code} vs Worst">
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function getRows(objective) {
  return [...objective.tbody.querySelectorAll("tr")];
}

function getSelected(objective, kind) {
  const checked = objective.tbody.querySelector(`input[name="${kind}-${objective.id}"]:checked`);
  return checked ? checked.value : null;
}

function applyLocks(objective) {
  const best = getSelected(objective, "best");
  const worst = getSelected(objective, "worst");

  for (const row of getRows(objective)) {
    const code = row.dataset.code;
    const bestVsInput = row.querySelector(".best-vs");
    const vsWorstInput = row.querySelector(".vs-worst");

    bestVsInput.disabled = false;
    vsWorstInput.disabled = false;
    bestVsInput.classList.remove("locked");
    vsWorstInput.classList.remove("locked");

    if (code === best) {
      bestVsInput.value = "1";
      bestVsInput.disabled = true;
      bestVsInput.classList.add("locked");
    }

    if (code === worst) {
      vsWorstInput.value = "1";
      vsWorstInput.disabled = true;
      vsWorstInput.classList.add("locked");
    }
  }
}

function readScores(objective) {
  const bestVs = {};
  const vsWorst = {};

  for (const row of getRows(objective)) {
    const code = row.dataset.code;
    const bestVsInput = row.querySelector(".best-vs");
    const vsWorstInput = row.querySelector(".vs-worst");

    bestVs[code] = bestVsInput.value === "" ? null : Number(bestVsInput.value);
    vsWorst[code] = vsWorstInput.value === "" ? null : Number(vsWorstInput.value);
  }

  return { bestVs, vsWorst };
}

function validateObjective(objective, issues) {
  const best = getSelected(objective, "best");
  const worst = getSelected(objective, "worst");
  const { bestVs, vsWorst } = readScores(objective);

  if (!best) {
    issues.push(`${objective.label}: select a Best criterion. / hãy chọn tiêu chí Tốt nhất.`);
  }
  if (!worst) {
    issues.push(`${objective.label}: select a Worst criterion. / hãy chọn tiêu chí Kém nhất.`);
  }
  if (best && worst && best === worst) {
    issues.push(`${objective.label}: Best and Worst must be different. / Tốt nhất và Kém nhất phải khác nhau.`);
  }

  for (const c of CRITERIA) {
    const b = bestVs[c.code];
    const w = vsWorst[c.code];

    if (!Number.isInteger(b) || b < 1 || b > 9) {
      issues.push(`${objective.label}: Best vs ${c.code} must be an integer from 1 to 9. / Tốt nhất so với ${c.code} phải là số nguyên từ 1 đến 9.`);
    }
    if (!Number.isInteger(w) || w < 1 || w > 9) {
      issues.push(`${objective.label}: ${c.code} vs Worst must be an integer from 1 to 9. / ${c.code} so với Kém nhất phải là số nguyên từ 1 đến 9.`);
    }
  }

  if (best && bestVs[best] !== 1) {
    issues.push(`${objective.label}: the selected Best criterion must have a value of 1 in the Best vs Criterion column. / tiêu chí Tốt nhất đã chọn phải có giá trị 1 ở cột Tốt nhất so với Tiêu chí.`);
  }
  if (worst && vsWorst[worst] !== 1) {
    issues.push(`${objective.label}: the selected Worst criterion must have a value of 1 in the Criterion vs Worst column. / tiêu chí Kém nhất đã chọn phải có giá trị 1 ở cột Tiêu chí so với Kém nhất.`);
  }

  return { best, worst, bestVs, vsWorst };
}

function validateAll() {
  const expertCode = el.expertCode.value.trim();
  const demographics = {
    ageRange: el.ageRange.value,
    gender: el.gender.value,
    education: el.education.value,
    yearsExperience: el.yearsExperience.value,
    jobTitle: el.jobTitle.value.trim(),
    organization: el.organization.value.trim(),
    industrySector: el.industrySector.value.trim()
  };

  const issues = [];

  if (!expertCode) {
    issues.push("Expert code is required. / Mã chuyên gia là bắt buộc.");
  }

  if (!demographics.ageRange) issues.push("Age range is required. / Độ tuổi là bắt buộc.");
  if (!demographics.gender) issues.push("Gender is required. / Giới tính là bắt buộc.");
  if (!demographics.education) issues.push("Highest education level is required. / Trình độ học vấn cao nhất là bắt buộc.");
  if (!demographics.yearsExperience) issues.push("Years of professional experience is required. / Số năm kinh nghiệm chuyên môn là bắt buộc.");
  if (!demographics.jobTitle) issues.push("Job title / role is required. / Chức danh / vai trò là bắt buộc.");
  if (!demographics.industrySector) issues.push("Industry sector is required. / Ngành công nghiệp là bắt buộc.");

  const results = {};
  for (const objective of OBJECTIVES) {
    results[objective.id] = validateObjective(objective, issues);
  }

  if (issues.length > 0) {
    return {
      ok: false,
      message: issues[0],
      issues,
      payload: null
    };
  }

  return {
    ok: true,
    message: "Validation passed. / Đã kiểm tra hợp lệ.",
    issues: [],
    payload: {
      expertCode,
      demographics,
      scpo: results.scpo,
      sesi: results.sesi,
      submittedAt: new Date().toISOString()
    }
  };
}

function downloadFallback(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `bwm-response-${payload.expertCode}-${stamp}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function submitResponse() {
  const validation = validateAll();
  if (!validation.ok) {
    setMessage(validation.message, "error");
    return;
  }

  const payload = validation.payload;

  if (!appScriptUrl) {
    downloadFallback(payload);
    setMessage("Backend not configured. JSON backup file downloaded. / Chưa cấu hình máy chủ. Đã tải xuống tệp JSON sao lưu.", "success");
    showSubmitPopup("Backup JSON downloaded successfully. / Đã tải xuống tệp JSON sao lưu thành công.");
    return;
  }

  el.submitBtn.disabled = true;
  setMessage("Submitting response... / Đang gửi phản hồi...", "");

  try {
    const response = await fetch(appScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch (parseError) {
      result = null;
    }

    if (!response.ok || (result && result.status === "error")) {
      const errorMessage = (result && result.message) || `Submit failed (HTTP ${response.status}). / Gửi thất bại (HTTP ${response.status}).`;
      setMessage(errorMessage, "error");
      return;
    }

    setMessage("Submitted. Thank you for your response. / Đã gửi. Cảm ơn bạn đã phản hồi.", "success");
    showSubmitPopup("Your response has been received and recorded. / Phản hồi của bạn đã được ghi nhận thành công.");
  } catch (error) {
    setMessage(error.message || "Submit failed. Check your connection and try again. / Gửi thất bại. Vui lòng kiểm tra kết nối và thử lại.", "error");
  } finally {
    el.submitBtn.disabled = false;
  }
}

for (const objective of OBJECTIVES) {
  buildTable(objective);
  objective.tbody.addEventListener("change", (event) => {
    if (event.target.matches(`input[name="best-${objective.id}"], input[name="worst-${objective.id}"]`)) {
      applyLocks(objective);
    }
  });
  applyLocks(objective);
}

el.validateBtn.addEventListener("click", () => {
  const result = validateAll();
  if (!result.ok) {
    setMessage(result.message, "error");
    return;
  }
  setMessage("Validation passed. Ready to submit. / Đã kiểm tra hợp lệ. Sẵn sàng gửi.", "success");
});
el.submitBtn.addEventListener("click", submitResponse);

el.closePopupBtn.addEventListener("click", hideSubmitPopup);
el.submitPopup.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-popup-close")) {
    hideSubmitPopup();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideSubmitPopup();
  }
});

setMessage("Ready. Fill in your information and scores, then click Validate. / Sẵn sàng. Điền thông tin và điểm số, sau đó nhấn Kiểm tra."); 
