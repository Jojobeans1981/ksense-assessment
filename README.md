# Healthcare API Risk Assessment Challenge

**DemoMed Healthcare API Integration & Patient Risk Scoring System**

This project demonstrates robust API integration with the DemoMed Healthcare assessment API, handling real-world challenges such as:
- Pagination
- Rate limiting (429 responses)
- Intermittent server errors (500/503)
- Inconsistent and malformed data (missing fields, non-numeric values, partial blood pressure readings)

The solution fetches all patient records, accurately calculates risk scores according to clinical guidelines, identifies high-risk and fever patients, detects data quality issues, and submits results to the assessment endpoint.

## Final Result

**Best Score: 73% (PASS)**  
**Attempt #2**  
- High-risk patients: 20/20 correct (31 submitted, 11 false positives)  
- Fever patients: 9/9 correct (Perfect)  
- Data quality issues: 8/8 correct (Perfect)

## Features

- **Resilient API client** with automatic retries for rate limits and server errors
- **Robust data parsing** for inconsistent formats (e.g., "150/", "/90", "N/A", non-numeric age)
- **Accurate blood pressure risk scoring** using the higher stage when systolic/diastolic differ
- **Comprehensive data quality validation** for missing, empty, or malformed fields
- **Clean, modular, and well-commented code** using modern JavaScript (ES modules, async/await)
- **No external dependencies** — runs with Node.js 18+ only (uses native `fetch`)

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/healthcare-risk-assessment.git
   cd healthcare-risk-assessment

Save your API key in the script:
Open assessment.js
Replace "YOUR_API_KEY_HERE" with your actual assessment API key

Run the assessment: node assessment.js

The script will:

Fetch all patients
Display the calculated lists
Automatically submit to the assessment endpoint
Print your score and feedback

Key Implementation Details
Blood Pressure Risk Logic
Strictly follows clinical hypertension staging with "higher category wins" rule:

Stage 2: ≥140 systolic OR ≥90 diastolic → 4 points
Stage 1: ≥130 systolic OR ≥80 diastolic → 3 points
Elevated: 120–129 systolic AND <80 diastolic → 2 points
Normal: <120 systolic AND <80 diastolic → 1 point

Data Quality Detection
Flags patients with:

Missing required fields
Unparseable blood pressure (e.g., "invalid", "150/")
Non-numeric temperature or age
Empty or whitespace-only values

Project Structure
text.
├── assessment.js          # Main assessment script
├── README.md              # This file
└── .gitignore             # (optional) excludes node_modules, env files
Requirements

Node.js 18 or higher (for native fetch support)

No npm installs required.
Author
Guisseppe Panetta
beamers051681@gmail.com
Completed: December 2025
Thank you for the opportunity — looking forward to discussing this solution and my approach in more detail!