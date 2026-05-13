# Diamondnode Host

This module contains the sanitized Go OpenTelemetry/AppSignal bootstrap for the Diamondnode host.

Hosted collector metadata:

- Collector ID: `6a02d08ad17de241ed858e18`
- Subdomain: `14g2tvpd`
- Status: `provisioned`
- Collector URL: `https://14g2tvpd.eu-central.appsignal-collector.net`

Required runtime configuration:

```sh
export APPSIGNAL_PUSH_API_KEY="..."
export LANGSMITH_API_KEY="..."
export OPENAI_API_KEY="..."
```

Optional runtime configuration:

```sh
export APPSIGNAL_APP_NAME="diamondnode"
export APPSIGNAL_ENVIRONMENT="production"
export APPSIGNAL_SERVICE_NAME="diamondnode-host"
export APPSIGNAL_OTLP_ENDPOINT="14g2tvpd.eu-central.appsignal-collector.net"
export LANGSMITH_TRACING="true"
export LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
export LANGSMITH_PROJECT="diamondnode"
```

Run locally:

```sh
go test ./...
APPSIGNAL_PUSH_API_KEY="$APPSIGNAL_PUSH_API_KEY" \
LANGSMITH_API_KEY="$LANGSMITH_API_KEY" \
OPENAI_API_KEY="$OPENAI_API_KEY" \
go run .
```

Inspect MCP endpoints:

```sh
npm run inspect:mcp
```

MCPJam Inspector opens at `http://127.0.0.1:6274`. In the UI, select HTTP/S for a remote MCP endpoint or STDIO for a local server command. Pass secrets through the shell environment instead of embedding them in saved inspector commands.

Do not commit AppSignal, LangSmith, OpenAI, or other credentials. Put them in the host environment or a secret manager reference.
