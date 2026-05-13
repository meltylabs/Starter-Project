package main

import (
	"context"
	"log"
	"os"
	"time"
)

func main() {
	cfg, err := loadTelemetryConfig(os.Getenv)
	if err != nil {
		log.Fatalf("invalid telemetry configuration: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cleanup, err := initOpenTelemetry(ctx, cfg)
	if err != nil {
		log.Fatalf("initialize telemetry: %v", err)
	}
	defer func() {
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		if err := cleanup(shutdownCtx); err != nil {
			log.Printf("telemetry shutdown warning: %v", err)
		}
	}()

	log.Printf("%s telemetry initialized for %s", cfg.ServiceName, cfg.Environment)
}
