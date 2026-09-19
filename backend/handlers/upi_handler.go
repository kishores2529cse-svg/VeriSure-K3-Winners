package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleUPIFraudDetection is a placeholder handler for UPI fraud detection
func HandleUPIFraudDetection(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"module": "UPI initialized",
		"message": "UPI fraud detection placeholder",
	})
}
