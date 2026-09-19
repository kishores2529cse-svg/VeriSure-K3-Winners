package handlers

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SignalCategory defines a semantic fraud dimension
type SignalCategory string

const (
	CatAdvancePayment    SignalCategory = "Advance Payment / Fee Demand"
	CatSalaryAnomaly     SignalCategory = "Unrealistic Salary / Income Bait"
	CatRecruitmentScope  SignalCategory = "Recruitment Shortcuts / Unrealistic Scope"
	CatSuspiciousChannel SignalCategory = "Unverified / Off-Platform Channel"
	CatSocialPressure    SignalCategory = "Urgency & Social Engineering"
	CatPaymentMethod     SignalCategory = "Untraceable / Direct UPI / Crypto / Escrow Bypass"
	CatCredentialTheft   SignalCategory = "Sensitive Credential Harvesting"
	CatLegitimacySignal  SignalCategory = "Legitimacy & Professional Verification"
)

// SemanticPattern represents a generalized pattern rule with regex and category
type SemanticPattern struct {
	Regex      *regexp.Regexp
	Category   SignalCategory
	Weight     int
	Rationale  string
	IsDampener bool // If true, reduces risk (legitimacy marker)
}

// ScamFinding represents a concrete evidence item identified in the text
type ScamFinding struct {
	MatchedTerm string `json:"matched_term"`
	Weight      int    `json:"weight"`
	Rationale   string `json:"rationale"`
	Category    string `json:"category"`
}

// SignalBreakdown provides explainability on how each category contributed
type SignalBreakdown struct {
	Category    string `json:"category"`
	ScoreImpact int    `json:"score_impact"`
	Description string `json:"description"`
}

// AnalyzeScamRequest represents the incoming JSON payload
type AnalyzeScamRequest struct {
	Content string `json:"content" binding:"required"`
}

// AnalyzeScamResponse represents the comprehensive multi-signal risk audit
type AnalyzeScamResponse struct {
	Score             int               `json:"score"`
	RiskLevel         string            `json:"risk_level"`
	FlaggedTerms      []string          `json:"flagged_terms"`
	Rationale         []string          `json:"rationale"`
	Findings          []ScamFinding     `json:"findings"`
	SignalBreakdown   []SignalBreakdown `json:"signal_breakdown"`
	LegitimacySignals []string          `json:"legitimacy_signals"`
	ParsedSalary      *ParsedSalary     `json:"parsed_salary,omitempty"`
	AnalyzedAt        string            `json:"analyzed_at"`
	WordCount         int               `json:"word_count"`
}

