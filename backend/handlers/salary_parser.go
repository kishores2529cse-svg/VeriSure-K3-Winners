package handlers

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// ParsedSalary represents structured, currency-aware compensation metadata
type ParsedSalary struct {
	Currency            string  `json:"currency"`                       // "USD", "INR", "EUR", "GBP"
	Amount              float64 `json:"amount,omitempty"`               // Single amount
	MinAmount           float64 `json:"min_amount,omitempty"`           // Range minimum
	MaxAmount           float64 `json:"max_amount,omitempty"`           // Range maximum
	Period              string  `json:"period"`                         // "hour", "day", "week", "month", "year"
	NormalizedAnnualMin float64 `json:"normalized_annual_min"`          // Annualized min
	NormalizedAnnualMax float64 `json:"normalized_annual_max"`          // Annualized max
	NormalizedAnnualAvg float64 `json:"normalized_annual_avg"`          // Annualized average or single
	RawText             string  `json:"raw_text"`                       // Exact matched excerpt
	IsAnomalous         bool    `json:"is_anomalous"`                   // Whether flagged as an anomaly
	AnomalyReason       string  `json:"anomaly_reason,omitempty"`       // Evidence-based explanation
	RiskContribution    int     `json:"risk_contribution"`              // Score impact
}

// Regular expressions for currency indicators
var (
	usdCurrencyRegex = regexp.MustCompile(`(?i)(?:\$|usd|us\$|us\s+dollars?|dollars?)`)
	inrCurrencyRegex = regexp.MustCompile(`(?i)(?:₹|inr|rs\.?|rupees?|lpa)`)
	eurCurrencyRegex = regexp.MustCompile(`(?i)(?:€|eur|euros?)`)
	gbpCurrencyRegex = regexp.MustCompile(`(?i)(?:£|gbp|pounds?)`)

	// Context keywords indicating compensation
	salaryContextRegex = regexp.MustCompile(`(?i)\b(?:salary|pay|payout|earn|earning|earnings|compensation|income|stipend|package|ctc|lpa|remuneration|wage|wages|give\s+you|pay\s+you)\b`)

	// Units of duration, count, or non-salary metrics that must NOT be confused with salary
	unitDurationCountRegex = regexp.MustCompile(`(?i)^\s*(?:minutes?|mins?|seconds?|secs?|hours?|hrs?|days?(?:\s+of|\s+leave|\s+off)?|weeks?(?:\s+of|\s+leave)?|months?(?:\s+of|\s+leave)?|years?(?:\s+old|\s+or\s+older)?|openings?|vacancies?|positions?|slots?|candidates?|people|percent|%|km|miles)\b`)

	// Words indicating non-salary incidental items (e.g. "$500 laptop", "pay $300 fee")
	nonSalaryContextRegex = regexp.MustCompile(`(?i)\b(?:laptop|phone|iphone|macbook|device|gadget|registration\s+fee|processing\s+fee|security\s+deposit|onboarding\s+fee|verification\s+fee|starter\s+kit|kit|delivery|courier|fee|fees|deposit|charge|charges|cost|buy|purchase|invest|investment|price)\b`)

	// Range salary regex: e.g. "$200 to $500 per day", "$50,000 - $80,000/year", "USD 80K - 120K annually", "₹6,00,000 - ₹10,00,000/year", "₹5 LPA - ₹8 LPA", "$50K to $80K per year"
	rangeSalaryRegex = regexp.MustCompile(`(?i)(?:(?:salary|pay|compensation|earn|income|package|ctc|stipend|between|give\s+you)\s*[:\s-]*)?([$₹€£]|usd|inr|rs\.?|eur|gbp)?\s*([0-9]+(?:[.,][0-9]+)*)\s*([kKmM]|lakh|lakhs|lac|lacs|crore|crores|cr|lpa)?\s*(?:-|to|–)\s*([$₹€£]|usd|inr|rs\.?|eur|gbp)?\s*([0-9]+(?:[.,][0-9]+)*)\s*([kKmM]|lakh|lakhs|lac|lacs|crore|crores|cr|lpa)?\s*([$₹€£]|usd|inr|rs\.?|eur|gbp|dollars?|rupees?|euros?|pounds?)?\s*(?:per\s+(?:hour|hr|day|week|month|year|annum)|/(?:hour|hr|day|week|month|year|hr|mo|yr)|hourly|daily|weekly|monthly|yearly|annually|annual|per\s+annum|p\.a\.|pa|p\.m\.|pm|lpa)?\b`)

	// Single salary regex with currency or context
	singleSalaryRegex = regexp.MustCompile(`(?i)(?:(?:salary|pay|payout|compensation|earn|earnings|income|package|ctc|stipend|give\s+you|pay\s+you)\s*(?:is|of|over|above|around|upto|up\s+to|:|-)?\s+)?([$₹€£]|usd|us\$|inr|rs\.?|eur|gbp)?\s*([0-9]+(?:[.,][0-9]+)*)\s*([kKmM]|lakh|lakhs|lac|lacs|crore|crores|cr|lpa)\s*(?:([$₹€£]|usd|us\$|inr|rs\.?|eur|gbp|dollars?|rupees?|euros?|pounds?))?\s*(?:per\s+(?:hour|hr|day|week|month|year|annum)|/(?:hour|hr|day|week|month|year|hr|mo|yr)|hourly|daily|weekly|monthly|yearly|annually|annual|per\s+annum|p\.a\.|pa|p\.m\.|pm|lpa)?\b|(?:(?:salary|pay|payout|compensation|earn|earnings|income|package|ctc|stipend|give\s+you|pay\s+you)\s*(?:is|of|over|above|around|upto|up\s+to|:|-)?\s+)?([$₹€£]|usd|us\$|inr|rs\.?|eur|gbp)\s*([0-9]+(?:[.,][0-9]+)*)\s*(?:([$₹€£]|usd|us\$|inr|rs\.?|eur|gbp|dollars?|rupees?|euros?|pounds?))?\s*(?:per\s+(?:hour|hr|day|week|month|year|annum)|/(?:hour|hr|day|week|month|year|hr|mo|yr)|hourly|daily|weekly|monthly|yearly|annually|annual|per\s+annum|p\.a\.|pa|p\.m\.|pm|lpa)\b|(?:(?:salary|pay|payout|compensation|earn|earnings|income|package|ctc|stipend|give\s+you|pay\s+you)\s*(?:is|of|over|above|around|upto|up\s+to|:|-)?\s+)([0-9]+(?:[.,][0-9]+)*)\s*(?:([$₹€£]|usd|us\$|inr|rs\.?|eur|gbp|dollars?|rupees?|euros?|pounds?))?\s*(?:per\s+(?:hour|hr|day|week|month|year|annum)|/(?:hour|hr|day|week|month|year|hr|mo|yr)|hourly|daily|weekly|monthly|yearly|annually|annual|per\s+annum|p\.a\.|pa|p\.m\.|pm|lpa)?\b`)
)

