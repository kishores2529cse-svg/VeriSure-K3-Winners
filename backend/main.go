package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"verisure/handlers"
)

func main() {
	r := gin.Default()

	// Robust CORS middleware allowing any local development port (5173, 5174, 3000, etc.)
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Scam Scanner
		scams := v1.Group("/scams")
		{
			scams.POST("", handlers.HandleScamScanner)
		}

		// Proctor Vision
		proctor := v1.Group("/proctor")
		{
			proctor.POST("", handlers.HandleProctorVision)
			proctor.POST("/log", handlers.LogMalpractice)
		}
	}
	r.POST("/api/verify-upi", handlers.HandleUPIVerification)

	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
