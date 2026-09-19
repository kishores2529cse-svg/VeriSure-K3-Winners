package handlers

import (
	"testing"
)

func TestSalaryParserCases(t *testing.T) {
	tests := []struct {
		name                 string
		content              string
		expectedCurrency     string
		expectedAmountMin    float64
		expectedAmountMax    float64
		expectedPeriod       string
		expectedAnnualMin    float64
		expectedAnomalous    bool
	}{
		{
			name:                 "TEST 1: Data Entry Operator $100,000/year no experience",
			content:              "Data Entry Operator. Salary: $100,000/year. Requirements: No experience required.",
			expectedCurrency:     "USD",
			expectedAmountMin:    100000,
			expectedPeriod:       "year",
			expectedAnnualMin:    100000,
			expectedAnomalous:    true,
		},
		{
			name:                 "TEST 2: Senior Software Engineer $120,000/year 5+ years",
			content:              "Senior Software Engineer. Salary: $120,000/year. Experience: 5+ years required.",
			expectedCurrency:     "USD",
			expectedAmountMin:    120000,
			expectedPeriod:       "year",
			expectedAnnualMin:    120000,
			expectedAnomalous:    false,
		},
		{
			name:                 "TEST 3: WFH Data Entry $5,000/month",
			content:              "Work From Home Data Entry. Salary: $5,000/month. No experience required. Guaranteed income. Pay $300 registration fee.",
			expectedCurrency:     "USD",
			expectedAmountMin:    5000,
			expectedPeriod:       "month",
			expectedAnnualMin:    60000,
			expectedAnomalous:    true,
		},
		{
			name:                 "TEST 4: Software Engineer USD 80K - 120K annually",
			content:              "Software Engineer. Salary: USD 80K - 120K annually. Collaborate on Go backend services.",
			expectedCurrency:     "USD",
			expectedAmountMin:    80000,
			expectedAmountMax:    120000,
			expectedPeriod:       "year",
			expectedAnnualMin:    80000,
			expectedAnomalous:    false,
		},
		{
			name:                 "TEST 5: Cabin Crew $5,000 per month",
			content:              "International Airline Cabin Crew. Salary: $5,000 per month.",
			expectedCurrency:     "USD",
			expectedAmountMin:    5000,
			expectedPeriod:       "month",
			expectedAnnualMin:    60000,
			expectedAnomalous:    false,
		},
		{
			name:                 "TEST 6: Software Engineer ₹8 LPA",
			content:              "Software Engineer. Salary: ₹8 LPA. 2 years experience required. Apply on careers portal.",
			expectedCurrency:     "INR",
			expectedAmountMin:    800000,
			expectedPeriod:       "year",
			expectedAnnualMin:    800000,
			expectedAnomalous:    false,
		},
		{
			name:                 "TEST 7: Remote Internship $25/hour",
			content:              "Remote Internship for university students. Pay: $25/hour. Training provided.",
			expectedCurrency:     "USD",
			expectedAmountMin:    25,
			expectedPeriod:       "hour",
			expectedAnnualMin:    52000, // 25 * 2080 = 52000
			expectedAnomalous:    false,
		},
		{
			name:                 "TEST 8: Earn USD 50K annually no experience",
			content:              "Earn USD 50K annually with no experience required. Pay a refundable onboarding fee of USD 500. Contact HR through Telegram immediately.",
			expectedCurrency:     "USD",
			expectedAmountMin:    50000,
			expectedPeriod:       "year",
			expectedAnnualMin:    50000,
			expectedAnomalous:    true,
		},
		{
			name:                 "TEST 9: Non-salary incidental item ($500 laptop)",
			content:              "We provide a $500 laptop and monitor for work after you join our engineering team.",
			expectedCurrency:     "", // Should not parse $500 laptop as salary
			expectedAmountMin:    0,
			expectedAnomalous:    false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			parsed := ParseSalary(tc.content)
			if tc.expectedCurrency == "" {
				if parsed != nil && parsed.IsAnomalous {
					t.Fatalf("Expected nil or non-anomalous salary for %s, but got %+v", tc.name, parsed)
				}
				return
			}

			if parsed == nil {
				t.Fatalf("Expected parsed salary for %s, got nil", tc.name)
			}

			if parsed.Currency != tc.expectedCurrency {
				t.Errorf("[%s] Expected Currency %s, got %s", tc.name, tc.expectedCurrency, parsed.Currency)
			}

			if parsed.Period != tc.expectedPeriod {
				t.Errorf("[%s] Expected Period %s, got %s", tc.name, tc.expectedPeriod, parsed.Period)
			}

			if tc.expectedAmountMax > 0 {
				if parsed.MinAmount != tc.expectedAmountMin || parsed.MaxAmount != tc.expectedAmountMax {
					t.Errorf("[%s] Expected range %.0f - %.0f, got %.0f - %.0f", tc.name, tc.expectedAmountMin, tc.expectedAmountMax, parsed.MinAmount, parsed.MaxAmount)
				}
			} else {
				if parsed.Amount != tc.expectedAmountMin && parsed.MinAmount != tc.expectedAmountMin {
					t.Errorf("[%s] Expected amount %.0f, got amount=%.0f min=%.0f", tc.name, tc.expectedAmountMin, parsed.Amount, parsed.MinAmount)
				}
			}

			if parsed.IsAnomalous != tc.expectedAnomalous {
				t.Errorf("[%s] Expected IsAnomalous=%v, got %v (Reason: %s, Score: %d)", tc.name, tc.expectedAnomalous, parsed.IsAnomalous, parsed.AnomalyReason, parsed.RiskContribution)
			}
		})
	}
}
