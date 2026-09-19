package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/v1/scams", HandleScamScanner)
	return r
}

func executeRequest(r *gin.Engine, content string) (*httptest.ResponseRecorder, AnalyzeScamResponse) {
	reqBody, _ := json.Marshal(AnalyzeScamRequest{Content: content})
	req, _ := http.NewRequest("POST", "/api/v1/scams", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var resp AnalyzeScamResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return w, resp
}

func TestScamScanner_GeneralizationAndFalsePositives(t *testing.T) {
	r := setupTestRouter()

	testCases := []struct {
		name          string
		content       string
		expectScam    bool
		minScore      int
		maxScore      int
		mustHaveFlags []string
	}{
		// --- 1. LEGITIMATE TEST CASES (Must NOT be flagged as high risk) ---
		{
			name: "1. Legitimate Corporate Software Engineer",
			content: `Senior Backend Developer - Cloud Systems
Key Responsibilities:
- Design and implement distributed Go microservices.
- Write unit and integration tests, perform code reviews.
Requirements:
- Bachelor's degree in Computer Science or related field.
- 3+ years of hands-on experience with Go and PostgreSQL.
Apply through our official careers portal at careers.company.com.
Note: We never ask for any money or fees at any stage of hiring.`,
			expectScam: false,
			minScore:   0,
			maxScore:   15,
		},
		{
			name: "2. Legitimate Entry-Level Internship",
			content: `Frontend Engineering Intern (Summer 2026)
We are looking for enthusiastic students interested in React and TypeScript.
No previous experience required for internship, full mentorship and training provided.
Stipend: ₹15,000 per month.
Selection process involves a screening round and technical interview.`,
			expectScam: false,
			minScore:   0,
			maxScore:   20,
		},
		{
			name: "3. Legitimate Remote Customer Support",
			content: `Remote Customer Success Specialist - Shift Based
Support our global enterprise clients via chat and ticketing.
Qualifications: Strong written English proficiency and problem-solving skills.
Salary: ₹35,000 per month with health insurance and provident fund.
Submit your resume on our workday portal.`,
			expectScam: false,
			minScore:   0,
			maxScore:   20,
		},
		{
			name: "4. Legitimate Healthcare Job with Urgent Language",
			content: `Urgent requirement for Staff Nurses at City Hospital.
Immediate joining available for night shifts.
Requirements: GNM or B.Sc Nursing with 2 years of hospital experience.
Walk-in interview at HR office between 10 AM - 4 PM.`,
			expectScam: false,
			minScore:   0,
			maxScore:   20,
		},
		{
			name: "5. Legitimate Freelance Designer Request",
			content: `Looking for a freelance UI designer to create a brand identity and Figma prototype for a SaaS tool.
Budget ₹20,000 upon milestone delivery. Please share portfolio links.`,
			expectScam: false,
			minScore:   0,
			maxScore:   15,
		},

		// --- 2. ADVANCE FEE & REAL-WORLD FRAUD TEST CASES (Must be flagged HIGH/CRITICAL) ---
		{
			name: "6. Paraphrased Advance Fee Fraud (Unseen Wording)",
			content: `Congratulations! Your profile has been shortlisted for Executive Manager.
Candidates are required to make a small refundable payment before onboarding for laptop security kit dispatch.`,
			expectScam: true,
			minScore:   60,
			maxScore:   100,
		},
		{
			name: "7. Fake Airline Recruitment Scam",
			content: `Direct recruitment for Indigo Ground Staff and Cabin Crew!
100% guaranteed job without interview.
Candidates must pay a refundable gate pass charge of ₹1,800 to HR before receiving the appointment letter.`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "8. Part-Time Task Scam (YouTube/Like/Subscribe)",
			content: `Work from home opportunity! Simple video like and subscribe to earn ₹3,000 per day guaranteed.
Earn without investment from your phone. Contact HR on telegram @fast_money_tasks.`,
			expectScam: true,
			minScore:   65,
			maxScore:   100,
		},
		{
			name: "9. Data Entry Laptop Courier Fee Scam",
			content: `Home typing work ₹50,000 per month.
No skills needed to earn daily.
Deposit a refundable courier fee of ₹2,500 to receive laptop and assignment materials at your home address.`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "10. Crypto Trading Assistant Scam",
			content: `Earn 5000 daily managing crypto wallet transactions.
Initial USDT transfer required as security deposit. Contact us on telegram t.me/crypto_hiring_bot.`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "11. Government Job Direct Posting Scam",
			content: `Govt Railways direct appointment letter issued.
Transfer ₹3,500 document verification fee to UPI id railway-recruiter@okaxis to confirm booking.`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "12. Marketplace Redirection & Advance Escrow Bypass",
			content: `Selling sealed MacBook Pro M3 for ₹45,000 urgent relocation.
Do not pay on app. Send money to this alternate number (+91 9988776655) on GPay to confirm booking immediately.`,
			expectScam: true,
			minScore:   60,
			maxScore:   100,
		},
		{
			name: "13. Credential Harvesting Lure",
			content: `Urgent requirement for remote clerk. Instant offer letter.
Please send OTP received on your mobile to verify your bank account for stipend payout.`,
			expectScam: true,
			minScore:   70,
			maxScore:   100,
		},
		{
			name: "14. Paraphrased Starter Kit Demand",
			content: `Selected candidates must purchase the starter kit from us to start working on remote assignments.
Fee of ₹2,000 is required prior to joining.`,
			expectScam: true,
			minScore:   65,
			maxScore:   100,
		},
		{
			name: "15. Preset Advance Fee Job Example",
			content: `Urgent Requirement! International Data Corp is hiring candidates immediately.
Position: Operations Lead.
No experience required for manager role! Work from home ₹50,000 per month guaranteed.
To proceed with onboarding and background check, candidates must deposit a refundable registration fee of ₹2,500.
Please pay upfront through our portal. Contact HR on telegram: @hr_recruit_direct to get your employee kit.`,
			expectScam: true,
			minScore:   85,
			maxScore:   100,
		},

		// --- 3. CURRENCY-AWARE & TASK SCAM REAL WORLD CASES ---
		{
			name: "16. User Screenshot: Merchant Data Update WhatsApp Scam ($200-$500/day)",
			content: `Initial review, we've decided to invite you for an interview for the Information Systems Manager position.
We currently have five openings. This is a great remote, online position where you can help merchants update their data and provide free training. You can work 20 to 60 minutes daily (anytime, anywhere) and earn $200 to $500 per day. The base weekly salary is over $2,000.
Paid annual leave: In addition to statutory holidays such as maternity and paternity leave, regular employees receive 15-20 days of paid annual leave. If you're interested in joining us, please contact us via WhatsApp: +14093601139
(Note: You must be 25 years or older)`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "17. Legitimate US Senior Software Engineer $120,000/year",
			content: `Senior Software Engineer at Stripe.
Salary: $120,000/year with comprehensive healthcare and 401(k).
Requirements: 5+ years of experience with distributed systems and Go.
Bachelor's degree in Computer Science.
Apply on our careers page at greenhouse.io. We never charge application fees.`,
			expectScam: false,
			minScore:   0,
			maxScore:   15,
		},
		{
			name: "18. US Remote Internship $25/hour",
			content: `Remote Software Engineering Internship (Summer).
Compensation: $25/hour.
Mentorship and technical workshops provided.
Interview includes coding assessment and panel interview.`,
			expectScam: false,
			minScore:   0,
			maxScore:   20,
		},
		{
			name: "19. US Software Engineer USD 80K - 120K annually",
			content: `Backend Engineer. Salary: USD 80K - 120K annually.
Requirements: 3+ years experience with PostgreSQL and REST APIs.
Apply at workday portal.`,
			expectScam: false,
			minScore:   0,
			maxScore:   20,
		},
		{
			name: "20. Fake US Data Entry $100,000/year with Advance Fee",
			content: `Urgent Hiring! Work from Home Data Entry Operator.
Earn $100,000/year with no experience required.
Guaranteed direct placement without interview.
Candidates must pay a refundable onboarding security deposit of $350 before kit delivery.
Contact HR on Telegram: @us_recruitment_hub`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "21. Fake WFH $5,000/month with Telegram & Registration Fee",
			content: `Earn $5,000/month typing documents at home.
No experience required! Guaranteed daily income.
Pay $300 registration fee before start.
Reach out to recruiter on Telegram @easy_us_jobs immediately.`,
			expectScam: true,
			minScore:   75,
			maxScore:   100,
		},
		{
			name: "22. Incidental Price in Legitimate Posting ($500 equipment)",
			content: `Full Stack Engineer. We offer competitive salary of $110,000/year plus $500 home office equipment stipend.
Degree in Computer Science and 3+ years experience required. Apply on our website.`,
			expectScam: false,
			minScore:   0,
			maxScore:   15,
		},
	}

	totalPassed := 0
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w, resp := executeRequest(r, tc.content)
			if w.Code != http.StatusOK {
				t.Fatalf("Expected status 200, got %d", w.Code)
			}

			if tc.expectScam && resp.Score < 50 {
				t.Errorf("FAIL [False Negative]: Expected high threat score (>= 50), but got %d for: %s (Salary: %+v)", resp.Score, tc.name, resp.ParsedSalary)
			} else if !tc.expectScam && resp.Score >= 35 {
				t.Errorf("FAIL [False Positive]: Expected low threat score (< 35), but got %d for: %s", resp.Score, tc.name)
			} else if resp.Score < tc.minScore || resp.Score > tc.maxScore {
				t.Errorf("Score %d out of expected range [%d, %d] for: %s", resp.Score, tc.minScore, tc.maxScore, tc.name)
			} else {
				totalPassed++
			}
		})
	}

	t.Logf("✅ Successfully passed %d / %d multi-signal & currency-aware tests!", totalPassed, len(testCases))
}
