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