// Compiled multi-signal semantic patterns
var semanticPatterns = []SemanticPattern{
	// ==========================================
	// 1. ADVANCE PAYMENT / MONEY REQUEST (High Severity)
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:refundable\s+(?:payment|deposit|fee|amount|sum|charge)|security\s+deposit|registration\s+fee|onboarding\s+(?:fee|charge|deposit|payment)|processing\s+(?:fee|charge)|training\s+(?:fee|cost|charge)|verification\s+(?:fee|charge)|gate\s+pass\s+charge|courier\s+(?:fee|charge)|document\s+verification\s+fee|application\s+fee)\b`),
		Category:  CatAdvancePayment,
		Weight:    50,
		Rationale: "Demands upfront payment or deposit under the guise of registration, onboarding, verification, or kit fees.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:pay|transfer|deposit|send|remit|submit|charge)\s+(?:(?:a\s+)?(?:small\s+|nominal\s+|refundable\s+|initial\s+|one[- ]time\s+)?(?:registration|processing|security|onboarding|training|kit|document|verification|gate\s+pass|uniform|id\s+card|application|slot|booking|courier|delivery)\s+(?:fee|fees|deposit|charge|charges|amount|money|payment|cost))\b`),
		Category:  CatAdvancePayment,
		Weight:    50,
		Rationale: "Demands candidates transfer money or fees for onboarding, training, or materials.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:candidates?\s+(?:are\s+required|must|need)\s+to\s+(?:make|pay|transfer|deposit|send))\s+(?:a\s+)?(?:small\s+|nominal\s+|refundable\s+)?(?:payment|amount|sum|fee|deposit|money)\b`),
		Category:  CatAdvancePayment,
		Weight:    50,
		Rationale: "Mandates candidates make a payment or deposit before onboarding or placement.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:pay\s+upfront|pay\s+before\s+joining|transfer\s+(?:₹|rs\.?|inr|\$|usd)?\s*\d+(?:,\d+)*\s+(?:to\s+secure|before|for|as|to\s+confirm)|fee\s+of\s+(?:₹|rs\.?|inr|\$|usd)?\s*\d+(?:,\d+)*\s+(?:is\s+required|required|prior|before))\b`),
		Category:  CatAdvancePayment,
		Weight:    50,
		Rationale: "Demands explicit monetary transfer to secure appointment or confirm job placement.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:purchase|buy)\s+(?:the\s+)?(?:starter\s+kit|kit|materials?|software|tools?|laptop\s+security)\s+(?:from\s+us|to\s+start|prior|before)\b`),
		Category:  CatAdvancePayment,
		Weight:    40,
		Rationale: "Requires mandatory purchase of equipment or starter kits from recruiter.",
	},

	// ==========================================
	// 2. UNREALISTIC SALARY / TASK INCOME BAIT
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:earn\s+without\s+investment|guaranteed\s+(?:monthly|daily)\s+income|100%\s+daily\s+profit|get\s+rich\s+quick|earn\s+daily\s+from\s+your\s+phone|i\s+will\s+give\s+you\s+[$₹€£]\s*[0-9]+(?:\s*per\s+day)?)\b`),
		Category:  CatSalaryAnomaly,
		Weight:    45,
		Rationale: "Promotes guaranteed or arbitrary daily personal payouts typical of task/social engineering scams.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:work\s+(?:20\s+to\s+60\s+minutes|1[- ]2\s+hours|\d+\s+minutes)\s+daily|anytime,\s*anywhere|help\s+merchants\s+update\s+their\s+data|order\s+grabbing|merchant\s+data\s+update)\b`),
		Category:  CatSalaryAnomaly,
		Weight:    35,
		Rationale: "Offers high daily/weekly compensation for minimal micro-tasks (20-60 mins daily merchant data updates).",
	},

	// ==========================================
	// 3. RECRUITMENT SHORTCUTS & ABSURD / INCOHERENT SCOPE
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:stand\s+near\s+me(?:\s+for\s+\d+\s+years)?|stay\s+with\s+me|sit\s+(?:near|next\s+to|beside)\s+me|survive\s+in\s+the\s+footer|best\s+of\s+vector|god\s+bless\s+you\s+all\s+the\s+time)\b`),
		Category:  CatRecruitmentScope,
		Weight:    45,
		Rationale: "Uses bizarre, nonsensical, or bot-generated requirements in a recruitment solicitation.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:no\s+experience\s+(?:needed|required)\s+(?:for\s+fresher|for\s+freshers)|no\s+experience\s+required\s+(?:for|as)\s+(?:manager|lead|director|executive|head|supervisor)|no\s+skills?\s+needed\s+(?:for|to\s+earn)|shortlisted\s+(?:for|as)\s+(?:executive\s+manager|manager|lead)|invite\s+you\s+for\s+an\s+interview\s+for\s+the\s+(?:information\s+systems\s+manager|manager|lead)\s+position)\b`),
		Category:  CatRecruitmentScope,
		Weight:    35,
		Rationale: "Offers high compensation or managerial positions with zero experience for freshers.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:no\s+interview\s+required|direct\s+selection|100%\s+guaranteed\s+job|100%\s+selection\s+guaranteed|instant\s+offer\s+letter|direct\s+appointment\s+letter|direct\s+appointment|direct\s+recruitment|no\s+resume\s+needed|profile\s+has\s+been\s+shortlisted)\b`),
		Category:  CatRecruitmentScope,
		Weight:    30,
		Rationale: "Bypasses standard talent screening, offering guaranteed placement or unsolicited shortlisting.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:simple\s+copy\s+paste\s+work|like\s+and\s+subscribe\s+to\s+earn|watch\s+videos\s+to\s+earn|review\s+products\s+for\s+money|video\s+like\s+and\s+subscribe)\b`),
		Category:  CatRecruitmentScope,
		Weight:    35,
		Rationale: "Employs task-based fraud mechanics (like/follow/review manipulation scams).",
	},

	// ==========================================
	// 4. SUSPICIOUS CHANNELS & OFF-PLATFORM REDIRECTION
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:telegram(?:\.me|:\s*@|\s+id|\s+channel|\s+account)|t\.me\/[a-zA-Z0-9_]+|contact\s+(?:hr|admin)?\s+on\s+telegram|on\s+telegram\s+@[a-zA-Z0-9_]+)\b`),
		Category:  CatSuspiciousChannel,
		Weight:    25,
		Rationale: "Diverts candidate communications to unmonitored Telegram handles or bots.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:whatsapp\s*(?:me|us|at|number|chat|screenshot)?\s*[:\s]*\+?\d{9,}|\b\+?\d{10}\s+on\s+gpay\b|\b\+?\d{10}\s+via\s+gpay\b)\b`),
		Category:  CatSuspiciousChannel,
		Weight:    25,
		Rationale: "Directs transactions or candidate intake strictly to personal WhatsApp or mobile numbers.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:send\s+(?:cv|resume|details)\s+to\s+[a-zA-Z0-9._%+-]+@(?:gmail|yahoo|hotmail|outlook)\.com)\b`),
		Category:  CatSuspiciousChannel,
		Weight:    15,
		Rationale: "Uses generic free webmail for corporate hiring rather than an authenticated company domain.",
	},

	// ==========================================
	// 5. UNTRACEABLE PAYMENT & ESCROW BYPASS
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:do\s+not\s+(?:use\s+the\s+app\s+checkout|pay\s+on\s+app)|send\s+money\s+to\s+this\s+alternate\s+number|transfer\s+to\s+alternate|pay\s+via\s+gpay\s+to\s+confirm|gpay\s+to\s+confirm\s+booking)\b`),
		Category:  CatPaymentMethod,
		Weight:    45,
		Rationale: "Coerces buyers or applicants to bypass platform checkout/escrow and send direct money transfers.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:(?:upi\s*id|upi|gpay|phonepe|paytm)\s*[:\s]*[a-zA-Z0-9.\-_]+@(?-i:[a-zA-Z]+)|\b\d{10}@(?-i:[a-zA-Z]+))\b`),
		Category:  CatPaymentMethod,
		Weight:    35,
		Rationale: "Demands direct peer-to-peer UPI transfer bypassing corporate escrow or bank accounts.",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:crypto\s+deposit|usdt\s+(?:transfer|deposit|security)|bitcoin\s+payment|trc20\s+wallet|gift\s+cards?|steam\s+code|amazon\s+voucher\s+payment)\b`),
		Category:  CatPaymentMethod,
		Weight:    40,
		Rationale: "Requests irreversible, untraceable payment instruments (crypto/gift cards).",
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:send\s+otp|share\s+upi\s+pin|enter\s+pin\s+to\s+receive|bank\s+password|cvv\s+number)\b`),
		Category:  CatCredentialTheft,
		Weight:    50,
		Rationale: "Attempts to harvest sensitive banking credentials or one-time passwords.",
	},

	// ==========================================
	// 6. URGENCY & SOCIAL PRESSURE (Weak/Contextual Signal)
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:urgent\s+requirement|hiring\s+urgently|apply\s+immediately|limited\s+(?:slots|vacancies|seats)|act\s+now|only\s+\d+\s+seats\s+left|offer\s+expires\s+in\s+\d+\s+hours?|urgent\s+relocation|look\s+forward\s+to\s+hearing\s+back\s+from\s+you\s+soon\s+as\s+possible|soon\s+as\s+possible\s+to\s+do\s+the\s+best)\b`),
		Category:  CatSocialPressure,
		Weight:    15,
		Rationale: "Uses artificial scarcity or pressure tactics to encourage hasty compliance.",
	},

	// ==========================================
	// 7. LEGITIMACY DAMPENERS (Negative Risk Multipliers)
	// ==========================================
	{
		Regex: regexp.MustCompile(`(?i)\b(?:no\s+(?:registration\s+|application\s+|upfront\s+)?fees?\s+(?:are\s+|is\s+)?(?:ever\s+)?charged|we\s+never\s+(?:ask\s+for|charge)\s+(?:any\s+)?money|beware\s+of\s+(?:fraudulent|fake)\s+recruiters?|no\s+payment\s+required|no\s+fees?\s+at\s+any\s+stage)\b`),
		Category:   CatLegitimacySignal,
		Weight:     -30,
		Rationale:  "Explicit anti-fraud disclosure stating no fees are ever charged for recruitment.",
		IsDampener: true,
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:bachelor['']s\s+degree|master['']s\s+degree|computer\s+science|engineering\s+degree|years?\s+of\s+(?:hands-on\s+)?experience|proficiency\s+in|strong\s+understanding\s+of|experience\s+with\s+[a-zA-Z0-9+#.]+)\b`),
		Category:   CatLegitimacySignal,
		Weight:     -15,
		Rationale:  "Articulates rigorous, domain-specific technical qualifications and professional credentials.",
		IsDampener: true,
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:key\s+responsibilities|job\s+responsibilities|role\s+overview|collaborate\s+with|design\s+and\s+implement|write\s+clean\s+code|code\s+reviews?|unit\s+and\s+integration\s+tests?)\b`),
		Category:   CatLegitimacySignal,
		Weight:     -15,
		Rationale:  "Defines authentic, structured role responsibilities and operational workflows.",
		IsDampener: true,
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:apply\s+through\s+our\s+official\s+careers\s+portal|careers\.[a-zA-Z0-9-]+\.[a-z]{2,}|apply\s+on\s+company\s+website|workday|greenhouse\.io|lever\.co)\b`),
		Category:   CatLegitimacySignal,
		Weight:     -20,
		Rationale:  "Routes applicants through verified corporate applicant tracking systems (ATS).",
		IsDampener: true,
	},
	{
		Regex: regexp.MustCompile(`(?i)\b(?:technical\s+round|coding\s+interview|system\s+design\s+round|hr\s+interview|panel\s+discussion|screening\s+round)\b`),
		Category:   CatLegitimacySignal,
		Weight:     -15,
		Rationale:  "Outlines a standard professional evaluation and multi-round screening process.",
		IsDampener: true,
	},
}