// normalizeCurrency detects and canonicalizes currency string
func normalizeCurrency(currencyStr string, surroundingText string) string {
	lower := strings.ToLower(currencyStr)
	switch {
	case strings.Contains(lower, "inr") || strings.Contains(lower, "₹") || strings.Contains(lower, "rs") || strings.Contains(lower, "rupee") || strings.Contains(lower, "lpa") || strings.Contains(lower, "lakh") || strings.Contains(lower, "crore"):
		return "INR"
	case strings.Contains(lower, "usd") || strings.Contains(lower, "$") || strings.Contains(lower, "dollar"):
		return "USD"
	case strings.Contains(lower, "eur") || strings.Contains(lower, "€") || strings.Contains(lower, "euro"):
		return "EUR"
	case strings.Contains(lower, "gbp") || strings.Contains(lower, "£") || strings.Contains(lower, "pound"):
		return "GBP"
	}

	// Surrounding context fallback
	surrLower := strings.ToLower(surroundingText)
	if usdCurrencyRegex.MatchString(surrLower) {
		return "USD"
	}
	if inrCurrencyRegex.MatchString(surrLower) {
		return "INR"
	}
	if eurCurrencyRegex.MatchString(surrLower) {
		return "EUR"
	}
	if gbpCurrencyRegex.MatchString(surrLower) {
		return "GBP"
	}

	return "USD" // Default if symbol was $ or unspecified standard
}

