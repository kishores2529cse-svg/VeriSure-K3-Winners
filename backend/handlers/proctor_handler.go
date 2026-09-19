package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleProctorVision is a placeholder handler for proctor vision
func HandleProctorVision(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"module": "Proctor Vision initialized",
		"message": "Proctor vision placeholder",
	})
}

// LogMalpractice handles logging of proctoring violations
func LogMalpractice(c *gin.Context) {
	var payload struct {
		Time     string `json:"time"`
		Reason   string `json:"reason"`
		Severity string `json:"severity"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Here you would typically save to database
	// For now, we'll just log it to the console
	// log.Printf("Malpractice Logged: [%s] %s - %s", payload.Severity, payload.Time, payload.Reason)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Malpractice logged successfully",
	})
}
