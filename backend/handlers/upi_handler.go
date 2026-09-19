package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
)

type UPIRequest struct {
	UPIID string `json:"upi_id" binding:"required"`
}

type UPIResponse struct {
	UPIID           string   `json:"upi_id"`
	FormatValid     bool     `json:"format_valid"`
	UPIValid        bool     `json:"upi_valid"`
	BeneficiaryName string   `json:"beneficiary_name"`
	Reported        bool     `json:"reported"`
	RiskScore       int      `json:"risk_score"`
	RiskLevel       string   `json:"risk_level"`
	RiskFactors     []string `json:"risk_factors"`
	Provider        string   `json:"provider"`
}

type beneficiaryLookup interface {
	Verify(string) (verificationResult, error)
}

type verificationResult struct {
	Valid           bool
	BeneficiaryName string
	Reported        bool
	Provider        string
}

var upiPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]{1,254}@[A-Za-z0-9][A-Za-z0-9.-]{1,63}$`)

type demoProvider struct{}

func (demoProvider) Verify(upiID string) (verificationResult, error) {
	lowerID := strings.ToLower(upiID)
	result := verificationResult{Valid: true, BeneficiaryName: "ABC TRADERS", Provider: "Demo verification service"}
	if strings.Contains(lowerID, "reported") || strings.Contains(lowerID, "fraud") {
		result.Reported = true
		result.BeneficiaryName = "UNVERIFIED BENEFICIARY"
	}
	return result, nil
}

// authorizedProvider is a generic adapter for a provider approved by the deployment.
// The provider must return a JSON object with valid, beneficiary_name, and reported fields.
type authorizedProvider struct {
	endpoint string
	apiKey   string
}

func (p authorizedProvider) Verify(upiID string) (verificationResult, error) {
	requestURL := p.endpoint + "?upi_id=" + url.QueryEscape(upiID)
	request, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return verificationResult{}, err
	}
	request.Header.Set("Authorization", "Bearer "+p.apiKey)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return verificationResult{}, err
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return verificationResult{}, fmt.Errorf("verification provider returned status %d", response.StatusCode)
	}

	var payload struct {
		Valid           bool   `json:"valid"`
		BeneficiaryName string `json:"beneficiary_name"`
		Reported        bool   `json:"reported"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return verificationResult{}, err
	}
	return verificationResult{Valid: payload.Valid, BeneficiaryName: payload.BeneficiaryName, Reported: payload.Reported, Provider: "Authorized verification service"}, nil
}

func provider() beneficiaryLookup {
	endpoint, key := os.Getenv("UPI_VERIFICATION_API_URL"), os.Getenv("UPI_VERIFICATION_API_KEY")
	if endpoint != "" && key != "" {
		return authorizedProvider{endpoint: endpoint, apiKey: key}
	}
	return demoProvider{}
}

func HandleUPIVerification(c *gin.Context) {
	var req UPIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "upi_id is required"})
		return
	}
	upiID := strings.TrimSpace(req.UPIID)
	if !upiPattern.MatchString(upiID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Enter a valid UPI ID, such as example@bank"})
		return
	}

	lookup, err := provider().Verify(upiID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "The verification service is temporarily unavailable"})
		return
	}

	factors := make([]string, 0, 3)
	score := 15
	if !lookup.Valid {
		score += 45
		factors = append(factors, "The verification service could not validate this UPI address.")
	}
	if lookup.Reported {
		score += 55
		factors = append(factors, "This UPI ID has available fraud or suspect reports.")
	}
	if lookup.BeneficiaryName == "" {
		score += 20
		factors = append(factors, "No bank-registered beneficiary name was returned.")
	}
	if len(factors) == 0 {
		factors = append(factors, "The address format and provider validation passed.", "No available fraud reports were found.")
	}
	if score > 100 {
		score = 100
	}
	riskLevel := "LOW"
	if score >= 60 {
		riskLevel = "HIGH"
	} else if score >= 35 {
		riskLevel = "MEDIUM"
	}

	c.JSON(http.StatusOK, UPIResponse{UPIID: upiID, FormatValid: true, UPIValid: lookup.Valid, BeneficiaryName: lookup.BeneficiaryName, Reported: lookup.Reported, RiskScore: score, RiskLevel: riskLevel, RiskFactors: factors, Provider: lookup.Provider})
}
