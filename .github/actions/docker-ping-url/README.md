# Docker Ping URL Action

## Overview

This GitHub Action pings a URL repeatedly until it receives an HTTP 200 response, or until the maximum number of trials is exceeded. It's designed to verify that a service (typically running in Docker) is reachable and responding to HTTP requests before proceeding with workflow steps.

**Use Case**: Wait for a Docker container or service to be ready before running tests or other operations that depend on the service being available.

---

## Main Purpose

The action performs a simple but critical task:
1. Accepts a URL, retry delay, and maximum number of attempts as inputs
2. Makes HTTP GET requests to the URL with configurable retry logic
3. Returns success (HTTP 200) if the service responds
4. Retries with a delay between attempts
5. Fails the action if the maximum number of attempts is exceeded

**Flow**:
```
Workflow Trigger
        ↓
Ping URL with GET request
        ↓
     ┌──────────────────┐
     │ HTTP 200 OK?     │
     └────────┬─────────┘
        YES ↙  ↖ NO
           ↙    ↖
       Success  Wait & Retry
                      ↓
              Trials Remaining?
                   ↙ YES ↖ NO
                  ↙       ↖
            Retry         FAIL
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | **Yes** | - | URL to ping (must include http:// or https://) |
| `max-trials` | No | `10` | Maximum number of retry attempts |
| `delay` | No | `5` | Seconds to wait between retry attempts |

### Input Details

#### **url** (Required)
- **Type**: String (URL)
- **Example**: `http://localhost:3000`, `https://api.example.com/health`
- **Format Requirements**: Must include the protocol (http:// or https://)
- **Purpose**: The endpoint to monitor for availability
- **Notes**: 
  - Only HTTP 200 status codes are considered success
  - Other 2xx/3xx responses are treated as failures
  - Connection errors trigger retries

#### **max-trials** (Optional)
- **Type**: String (integer)
- **Default**: `10`
- **Range**: 1 or more
- **Purpose**: Maximum number of HTTP requests to attempt
- **Example**: `max-trials: '30'` for up to 30 attempts
- **Notes**: After this many failures, the action fails

#### **delay** (Optional)
- **Type**: String (integer)
- **Default**: `5`
- **Unit**: Seconds
- **Purpose**: Time to wait between retry attempts
- **Example**: `delay: '2'` for 2-second intervals
- **Notes**: 
  - Applies between all retries
  - Total wait time = (attempts - 1) × delay

---

## Functions Reference

### `ping_url(url, delay, max_trials)`

**Purpose**: Attempts to reach a URL with retry logic.

**Parameters**:
- `url` (str): The URL to ping (must include http:// or https://)
- `delay` (int): Seconds to wait between retry attempts
- `max_trials` (int): Maximum number of retry attempts

**Returns**: 
- `True` if URL returns HTTP 200
- `False` if unreachable or malformed

**Error Handling**:
- **ConnectionError**: Logged and retried up to max_trials times
- **MissingSchema** (invalid URL format): Returns False immediately
- **Other Exceptions**: Treated as connection failures and retried

**Algorithm**:
1. Loop while `trials < max_trials`
2. Attempt GET request to URL
3. Check if response status code is 200
4. If yes, return True
5. If ConnectionError, sleep for `delay` seconds and increment `trials`
6. If MissingSchema, return False immediately
7. After loop exits, return False

**Example**:
```python
result = ping_url("http://localhost:8080", delay=5, max_trials=10)
# Returns True if service responds with 200
# Returns False if service doesn't respond after 10 attempts
```

---

### `run()`

**Purpose**: Main entry point for the GitHub Action.

**Functionality**:
1. Retrieves inputs from environment variables (set by GitHub Actions)
2. Calls `ping_url()` to check service availability
3. Raises exception if service is unreachable
4. Prints success message if service is reachable

**Environment Variables** (set automatically by GitHub Actions):
- `INPUT_URL`: The URL to ping
- `INPUT_DELAY`: Delay between attempts (as string)
- `INPUT_MAX_TRIALS`: Max attempts (as string)

**Exit Behavior**:
- **Success**: Workflow continues to next step
- **Failure**: Workflow stops, and remaining steps are skipped

**Workflow**:
```
1. Get INPUT_URL, INPUT_DELAY, INPUT_MAX_TRIALS from environment
2. Convert DELAY and MAX_TRIALS to integers
3. Call ping_url(url, delay, max_trials)
4. If result is False:
      Raise Exception with error message
5. If result is True:
      Print success message
```

---

## Runtime Environment

| Property | Value |
|----------|-------|
| **Type** | Docker |
| **Image** | Custom Dockerfile |
| **Language** | Python 3 |
| **Main Entry** | main.py |
| **Requirements** | requests library |

### Docker Execution
- The action runs inside a Docker container
- Provides isolated environment and reproducible behavior
- Python dependencies managed via `requirements.txt`

---

## Dependencies

The action requires the following Python packages:
- **requests** (2.34.2): HTTP library for making GET requests
- **urllib3** (2.8.0): HTTP client library (dependency of requests)
- **certifi** (2026.10.23): SSL certificate validation
- **charset-normalizer** (3.5.2): Character encoding detection
- **idna** (3.20): International domain name support

All dependencies are pre-installed in the Docker image.

---

## Usage Examples

### Basic Usage - Wait for Local Service
```yaml
name: Run Tests
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      api:
        image: my-api:latest
        ports:
          - 3000:3000
    steps:
      - uses: ./.github/actions/docker-ping-url
        with:
          url: http://localhost:3000
      
      - name: Run tests
        run: npm test
```

**What happens**:
1. Docker Compose starts the api service
2. Ping action waits (up to 50 seconds with defaults) for the service to be ready
3. If service responds with 200, tests run
4. If service doesn't respond, workflow fails

---

### Custom Retry Configuration
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://api.example.com/health
      max-trials: '20'
      delay: '3'
```

**Parameters**:
- Attempts up to 20 times
- Waits 3 seconds between attempts
- Total maximum wait: 19 × 3 = 57 seconds
- Checks the /health endpoint specifically

---

### Quick Health Check
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:8080
      max-trials: '5'
      delay: '1'
```

**Parameters**:
- Quick check: only 5 attempts
- 1-second delay between attempts
- Total maximum wait: 4 seconds
- Good for services that start quickly

---

### HTTPS with Long Timeout
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: https://api.production.com/status
      max-trials: '30'
      delay: '10'
```

**Parameters**:
- Production endpoint (HTTPS)
- Patient retry: 30 attempts
- 10-second delay between attempts
- Total maximum wait: 290 seconds (4+ minutes)
- Useful for slow-starting services

---

## Common Scenarios

### Scenario 1: Wait for Docker Compose Services
```yaml
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      api:
        image: my-api:latest
        ports:
          - 3000:3000
    steps:
      - uses: ./.github/actions/docker-ping-url
        with:
          url: http://localhost:3000
          delay: '2'
          max-trials: '15'
      
      - run: npm test
```

---

### Scenario 2: Multiple Service Checks
```yaml
steps:
  # Wait for API service
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000
      delay: '5'
  
  # Wait for database service
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:5432
      delay: '5'
  
  # Wait for message queue
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:5672
      delay: '5'
  
  - name: Run integration tests
    run: npm test
```

---

### Scenario 3: Health Check Endpoint
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000/api/health
      delay: '3'
      max-trials: '20'
  
  - name: Run smoke tests
    run: npm run test:smoke
```

---

## Error Handling

The action handles various error scenarios:

| Error Scenario | Behavior | Recovery |
|---|---|---|
| **Connection Refused** | Logs error message | Retries after delay |
| **Invalid URL Format** | Logs URL format error | Fails immediately |
| **HTTP Non-200 Status** | Treated as failure | Retries after delay |
| **Network Timeout** | Logs timeout message | Retries after delay |
| **DNS Resolution Failure** | Logs resolution error | Retries after delay |
| **Max Trials Exceeded** | Logs failure message | Action fails |

### Error Messages

**Connection Failed (Retriable)**:
```
Website http://localhost:3000 is unreachable. Retrying in 5 seconds...
```

**Invalid URL Format (Non-Retriable)**:
```
Invalid URL format: localhost:3000. Make sure the URL has a valid schema (e.g. http:// or https://)
```

**Max Trials Exceeded**:
```
Website http://localhost:3000 is malformed or unreachable.
```

---

## Troubleshooting

### "Invalid URL format: xyz. Make sure the URL has a valid schema"

**Problem**: URL doesn't include http:// or https://

**Solution**: Ensure the URL starts with the protocol:
```yaml
# ❌ Wrong
url: localhost:3000

# ✅ Correct
url: http://localhost:3000
```

---

### "Website is malformed or unreachable" after max trials

**Problem**: Service is not responding with HTTP 200 after all retry attempts

**Solutions**:
1. **Increase delay**: Service might need more time between checks
   ```yaml
   delay: '10'  # Increase from default 5
   ```

2. **Increase max-trials**: Allow more attempts
   ```yaml
   max-trials: '30'  # Increase from default 10
   ```

3. **Check service logs**: Verify the service is actually running
   ```bash
   docker logs <container-name>
   ```

4. **Check the endpoint**: Service might not be responding on that port
   ```bash
   curl http://localhost:3000
   ```

5. **Firewall/Network**: Check if port is accessible
   ```bash
   netstat -an | grep 3000
   ```

---

### Action succeeds but service isn't ready

**Problem**: HTTP 200 returned but service logic isn't complete

**Solution**: Use a more specific health check endpoint:
```yaml
url: http://localhost:3000/api/health/ready
```

The endpoint should return 200 only when the service is fully ready, not just accepting connections.

---

## Permissions Required

This action requires:
- **Read**: Can access container logs (for debugging)
- **Network**: Can make outbound HTTP requests
- **No repo access**: Does not read or write files

---

## Technical Details

### How It Works

1. **GitHub Actions Trigger**: Workflow runs and executes this action step
2. **Docker Launch**: GitHub Actions builds and launches Docker container
3. **Environment Setup**: 
   - Python installed in container
   - Dependencies from requirements.txt installed
   - Inputs converted to INPUT_* environment variables
4. **Script Execution**: `main.py` runs the `run()` function
5. **HTTP Requests**: `requests` library makes GET requests
6. **Retry Logic**: 
   - On failure: Sleep for specified delay
   - Increment attempt counter
   - Loop back to step 5
7. **Exit Status**:
   - Success (0): HTTP 200 received, action passes
   - Failure (1): Exception raised, workflow stops

### Request Details

- **HTTP Method**: GET
- **Status Code Required**: 200 (others fail)
- **Timeout**: Default requests library timeout (~30 seconds)
- **Headers**: None (default requests headers used)
- **Body**: None (GET requests have no body)
- **Redirects**: Followed by requests library
- **SSL**: Certificates validated

---

## Performance Considerations

| Configuration | Min Wait | Max Wait | Use Case |
|---|---|---|---|
| `delay: 1, max-trials: 5` | 0s | 4s | Fast-starting services |
| `delay: 5, max-trials: 10` (default) | 0s | 45s | Typical services |
| `delay: 10, max-trials: 30` | 0s | 290s | Slow-starting services |

---

## Notes

- The action only checks if the service responds with HTTP 200
- It doesn't validate response content, only status code
- Each attempt waits for the full HTTP timeout (~30s) if no response
- Actual wait time can exceed (delay × max-trials) if network is slow
- The action is idempotent - running multiple times has same effect
- Failed requests don't affect future workflow steps (unless action fails)

---

## Contributing

To modify this action:
1. Edit `main.py` for logic changes
2. Edit `requirements.txt` if adding Python dependencies
3. Edit `Dockerfile` for environment setup changes
4. Edit `action.yaml` for input/output changes
5. Test changes locally before committing

---

## Related Actions

- `docker/setup-buildx-action`: Build Docker images
- `actions/setup-python`: Set up Python environment
- `docker/build-push-action`: Push Docker images

---

*Part of the gh-actions-course project*
