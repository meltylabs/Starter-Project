package main

import (
	"strings"
	"testing"
)

func TestLoadTelemetryConfigRequiresPushAPIKey(t *testing.T) {
	_, err := loadTelemetryConfig(func(string) string { return "" })
	if err == nil {
		t.Fatal("expected missing push API key error")
	}
	if !strings.Contains(err.Error(), "APPSIGNAL_PUSH_API_KEY") {
		t.Fatalf("expected APPSIGNAL_PUSH_API_KEY in error, got %q", err.Error())
	}
}

func TestLoadTelemetryConfigDefaultsAndTrimsValues(t *testing.T) {
	cfg, err := loadTelemetryConfig(func(key string) string {
		values := map[string]string{
			"APPSIGNAL_PUSH_API_KEY": " test-key ",
			"APPSIGNAL_ENVIRONMENT":  " staging ",
		}
		return values[key]
	})
	if err != nil {
		t.Fatalf("expected config to load: %v", err)
	}

	if cfg.AppName != "diamondnode" {
		t.Fatalf("unexpected app name %q", cfg.AppName)
	}
	if cfg.Environment != "staging" {
		t.Fatalf("unexpected environment %q", cfg.Environment)
	}
	if cfg.PushAPIKey != "test-key" {
		t.Fatalf("unexpected push API key %q", cfg.PushAPIKey)
	}
	if cfg.ServiceName != "diamondnode-host" {
		t.Fatalf("unexpected service name %q", cfg.ServiceName)
	}
	if cfg.Endpoint != "14g2tvpd.eu-central.appsignal-collector.net" {
		t.Fatalf("unexpected endpoint %q", cfg.Endpoint)
	}
}

func TestLoadTelemetryConfigRejectsEndpointURL(t *testing.T) {
	_, err := loadTelemetryConfig(func(key string) string {
		values := map[string]string{
			"APPSIGNAL_PUSH_API_KEY":  "test-key",
			"APPSIGNAL_OTLP_ENDPOINT": "https://collector.example.com/v1",
		}
		return values[key]
	})
	if err == nil {
		t.Fatal("expected endpoint validation error")
	}
	if !strings.Contains(err.Error(), "host[:port]") {
		t.Fatalf("unexpected endpoint error %q", err.Error())
	}
}
