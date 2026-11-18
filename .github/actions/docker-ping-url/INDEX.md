# Docker Ping URL Action - Documentation Index

Welcome! This directory contains a GitHub Action that pings a URL with retry logic to verify a service is running.

---

## 🚀 Quick Start (30 seconds)

```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000
```

**That's it!** The action will:
1. Make an HTTP GET request to the URL
2. Retry up to 10 times (default) if it fails
3. Wait 5 seconds (default) between retries
4. Fail if the service doesn't respond with HTTP 200

---

## 📚 Documentation Files

### For Everyone
- **[README.md](./README.md)** - Complete user guide
  - What the action does and why
  - All input parameters explained
  - Usage examples for common scenarios
  - Troubleshooting guide
  - Performance considerations

### For Technical Details
- **[ACTION_YAML_ANALYSIS.md](./ACTION_YAML_ANALYSIS.md)** - Configuration analysis
  - How the action is configured
  - Input parameter details
  - Variable mapping (input → environment variable)
  - Enhancement opportunities
  - Security considerations

### Code
- **[main.py](./main.py)** - Source code with detailed comments
  - Module documentation
  - Function-level documentation
  - Inline logic explanations
  - Error handling documented

---

## 📖 Choose Your Path

### "I just want to use it"
1. Read: README.md → Overview section
2. Copy: README.md → Usage Examples (Basic Usage)
3. Adapt: Adjust url, max-trials, and delay for your use case

### "I need to configure it for my project"
1. Read: README.md → Inputs section
2. Review: README.md → Usage Examples
3. Pick: The scenario that matches your needs

### "I'm troubleshooting an issue"
1. Go to: README.md → Troubleshooting section
2. Find: Your exact error message
3. Follow: The suggested solution

### "I want to understand the technical details"
1. Read: ACTION_YAML_ANALYSIS.md → File Overview
2. Deep dive: ACTION_YAML_ANALYSIS.md → Detailed Structure
3. Reference: main.py with inline comments

---

## 🎯 By Use Case