// parseNumericAmount converts a string like "50,000", "50000.50", "6", "1.5" with multiplier into float64
func parseNumericAmount(numStr string, multiplierStr string) float64 {
	cleaned := strings.TrimSpace(numStr)
	if cleaned == "" {
		return 0
	}

	// Handle Indian comma grouping e.g. "6,00,000" or standard "600,000"
	cleaned = strings.ReplaceAll(cleaned, ",", "")
	val, err := strconv.ParseFloat(cleaned, 64)
	if err != nil {
		return 0
	}

	multLower := strings.ToLower(strings.TrimSpace(multiplierStr))
	switch multLower {
	case "k":
		val *= 1000
	case "m":
		val *= 1000000
	case "lakh", "lakhs", "lac", "lacs", "lpa":
		val *= 100000
	case "crore", "crores", "cr":
		val *= 10000000
	}

	return val
}

// detectPeriod identifies frequency: hour, day, week, month, year
func detectPeriod(matchStr string, defaultPeriod string) string {
	lower := strings.ToLower(matchStr)
	switch {
	case strings.Contains(lower, "hour") || strings.Contains(lower, "/hr") || strings.Contains(lower, "/hour") || strings.Contains(lower, "hourly") || strings.Contains(lower, "ph"):
		return "hour"
	case strings.Contains(lower, "day") || strings.Contains(lower, "/day") || strings.Contains(lower, "daily") || strings.Contains(lower, "per day"):
		return "day"
	case strings.Contains(lower, "week") || strings.Contains(lower, "/week") || strings.Contains(lower, "/wk") || strings.Contains(lower, "weekly") || strings.Contains(lower, "per week"):
		return "week"
	case strings.Contains(lower, "month") || strings.Contains(lower, "/month") || strings.Contains(lower, "/mo") || strings.Contains(lower, "monthly") || strings.Contains(lower, "per month") || strings.Contains(lower, "pm") || strings.Contains(lower, "p.m."):
		return "month"
	case strings.Contains(lower, "year") || strings.Contains(lower, "/year") || strings.Contains(lower, "/yr") || strings.Contains(lower, "yearly") || strings.Contains(lower, "annual") || strings.Contains(lower, "annually") || strings.Contains(lower, "per year") || strings.Contains(lower, "annum") || strings.Contains(lower, "p.a.") || strings.Contains(lower, "pa") || strings.Contains(lower, "lpa") || strings.Contains(lower, "ctc"):
		return "year"
	}
	return defaultPeriod
}

// annualize converts an amount in a given period to an annualized equivalent
func annualize(amount float64, period string) float64 {
	switch period {
	case "hour":
		return amount * 2080 // 40 hrs/wk * 52 wks
	case "day":
		return amount * 260 // 5 days/wk * 52 wks
	case "week":
		return amount * 52
	case "month":
		return amount * 12
	case "year":
		return amount
	default:
		return amount
	}
}

