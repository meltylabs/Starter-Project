package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func initOpenTelemetry(ctx context.Context, cfg telemetryConfig) (func(context.Context) error, error) {
	hostname, err := os.Hostname()
	if err != nil || strings.TrimSpace(hostname) == "" {
		hostname = "unknown"
	}

	resource, err := sdkresource.Merge(
		sdkresource.Default(),
		sdkresource.NewSchemaless(
			attribute.String("appsignal.config.name", cfg.AppName),
			attribute.String("appsignal.config.environment", cfg.Environment),
			attribute.String("appsignal.config.push_api_key", cfg.PushAPIKey),
			attribute.String("appsignal.config.revision", gitRevision(ctx)),
			attribute.String("appsignal.config.language_integration", "go"),
			attribute.String("appsignal.config.app_path", os.Getenv("PWD")),
			attribute.String("service.name", cfg.ServiceName),
			attribute.String("host.name", hostname),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("create OTLP resource: %w", err)
	}

	traceClient := otlptracehttp.NewClient(otlptracehttp.WithEndpoint(cfg.Endpoint))
	traceExporter, err := otlptrace.New(ctx, traceClient)
	if err != nil {
		return nil, fmt.Errorf("create OTLP trace exporter: %w", err)
	}

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(resource),
	)
	otel.SetTracerProvider(tracerProvider)
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	metricExporter, err := otlpmetrichttp.New(ctx, otlpmetrichttp.WithEndpoint(cfg.Endpoint))
	if err != nil {
		return nil, fmt.Errorf("create OTLP metric exporter: %w", err)
	}
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		sdkmetric.WithResource(resource),
	)
	otel.SetMeterProvider(meterProvider)

	logExporter, err := otlploghttp.New(ctx, otlploghttp.WithEndpoint(cfg.Endpoint))
	if err != nil {
		return nil, fmt.Errorf("create OTLP log exporter: %w", err)
	}
	loggerProvider := sdklog.NewLoggerProvider(
		sdklog.WithResource(resource),
		sdklog.WithProcessor(sdklog.NewBatchProcessor(logExporter)),
	)
	global.SetLoggerProvider(loggerProvider)

	return func(ctx context.Context) error {
		var shutdownErr error
		for label, shutdown := range map[string]func(context.Context) error{
			"trace provider":  tracerProvider.Shutdown,
			"meter provider":  meterProvider.Shutdown,
			"logger provider": loggerProvider.Shutdown,
		} {
			if err := shutdown(ctx); err != nil {
				shutdownErr = errorsJoin(shutdownErr, fmt.Errorf("shutdown %s: %w", label, err))
			}
		}
		return shutdownErr
	}, nil
}

func gitRevision(ctx context.Context) string {
	cmd := exec.CommandContext(ctx, "git", "rev-parse", "--short", "HEAD")
	output, err := cmd.Output()
	if err != nil {
		return "unknown"
	}
	revision := strings.TrimSpace(string(output))
	if revision == "" {
		return "unknown"
	}
	return revision
}

func errorsJoin(left error, right error) error {
	return errors.Join(left, right)
}