### **Waiting for Docker Service to Start**
```yaml
services:
  api:
    image: my-api:latest
    ports:
      - 3000:3000
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000
  - run: npm test
```
→ See: [README.md - Scenario 1](./README.md#scenario-1-wait-for-docker-compose-services)

### **Multiple Services**
Check API, Database, and Message Queue availability in sequence.
→ See: [README.md - Scenario 2](./README.md#scenario-2-multiple-service-checks)

### **Health Check Endpoint**
Ping a specific health check endpoint.
→ See: [README.md - Scenario 3](./README.md#scenario-3-health-check-endpoint)

### **Custom Retry Configuration**
```yaml
max-trials: '20'
delay: '3'
```
Adjust retry attempts and delay for your service's startup time.

---

## 📋 Input Parameters at a Glance

| Parameter | Required | Default | Purpose |
|-----------|----------|---------|---------|
| `url` | ✅ Yes | - | URL to ping (http:// or https://) |
| `max-trials` | No | `10` | Maximum number of attempts |
| `delay` | No | `5` | Seconds between retry attempts |

**Quick Examples**:
- `url: http://localhost:3000` - Local service on port 3000
- `url: https://api.example.com/health` - Production health endpoint
- `max-trials: '30'` - Very patient (up to 29×delay seconds wait)
- `delay: '1'` - Fast-starting service

→ Full details: [README.md - Inputs](./README.md#inputs)

---

## ⚙️ Runtime Info

- **Type**: Docker container execution
- **Language**: Python 3
- **Main File**: main.py
- **Dependencies**: requests library
- **Configuration**: action.yaml

---

## 🔄 How It Works (Flow)

```
Workflow Step Triggered
         ↓
GitHub Actions runs action
         ↓
Docker container built/launched
         ↓
main.py executes run() function
         ↓
ping_url() attempts HTTP GET
         ↓
      ┌────────────────┐
      │ HTTP 200 OK?   │
      └────────┬───────┘
        YES ↙  ↖ NO
           ↙    ↖
        SUCCESS  Try Again?
                   ↙ YES ↖ NO
                  ↙       ↖
            WAIT & RETRY  FAIL WORKFLOW
                (loop)
```

→ Detailed: [README.md - Main Purpose](./README.md#main-purpose)

---

## 🔍 Common Questions

**Q: What if the service is already running?**
A: It returns HTTP 200 immediately on the first attempt. Done!

**Q: Why does it only accept HTTP 200?**
A: 200 means "fully successful". Other codes indicate the service isn't ready.

**Q: How long will it wait total?**
A: (max-trials - 1) × delay seconds. Example: 10 trials × 5 seconds = 45 seconds max.

**Q: Can I use this with HTTPS?**
A: Yes! Use `https://` instead of `http://`. Certificates are validated.

**Q: What if my service doesn't have an HTTP endpoint?**
A: This action only works for HTTP/HTTPS services. Consider adding a health check endpoint.

**Q: Can I check multiple services?**
A: Yes! Add multiple steps with different URLs.

→ More Q&A: [README.md - Common Scenarios](./README.md#common-scenarios)

---

## 📊 Timing Examples

| Config | Attempts | Total Wait | Use Case |
|--------|----------|-----------|----------|
| `delay: 1, max-trials: 5` | 5 | 4s | Very fast services |
| `delay: 2, max-trials: 10` | 10 | 18s | Fast services |
| `delay: 5, max-trials: 10` (default) | 10 | 45s | Typical services |
| `delay: 10, max-trials: 30` | 30 | 290s | Slow services |

---

## 🚨 Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid URL format: xyz" | Missing http:// or https:// | Add protocol to URL |
| "Website is unreachable" | Service not responding | Check service logs, increase delays/trials |
| "Connection refused" | Nothing listening on port | Verify port number |
| "Network timeout" | Service too slow to respond | Increase delay or max-trials |

→ Full troubleshooting: [README.md - Troubleshooting](./README.md#troubleshooting)

---

## 💡 Tips & Best Practices

1. **Test First**: Use `max-trials: '5'` to test quickly before increasing
2. **Health Endpoints**: Create a `/health` endpoint that returns 200 when ready
3. **Monitor Logs**: Check container logs if action fails
4. **Reasonable Defaults**: 5-second delay and 10 attempts work for most services
5. **Specific URLs**: Point to actual endpoints, not just the port
   ```yaml
   # Good: Points to specific endpoint
   url: http://localhost:3000/api/health
   
   # Also works but less specific
   url: http://localhost:3000
   ```

---

## 📁 Directory Structure

```
docker-ping-url/
├── INDEX.md ← You are here
├── README.md ← User guide
├── ACTION_YAML_ANALYSIS.md ← Technical details
├── main.py ← Commented source code
├── action.yaml ← Action configuration
├── Dockerfile ← Docker image definition
├── requirements.txt ← Python dependencies
└── venv/ ← Virtual environment
```

---

## 🎓 Learning Path

**Beginner** (5 min):
1. This page (INDEX.md)
2. README.md → Overview
3. Copy basic example

**Intermediate** (15 min):
1. README.md → Inputs section
2. README.md → Usage Examples
3. Customize for your service

**Advanced** (30 min):
1. ACTION_YAML_ANALYSIS.md
2. main.py comments
3. Enhancement ideas

---

## ✅ What This Action Does

- ✅ Makes HTTP GET requests
- ✅ Checks for HTTP 200 status
- ✅ Retries on connection failure
- ✅ Configurable delays and retry count
- ✅ Runs in isolated Docker container
- ✅ Works with local and remote URLs

## ❌ What This Action Doesn't Do

- ❌ Check response body content
- ❌ Support HTTP methods other than GET
- ❌ Validate HTTPS certificates (can be added)
- ❌ Send authentication headers (can be added)
- ❌ Check response time/performance

---

## 🔧 Docker Container Details

The action runs inside a Docker container that:
- Uses Python 3.11 lightweight base image
- Installs requests library for HTTP
- Copies and runs main.py
- Receives inputs via environment variables
- Exits with status 0 (success) or 1 (failure)

---

## 📝 Function Overview

**ping_url(url, delay, max_trials)**
- Makes HTTP GET request to URL
- Retries on connection failure
- Returns True if HTTP 200 received
- Returns False if URL is malformed or max trials exceeded

**run()**
- Retrieves inputs from environment variables
- Calls ping_url()
- Raises exception if service unreachable
- Prints success message if reachable

→ Full documentation: [main.py](./main.py)

---

## 🚀 Next Steps

1. **Copy Example**: Get a basic workflow from README.md
2. **Customize**: Adjust url, max-trials, delay for your service
3. **Test**: Run workflow manually
4. **Monitor**: Check the action logs
5. **Automate**: Add to your regular CI/CD flow

---

## ❓ Still Have Questions?

- Check **README.md** for general questions and examples
- Read **ACTION_YAML_ANALYSIS.md** for configuration details
- Review **main.py** comments for implementation details

---

## 📅 Last Updated
November 18, 2024

---

**Ready?** → Start with [README.md](./README.md)

*Part of the gh-actions-course project*
