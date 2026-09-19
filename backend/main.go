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
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
			"http://localhost:5176",
			"http://localhost:5177",
			"http://localhost:5178",
			"http://localhost:5179",
			"http://localhost:5180",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

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
		}
	}
	r.POST("/api/verify-upi", handlers.HandleUPIVerification)

	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