// ParseSalary extracts, standardizes and normalizes compensation from text, prioritizing anomalous lures
func ParseSalary(content string) *ParsedSalary {
	var candidates []*ParsedSalary

	// 1. Check Range Salaries e.g. "$200 to $500 per day", "$50,000 - $80,000/year", "USD 80K - 120K annually", "₹6,00,000 - ₹10,00,000/year", "₹5 LPA - ₹8 LPA"
	rangeMatches := rangeSalaryRegex.FindAllStringSubmatchIndex(content, -1)
	for _, matchIdx := range rangeMatches {
		rawMatched := content[matchIdx[0]:matchIdx[1]]
		
		// Context window
		ctxStart := matchIdx[0] - 40
		if ctxStart < 0 {
			ctxStart = 0
		}
		ctxEnd := matchIdx[1] + 40
		if ctxEnd > len(content) {
			ctxEnd = len(content)
		}
		surrounding := content[ctxStart:ctxEnd]

		// Text immediately after match
		followingText := ""
		if matchIdx[1] < len(content) {
			followEnd := matchIdx[1] + 30
			if followEnd > len(content) {
				followEnd = len(content)
			}
			followingText = content[matchIdx[1]:followEnd]
		}

		// Submatches
		curr1 := getSubmatchString(content, matchIdx, 1)
		num1 := getSubmatchString(content, matchIdx, 2)
		mult1 := getSubmatchString(content, matchIdx, 3)
		curr2 := getSubmatchString(content, matchIdx, 4)
		num2 := getSubmatchString(content, matchIdx, 5)
		mult2 := getSubmatchString(content, matchIdx, 6)
		curr3 := getSubmatchString(content, matchIdx, 7)

		curSymbol := curr1
		if curSymbol == "" {
			curSymbol = curr2
		}
		if curSymbol == "" {
			curSymbol = curr3
		}

		// CRITICAL FILTER: If no currency indicator and followed by duration units (e.g. "20 to 60 minutes daily" or "15-20 days"), REJECT!
		if curSymbol == "" && mult1 == "" && mult2 == "" {
			if unitDurationCountRegex.MatchString(followingText) || unitDurationCountRegex.MatchString(rawMatched) {
				continue
			}
			// Must have explicit salary context word preceding it if no currency symbol
			if !salaryContextRegex.MatchString(surrounding) {
				continue
			}
		}

		// Filter out non-salary incidental items (e.g. "Selling laptop for $300 - $400")
		if nonSalaryContextRegex.MatchString(surrounding) && !salaryContextRegex.MatchString(surrounding) {
			continue
		}

		currency := normalizeCurrency(curSymbol, surrounding)
		minVal := parseNumericAmount(num1, mult1)
		maxVal := parseNumericAmount(num2, mult2)

		if minVal == 0 && maxVal == 0 {
			continue
		}

		// Infer multiplier if one side had it e.g. "80 - 120K"
		if mult1 == "" && mult2 != "" && minVal < 1000 && maxVal >= 1000 {
			minVal = parseNumericAmount(num1, mult2)
		}

		period := detectPeriod(rawMatched, "year")
		if period == "year" {
			if strings.Contains(strings.ToLower(surrounding), "per day") || strings.Contains(strings.ToLower(surrounding), "daily") {
				period = "day"
			} else if strings.Contains(strings.ToLower(surrounding), "per week") || strings.Contains(strings.ToLower(surrounding), "weekly") {
				period = "week"
			} else if strings.Contains(strings.ToLower(surrounding), "per month") || strings.Contains(strings.ToLower(surrounding), "monthly") {
				period = "month"
			}
		}

		annMin := annualize(minVal, period)
		annMax := annualize(maxVal, period)
		annAvg := (annMin + annMax) / 2.0

		res := &ParsedSalary{
			Currency:            currency,
			MinAmount:           minVal,
			MaxAmount:           maxVal,
			Amount:              annAvg,
			Period:              period,
			NormalizedAnnualMin: annMin,
			NormalizedAnnualMax: annMax,
			NormalizedAnnualAvg: annAvg,
			RawText:             strings.TrimSpace(rawMatched),
		}

		EvaluateSalaryAnomaly(res, content)
		candidates = append(candidates, res)
	}

	// 2. Check Single Salary Matches e.g. "$2,000/week", "$2000 per day", "$5,000/month", "$60,000/year", "$60K/year", "$25/hour", "₹50,000/month", "₹6 LPA", "6 LPA"
	singleMatches := singleSalaryRegex.FindAllStringSubmatchIndex(content, -1)
	for _, matchIdx := range singleMatches {
		rawMatched := content[matchIdx[0]:matchIdx[1]]
		
		ctxStart := matchIdx[0] - 40
		if ctxStart < 0 {
			ctxStart = 0
		}
		ctxEnd := matchIdx[1] + 40
		if ctxEnd > len(content) {
			ctxEnd = len(content)
		}
		surrounding := content[ctxStart:ctxEnd]

		followingText := ""
		if matchIdx[1] < len(content) {
			followEnd := matchIdx[1] + 30
			if followEnd > len(content) {
				followEnd = len(content)
			}
			followingText = content[matchIdx[1]:followEnd]
		}

		// Context check: Must have currency or salary context or explicit period
		hasPeriodInMatch := detectPeriod(rawMatched, "") != ""
		hasSalaryContext := salaryContextRegex.MatchString(surrounding)
		isLPAorK := strings.Contains(strings.ToLower(rawMatched), "lpa") || strings.Contains(strings.ToLower(rawMatched), "k") || strings.Contains(strings.ToLower(rawMatched), "lakh")
		hasCurrencyInMatch := usdCurrencyRegex.MatchString(rawMatched) || inrCurrencyRegex.MatchString(rawMatched) || eurCurrencyRegex.MatchString(rawMatched) || gbpCurrencyRegex.MatchString(rawMatched)

		if !hasCurrencyInMatch && !isLPAorK && !hasSalaryContext {
			continue
		}

		if !hasCurrencyInMatch && unitDurationCountRegex.MatchString(followingText) {
			continue
		}

		// Filter out non-salary incidental items (e.g. "$500 laptop", "pay $300 registration fee")
		if nonSalaryContextRegex.MatchString(surrounding) && !hasSalaryContext && !hasPeriodInMatch {
			continue
		}

		// Find the matched number and multiplier
		var numStr, multStr, currStr string
		for i := 1; i < len(matchIdx)/2; i++ {
			subStr := getSubmatchString(content, matchIdx, i)
			if subStr == "" {
				continue
			}
			lowerSub := strings.ToLower(subStr)
			if usdCurrencyRegex.MatchString(lowerSub) || inrCurrencyRegex.MatchString(lowerSub) || eurCurrencyRegex.MatchString(lowerSub) || gbpCurrencyRegex.MatchString(lowerSub) {
				if currStr == "" {
					currStr = subStr
				}
			}
			if regexp.MustCompile(`^[0-9]+(?:[.,][0-9]+)*$`).MatchString(subStr) {
				numStr = subStr
			}
			if regexp.MustCompile(`(?i)^[kKmM]|lakh|lakhs|lac|lacs|crore|crores|cr|lpa$`).MatchString(subStr) {
				multStr = subStr
			}
		}

		if numStr == "" {
			continue
		}

		currency := normalizeCurrency(currStr, surrounding)
		amount := parseNumericAmount(numStr, multStr)
		if amount == 0 {
			continue
		}

		// Default period based on format
		defaultPeriod := "month"
		if strings.Contains(strings.ToLower(rawMatched), "lpa") || strings.Contains(strings.ToLower(rawMatched), "annual") || strings.Contains(strings.ToLower(rawMatched), "year") || strings.Contains(strings.ToLower(rawMatched), "ctc") || strings.Contains(strings.ToLower(rawMatched), "annum") || strings.Contains(strings.ToLower(rawMatched), "p.a.") {
			defaultPeriod = "year"
		} else if strings.Contains(strings.ToLower(rawMatched), "week") || strings.Contains(strings.ToLower(rawMatched), "weekly") || strings.Contains(strings.ToLower(surrounding), "weekly") {
			defaultPeriod = "week"
		} else if strings.Contains(strings.ToLower(rawMatched), "day") || strings.Contains(strings.ToLower(rawMatched), "daily") || strings.Contains(strings.ToLower(surrounding), "daily") || strings.Contains(strings.ToLower(surrounding), "per day") {
			defaultPeriod = "day"
		} else if strings.Contains(strings.ToLower(rawMatched), "hour") || strings.Contains(strings.ToLower(rawMatched), "hr") {
			defaultPeriod = "hour"
		} else if amount >= 50000 && currency == "USD" {
			defaultPeriod = "year"
		}

		period := detectPeriod(rawMatched, defaultPeriod)
		if period == "year" && (strings.Contains(strings.ToLower(surrounding), "weekly salary") || strings.Contains(strings.ToLower(surrounding), "per week")) {
			period = "week"
		} else if period == "year" && (strings.Contains(strings.ToLower(surrounding), "daily salary") || strings.Contains(strings.ToLower(surrounding), "per day") || strings.Contains(strings.ToLower(surrounding), "daily")) {
			period = "day"
		}

		annAmount := annualize(amount, period)

		res := &ParsedSalary{
			Currency:            currency,
			Amount:              amount,
			Period:              period,
			NormalizedAnnualMin: annAmount,
			NormalizedAnnualMax: annAmount,
			NormalizedAnnualAvg: annAmount,
			RawText:             strings.TrimSpace(rawMatched),
		}

		EvaluateSalaryAnomaly(res, content)
		candidates = append(candidates, res)
	}

	if len(candidates) == 0 {
		return nil
	}

	// Prioritize candidates: Pick the one that is anomalous (highest risk contribution)
	var bestCandidate *ParsedSalary
	for _, c := range candidates {
		if bestCandidate == nil {
			bestCandidate = c
			continue
		}
		if c.IsAnomalous && (!bestCandidate.IsAnomalous || c.RiskContribution > bestCandidate.RiskContribution) {
			bestCandidate = c
		}
	}

	return bestCandidate
}

