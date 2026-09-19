package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"verisure/handlers"
)

func main() {
	r := gin.Default()

	// Standard CORS middleware allowing local frontend requests
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// UPI Fraud Detection
		upi := v1.Group("/upi")
		{
			upi.POST("", handlers.HandleUPIFraudDetection)
		}

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

	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
