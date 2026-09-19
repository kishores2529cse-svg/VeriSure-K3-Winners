package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleScamScanner is a placeholder handler for scam scanner
func HandleScamScanner(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"module": "Scam Scanner initialized",
		"message": "Scam scanner placeholder",
	})
}