// Negation check strictly before the match start
var strictNegationPrefixRegex = regexp.MustCompile(`(?i)\b(?:no|never|not|don't|do\s+not|without\s+any)\s+$`)

// HandleScamScanner handles POST /api/v1/scams using the Currency-Aware Multi-Signal Semantic Detection Engine
func HandleScamScanner(c *gin.Context) {
	var req AnalyzeScamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Content cannot be empty",
		})
		return
	}

	// 1. Feature Extraction & Multi-Signal Detection
	categoryScores := make(map[SignalCategory]int)
	categoryDescriptions := make(map[SignalCategory][]string)
	flaggedTermsMap := make(map[string]bool)
	var flaggedTerms []string
	var findings []ScamFinding
	var rationaleList []string
	var legitimacyList []string

	for _, pattern := range semanticPatterns {
		locs := pattern.Regex.FindAllStringIndex(content, -1)
		if len(locs) == 0 {
			continue
		}

		for _, loc := range locs {
			matchedStr := content[loc[0]:loc[1]]
			matchedLower := strings.ToLower(matchedStr)

			// Check for contextual negation ONLY in the prefix text immediately preceding the match
			if !pattern.IsDampener {
				prefixStart := loc[0] - 20
				if prefixStart < 0 {
					prefixStart = 0
				}
				prefixContext := content[prefixStart:loc[0]]
				if strictNegationPrefixRegex.MatchString(prefixContext) {
					// Preceded by "no / never / do not" -> skip adding as scam finding
					continue
				}
			}

			if !flaggedTermsMap[matchedLower] {
				flaggedTermsMap[matchedLower] = true
				if !pattern.IsDampener {
					flaggedTerms = append(flaggedTerms, matchedStr)
				}
			}

			// Tally category score
			categoryScores[pattern.Category] += pattern.Weight
			categoryDescriptions[pattern.Category] = append(categoryDescriptions[pattern.Category], pattern.Rationale)

			if pattern.IsDampener {
				legitimacyList = append(legitimacyList, pattern.Rationale)
			} else {
				findings = append(findings, ScamFinding{
					MatchedTerm: matchedStr,
					Weight:      pattern.Weight,
					Rationale:   pattern.Rationale,
					Category:    string(pattern.Category),
				})
				rationaleList = append(rationaleList, pattern.Rationale)
			}
		}
	}

	// 2. Structured, Currency-Aware Salary Parsing & Anomaly Analysis
	parsedSalary := ParseSalary(content)
	if parsedSalary != nil {
		if parsedSalary.IsAnomalous {
			categoryScores[CatSalaryAnomaly] += parsedSalary.RiskContribution
			categoryDescriptions[CatSalaryAnomaly] = append(categoryDescriptions[CatSalaryAnomaly], parsedSalary.AnomalyReason)
			
			matchedLower := strings.ToLower(parsedSalary.RawText)
			if !flaggedTermsMap[matchedLower] {
				flaggedTermsMap[matchedLower] = true
				flaggedTerms = append(flaggedTerms, parsedSalary.RawText)
			}

			findings = append(findings, ScamFinding{
				MatchedTerm: parsedSalary.RawText,
				Weight:      parsedSalary.RiskContribution,
				Rationale:   parsedSalary.AnomalyReason,
				Category:    string(CatSalaryAnomaly),
			})
			rationaleList = append(rationaleList, parsedSalary.AnomalyReason)
		} else if parsedSalary.AnomalyReason != "" {
			// Benchmark confirmed legitimate
			legitimacyList = append(legitimacyList, parsedSalary.AnomalyReason)
		}
	}

	// 3. Combinatorial Risk & Interaction Scoring
	baseRiskScore := 0
	hasAdvancePayment := categoryScores[CatAdvancePayment] > 0
	hasSalaryAnomaly := categoryScores[CatSalaryAnomaly] > 0
	hasRecruitmentShortcut := categoryScores[CatRecruitmentScope] > 0
	hasSuspiciousChannel := categoryScores[CatSuspiciousChannel] > 0
	hasSocialPressure := categoryScores[CatSocialPressure] > 0
	hasPaymentMethod := categoryScores[CatPaymentMethod] > 0
	hasCredentialTheft := categoryScores[CatCredentialTheft] > 0
	legitimacyDampening := categoryScores[CatLegitimacySignal] // Negative value

	// Add base category contributions (with category caps to prevent single category saturation)
	for cat, score := range categoryScores {
		if cat == CatLegitimacySignal {
			continue
		}
		cappedCatScore := score
		if cappedCatScore > 65 {
			cappedCatScore = 65
		}
		baseRiskScore += cappedCatScore
	}

	// Combinatorial Interaction Multipliers (Synergy Bonus)
	synergyBonus := 0
	if hasAdvancePayment && (hasSuspiciousChannel || hasPaymentMethod) {
		synergyBonus += 25 // Advance fee + Telegram/UPI/WhatsApp is a classic fraud signature
	}
	if hasAdvancePayment && hasRecruitmentShortcut {
		synergyBonus += 20 // Advance fee + No interview/direct shortlisted
	}
	if hasSalaryAnomaly && (hasSuspiciousChannel || hasPaymentMethod) {
		synergyBonus += 25 // High task payout + WhatsApp/Telegram redirection
	}
	if hasSalaryAnomaly && hasRecruitmentShortcut {
		synergyBonus += 30 // High/absurd pay + No experience/absurd requirement is high-confidence lure
	}
	if hasSalaryAnomaly && hasSocialPressure {
		synergyBonus += 20 // High pay bait + Urgency/emotional manipulation
	}
	if hasAdvancePayment && hasSalaryAnomaly {
		synergyBonus += 15 // High pay bait paired with upfront charge
	}
	if hasSocialPressure && (hasAdvancePayment || hasPaymentMethod) {
		synergyBonus += 10 // Urgency pressure combined with financial demands
	}
	if hasCredentialTheft {
		synergyBonus += 30 // Direct credential harvesting
	}

	rawScore := baseRiskScore + synergyBonus + legitimacyDampening

	// Single isolated weak signals without other fraud indicators should stay low risk
	if !hasAdvancePayment && !hasPaymentMethod && !hasCredentialTheft && !hasSalaryAnomaly && !hasRecruitmentShortcut && !hasSuspiciousChannel {
		if rawScore > 20 && len(findings) <= 1 {
			rawScore = 15 // Capped to LOW risk if only minor urgency was found
		}
	}

	// Clamp final score strictly between 0 and 100
	finalScore := rawScore
	if finalScore > 100 {
		finalScore = 100
	}
	if finalScore < 0 {
		finalScore = 0
	}

	// Clean up findings if the final score was dampened to 0 (SAFE)
	if finalScore == 0 {
		flaggedTerms = []string{}
		findings = []ScamFinding{}
		rationaleList = []string{}
	}

	// 4. Threat Stratification
	riskLevel := "SAFE"
	switch {
	case finalScore >= 75:
		riskLevel = "CRITICAL"
	case finalScore >= 50:
		riskLevel = "HIGH"
	case finalScore >= 25:
		riskLevel = "MEDIUM"
	case finalScore > 0:
		riskLevel = "LOW"
	}

	// 5. Signal Breakdown Compilation
	var breakdownList []SignalBreakdown
	for cat, score := range categoryScores {
		if score != 0 {
			desc := "Standard evaluation"
			if len(categoryDescriptions[cat]) > 0 {
				desc = categoryDescriptions[cat][0]
			}
			breakdownList = append(breakdownList, SignalBreakdown{
				Category:    string(cat),
				ScoreImpact: score,
				Description: desc,
			})
		}
	}
	if synergyBonus > 0 {
		breakdownList = append(breakdownList, SignalBreakdown{
			Category:    "Multi-Signal Threat Synergy",
			ScoreImpact: synergyBonus,
			Description: "Risk multiplier triggered by dangerous co-occurrence of independent fraud vectors.",
		})
	}

	// Ensure clean empty arrays for JSON serialization
	if flaggedTerms == nil {
		flaggedTerms = []string{}
	}
	if findings == nil {
		findings = []ScamFinding{}
	}
	if rationaleList == nil {
		rationaleList = []string{}
	}
	if breakdownList == nil {
		breakdownList = []SignalBreakdown{}
	}
	if legitimacyList == nil {
		legitimacyList = []string{}
	}

	wordCount := len(strings.Fields(content))

	resp := AnalyzeScamResponse{
		Score:             finalScore,
		RiskLevel:         riskLevel,
		FlaggedTerms:      flaggedTerms,
		Rationale:         rationaleList,
		Findings:          findings,
		SignalBreakdown:   breakdownList,
		LegitimacySignals: legitimacyList,
		ParsedSalary:      parsedSalary,
		AnalyzedAt:        time.Now().UTC().Format(time.RFC3339),
		WordCount:         wordCount,
	}

	c.JSON(http.StatusOK, resp)
}
