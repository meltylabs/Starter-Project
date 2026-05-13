package main

import (
	"errors"
	"fmt"
	"strings"
)

type telemetryConfig struct {
	AppName     string
	Environment string
	PushAPIKey  string
	ServiceName string
	Endpoint    string
}

func loadTelemetryConfig(getenv func(string) string) (telemetryConfig, error) {
	cfg := telemetryConfig{
		AppName:     getOrDefault(getenv, "APPSIGNAL_APP_NAME", "diamondnode"),
		Environment: getOrDefault(getenv, "APPSIGNAL_ENVIRONMENT", "production"),
		PushAPIKey:  strings.TrimSpace(getenv("APPSIGNAL_PUSH_API_KEY")),
		ServiceName: getOrDefault(getenv, "APPSIGNAL_SERVICE_NAME", "diamondnode-host"),
		Endpoint:    getOrDefault(getenv, "APPSIGNAL_OTLP_ENDPOINT", "14g2tvpd.eu-central.appsignal-collector.net"),
	}

	if cfg.PushAPIKey == "" {
		return telemetryConfig{}, errors.New("APPSIGNAL_PUSH_API_KEY is required")
	}
	if strings.Contains(cfg.Endpoint, "://") || strings.Contains(cfg.Endpoint, "/") {
		return telemetryConfig{}, fmt.Errorf("APPSIGNAL_OTLP_ENDPOINT must be a host[:port], got %q", cfg.Endpoint)
	}

	return cfg, nil
}

func getOrDefault(getenv func(string) string, key string, fallback string) string {
	value := strings.TrimSpace(getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