func getSubmatchString(content string, matchIdx []int, group int) string {
	start := matchIdx[2*group]
	end := matchIdx[2*group+1]
	if start >= 0 && end >= 0 && end <= len(content) {
		return content[start:end]
	}
	return ""
}

// EvaluateSalaryAnomaly checks role, qualifications, and context-specific benchmarks
func EvaluateSalaryAnomaly(salary *ParsedSalary, content string) {
	if salary == nil {
		return
	}

	lower := strings.ToLower(content)

	// Identify role archetype & suspicious signals
	isAbsurdOrIncoherent := regexp.MustCompile(`(?i)\b(?:stand\s+near\s+me|stay\s+with\s+me|sit\s+(?:near|next\s+to|beside)\s+me|survive\s+in\s+the\s+footer|best\s+of\s+vector|god\s+bless\s+you|for\s+\d+\s+years\s+and\s+stand|give\s+you\s+[$₹€£]\s*\d+)\b`).MatchString(lower)
	isTaskScamClues := regexp.MustCompile(`(?i)\b(?:update\s+(?:their\s+)?data|help\s+merchants|minutes?\s+daily|anytime,\s*anywhere|order\s+grabbing|rating\s+apps?|like\s+and\s+subscribe|free\s+training|20\s+to\s+60\s+minutes|data\s+entry|typing|copy\s+paste|simple\s+tasks?)\b`).MatchString(lower)
	isTechOrSenior := regexp.MustCompile(`(?i)\b(?:senior|lead|architect|software\s+engineer|developer|full\s+stack|backend|frontend|data\s+scientist|machine\s+learning|devops|cloud\s+engineer|bachelor['']s|master['']s|computer\s+science|3\+\s+years|5\+\s+years)\b`).MatchString(lower)
	isInternship := regexp.MustCompile(`(?i)\b(?:intern|internship|trainee|apprentice|research\s+assistant|student)\b`).MatchString(lower)
	isNoExperience := regexp.MustCompile(`(?i)\b(?:no\s+experience(?:\s+required|\s+needed)?|freshers?\s+can\s+apply|for\s+freshers?|zero\s+experience|no\s+skills?\s+needed|no\s+qualifications?|no\s+interview)\b`).MatchString(lower)
	isGuaranteedDaily := regexp.MustCompile(`(?i)\b(?:guaranteed\s+(?:daily|monthly)\s+income|daily\s+payout|earn\s+daily|100%\s+daily\s+profit|earn\s+[$₹€£]\s*[0-9]+(?:\s*to\s*[$₹€£]?\s*[0-9]+)?\s*per\s+day)\b`).MatchString(lower)

	annVal := salary.NormalizedAnnualAvg

	// 1. Extreme / Astronomical Daily Pay & Absurd Demands (e.g. $2000 per day = $520,000/yr!)
	if (salary.Period == "day" && salary.Amount >= 500) || (salary.Period == "hour" && salary.Amount >= 100) || (annVal >= 250000 && !isTechOrSenior) || isAbsurdOrIncoherent {
		salary.IsAnomalous = true
		salary.RiskContribution = 50
		if salary.Currency == "USD" {
			salary.AnomalyReason = fmt.Sprintf("Astronomical payout claim of %s ($%.0f/year equivalent) is completely unrealistic for zero-qualification or incoherent work.", salary.RawText, annVal)
		} else {
			salary.AnomalyReason = fmt.Sprintf("Astronomical payout claim of %s (₹%.0f/year equivalent) is completely unrealistic for zero-qualification work.", salary.RawText, annVal)
		}
		return
	}

	// 2. Task Scams / Merchant Data Updating / Micro-Work with Inflated Payouts (e.g. $200-$500/day or $2,000/week)
	if isTaskScamClues || isGuaranteedDaily {
		if salary.Currency == "USD" {
			if salary.Period == "day" && (salary.Amount >= 100 || salary.MinAmount >= 100) {
				salary.IsAnomalous = true
				salary.RiskContribution = 45
				salary.AnomalyReason = fmt.Sprintf("Advertised payout of %s ($%.0f/year equivalent) for brief remote merchant tasks indicates high-confidence task-scam bait.", salary.RawText, annVal)
				return
			}
			if salary.Period == "week" && salary.Amount >= 1000 {
				salary.IsAnomalous = true
				salary.RiskContribution = 45
				salary.AnomalyReason = fmt.Sprintf("Advertised weekly compensation of %s ($%.0f/year) is disproportionately high for simplistic online assistance.", salary.RawText, annVal)
				return
			}
			if annVal >= 45000 {
				salary.IsAnomalous = true
				salary.RiskContribution = 35
				salary.AnomalyReason = fmt.Sprintf("Advertised compensation of %s ($%.0f/year) is notably inflated for basic remote tasks.", salary.RawText, annVal)
				return
			}
		} else if salary.Currency == "INR" {
			if (salary.Period == "day" && (salary.Amount >= 1500 || salary.MinAmount >= 1500)) || annVal >= 400000 {
				salary.IsAnomalous = true
				salary.RiskContribution = 45
				salary.AnomalyReason = fmt.Sprintf("Advertised payout of %s (₹%.0f/year equivalent) is disproportionately high for basic remote task work.", salary.RawText, annVal)
				return
			}
		}
	}

	// 3. Unskilled / Data Entry / "No Experience" roles with High Payouts
	if (isNoExperience && !isTechOrSenior && !isInternship) {
		if salary.Currency == "USD" {
			if annVal >= 75000 || (salary.Period == "month" && salary.Amount >= 4000) || (salary.Period == "hour" && salary.Amount >= 35) || (salary.Period == "day" && salary.Amount >= 150) {
				salary.IsAnomalous = true
				salary.RiskContribution = 35
				salary.AnomalyReason = fmt.Sprintf("Advertised compensation of %s ($%.0f/year) appears unusually high for an entry-level role with no experience required.", salary.RawText, annVal)
				return
			} else if annVal >= 45000 || (salary.Period == "month" && salary.Amount >= 3000) {
				salary.IsAnomalous = true
				salary.RiskContribution = 20
				salary.AnomalyReason = fmt.Sprintf("Advertised compensation of %s ($%.0f/year) is notably elevated for basic entry-level tasks.", salary.RawText, annVal)
				return
			}
		} else if salary.Currency == "INR" {
			if annVal >= 500000 || (salary.Period == "month" && salary.Amount >= 40000) || (salary.Period == "day" && salary.Amount >= 1500) {
				salary.IsAnomalous = true
				salary.RiskContribution = 35
				salary.AnomalyReason = fmt.Sprintf("Advertised compensation of %s (₹%.0f/year) is disproportionately high for elementary tasks with no experience.", salary.RawText, annVal)
				return
			}
		}
	}

	// 4. Technical / Senior Roles (e.g. Senior Software Engineer $120,000/year or ₹8 LPA) -> LEGITIMATE, NOT ANOMALOUS
	if isTechOrSenior && !isAbsurdOrIncoherent {
		salary.IsAnomalous = false
		salary.RiskContribution = 0
		if salary.Currency == "USD" && annVal <= 300000 {
			salary.AnomalyReason = fmt.Sprintf("Compensation of %s ($%.0f/year) is consistent with standard market benchmarks for technical roles.", salary.RawText, annVal)
		} else if salary.Currency == "INR" && annVal <= 5000000 {
			salary.AnomalyReason = fmt.Sprintf("Compensation of %s (₹%.0f/year) is within standard compensation bands for engineering positions.", salary.RawText, annVal)
		}
		return
	}

	// 5. Internship Benchmarks (e.g. $25/hour or ₹15,000/month) -> LEGITIMATE, NOT ANOMALOUS
	if isInternship && !isAbsurdOrIncoherent {
		if (salary.Currency == "USD" && salary.Amount <= 40 && salary.Period == "hour") || (salary.Currency == "INR" && salary.Amount <= 40000 && salary.Period == "month") {
			salary.IsAnomalous = false
			salary.RiskContribution = 0
			salary.AnomalyReason = fmt.Sprintf("Internship stipend of %s is realistic and transparent.", salary.RawText)
			return
		}
	}

	// Default fallback: If compensation doesn't trigger red flags
	salary.IsAnomalous = false
	salary.RiskContribution = 0
}

// FormatSalaryDisplay returns a clean human-readable summary
func (s *ParsedSalary) FormatSalaryDisplay() string {
	if s == nil {
		return ""
	}
	if s.MinAmount > 0 && s.MaxAmount > 0 {
		return fmt.Sprintf("%s %.0f - %.0f / %s (Annual: %s %.0f - %.0f)", s.Currency, s.MinAmount, s.MaxAmount, s.Period, s.Currency, s.NormalizedAnnualMin, s.NormalizedAnnualMax)
	}
	return fmt.Sprintf("%s %.0f / %s (Annualized: %s %.0f)", s.Currency, s.Amount, s.Period, s.Currency, s.NormalizedAnnualAvg)
}
