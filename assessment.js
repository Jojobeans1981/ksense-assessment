

const API_KEY = "ak_0be2a7063fa64df3a958e38bd676172b54ca1f66d0c01b60"; 

const BASE_URL = "https://assessment.ksensetech.com/api";
const HEADERS = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

function parseBloodPressure(bp) {
  if (!bp || typeof bp !== "string") return [null, null];
  const trimmed = bp.trim();
  const fullMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fullMatch) return [parseInt(fullMatch[1]), parseInt(fullMatch[2])];

  const sys = trimmed.match(/^(\d+)/) ? parseInt(trimmed.match(/^(\d+)/)[1]) : null;
  const dia = trimmed.match(/\/(\d+)/) ? parseInt(trimmed.match(/\/(\d+)/)[1]) : null;
  return [sys, dia];
}

function bpRisk(bp) {
  const [systolic, diastolic] = parseBloodPressure(bp);
  if (systolic === null || diastolic === null) return 0;

  // Stage 2: Highest priority
  if (systolic >= 140 || diastolic >= 90) return 4;

  // Stage 1
  if (systolic >= 130 || diastolic >= 80) return 3;

  // Elevated
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 2;

  // Normal
  if (systolic < 120 && diastolic < 80) return 1;

  // Fallback (should not reach here with valid numbers)
  return 0;
}

function tempRisk(temp) {
  if (temp == null) return 0;
  let t;
  try {
    t = typeof temp === "string" ? parseFloat(temp.trim()) : temp;
    if (isNaN(t)) return 0;
  } catch {
    return 0;
  }
  if (t >= 101.0) return 2;
  if (t >= 99.6) return 1;
  return 0;
}

function ageRisk(age) {
  if (age == null) return 0;
  let a;
  try {
    a = typeof age === "string" ? parseInt(age.trim(), 10) : age;
    if (isNaN(a) || a <= 0) return 0;
  } catch {
    return 0;
  }
  if (a > 65) return 2;
  if (a >= 40) return 1;
  return 1;
}

// IMPROVED: Better detection of malformed data
function hasDataIssue(patient) {
  const required = ["patient_id", "blood_pressure", "temperature", "age"];
  for (const key of required) {
    const val = patient[key];
    if (val == null || val === "" || (typeof val === "string" && val.trim() === "")) return true;
  }

  // BP invalid if can't parse both numbers
  const [sys, dia] = parseBloodPressure(patient.blood_pressure);
  if (sys === null || dia === null) return true;

  // Temperature invalid if present but not parsable to number
  if (patient.temperature != null) {
    const t = parseFloat(String(patient.temperature));
    if (isNaN(t)) return true;
  }

  // Age invalid if present but not parsable to positive integer
  if (patient.age != null) {
    const a = parseInt(String(patient.age), 10);
    if (isNaN(a) || a <= 0) return true;
  }

  return false;
}

async function delay(ms) {
  await new Promise(r => setTimeout(r, ms));
}

async function fetchAllPatients() {
  const patients = [];
  let page = 1;
  const limit = 20;

  while (true) {
    const url = new URL(`${BASE_URL}/patients`);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("limit", limit.toString());

    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(url, { headers: HEADERS });
        if (res.status === 429) { await delay(5000); continue; }
        if (res.status >= 500) { await delay(2000); continue; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const batch = json.data || [];
        if (batch.length === 0) return patients;

        patients.push(...batch);

        if (!json.pagination?.hasNext) return patients;
        page++;
        await delay(500);
        break;
      } catch (e) {
        console.log(`Retry ${i+1}/5 for page ${page}: ${e.message}`);
        await delay(3000);
      }
    }
  }
  return patients;
}

(async () => {
  console.log("Fetching patients...\n");
  const patients = await fetchAllPatients();
  console.log(`Fetched ${patients.length} patients.\n`);

  const highRisk = [];
  const fever = [];
  const issues = new Set();

  for (const p of patients) {
    const id = p.patient_id;
    if (!id) continue;

    const total = bpRisk(p.blood_pressure) + tempRisk(p.temperature) + ageRisk(p.age);
    if (total >= 4) highRisk.push(id);

    const tempVal = parseFloat(String(p.temperature ?? ""));
    if (!isNaN(tempVal) && tempVal >= 99.6) fever.push(id);

    if (hasDataIssue(p)) issues.add(id);
  }

  const submission = {
    high_risk_patients: highRisk.sort(),
    fever_patients: fever.sort(),
    data_quality_issues: Array.from(issues).sort()
  };

  console.log("Submission:\n", JSON.stringify(submission, null, 2));

  try {
    const res = await fetch(`${BASE_URL}/submit-assessment`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(submission)
    });
    const result = await res.json();
    console.log("\nResult:\n", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Submit failed:", e);
  }
})();