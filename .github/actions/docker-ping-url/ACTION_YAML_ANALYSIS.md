# action.yaml Analysis - Docker Ping URL Action

## File Overview

The `action.yaml` file defines the GitHub Actions metadata for the Docker Ping URL action. It declares the action's name, description, inputs, and runtime configuration.

---

## Complete action.yaml Content

```yaml
name: Ping URL
description: Ping URL until maximum trials have exceeded. If result is not 200 until then, fails the action.

inputs:
  url: # INPUT_URL
    description: URL to ping
    required: true
  max-trials: # INPUT_MAX_TRIALS
    description: Maximum number of trials until action fails.
    default: '10'
    required: false
  delay: # INPUT_DELAY
    description: Delay in seconds between trials.
    default: '5'
    required: false

runs:
  using: docker
  image: Dockerfile
```

---

## Detailed Structure Analysis

### 1. **Name and Description**

```yaml
name: Ping URL
description: Ping URL until maximum trials have exceeded. If result is not 200 until then, fails the action.
```

**Analysis**:
- **name**: Short identifier displayed in GitHub Actions UI
- **description**: Concise explanation of action functionality
- **Purpose**: Helps users understand the action's purpose at a glance

---

### 2. **Inputs Definition**

The action declares 3 input parameters, 1 required and 2 optional.

#### **Input: url**

```yaml
url: # INPUT_URL
  description: URL to ping
  required: true
```

**Details**:
- **Key**: `url` - Used in workflow as `url: http://localhost:3000`
- **Environment Variable**: `INPUT_URL` (GitHub Actions converts input names)
- **description**: Brief explanation of what the input does
- **required**: `true` - **MUST** be provided by workflow
- **Type**: String (implicitly)
- **Format Requirements**: Must include http:// or https://
- **Example Values**:
  - `http://localhost:3000`
  - `https://api.example.com/health`
  - `http://192.168.1.100:8080`

**Purpose**: 
- Specifies the endpoint to monitor
- Determines what service availability is verified
- Used directly in HTTP GET requests

---

#### **Input: max-trials**

```yaml
max-trials: # INPUT_MAX_TRIALS
  description: Maximum number of trials until action fails.
  default: '10'
  required: false
```

**Details**:
- **Key**: `max-trials` - Used in workflow as `max-trials: '20'`
- **Environment Variable**: `INPUT_MAX_TRIALS`
- **description**: Explains the retry attempt limit
- **default**: `'10'` - Used if workflow doesn't specify this input
- **required**: `false` - Optional parameter
- **Type**: String (must be converted to int in code)
- **Valid Range**: 1 or higher
- **Example Values**: `'5'`, `'10'`, `'30'`, `'100'`

**Purpose**: 
- Controls how many HTTP requests to attempt
- Higher values = more patient wait for service startup
- Lower values = quicker failure detection
- With delay, determines total maximum wait time

**Calculation Example**:
- `max-trials: '10'` and `delay: '5'`
- Maximum wait = (10 - 1) × 5 = 45 seconds
- Total attempts = 10

---

#### **Input: delay**

```yaml
delay: # INPUT_DELAY
  description: Delay in seconds between trials.
  default: '5'
  required: false
```

**Details**:
- **Key**: `delay` - Used in workflow as `delay: '2'`
- **Environment Variable**: `INPUT_DELAY`
- **description**: Explains the retry delay
- **default**: `'5'` - 5 seconds between attempts if not specified
- **required**: `false` - Optional parameter
- **Type**: String (must be converted to int in code)
- **Unit**: Seconds
- **Valid Range**: 1 or higher (typically 1-30)
- **Example Values**: `'1'`, `'2'`, `'5'`, `'10'`

**Purpose**: 
- Controls wait time between retry attempts
- Gives service time to become available
- Lower values for fast-starting services
- Higher values for slow-starting services

**Delay Strategy**:
- First attempt: Immediate (no delay before first try)
- Subsequent attempts: Wait `delay` seconds before retry
- Example: With delay=5, max-trials=3
  - Attempt 1: Time 0s
  - Wait 5s
  - Attempt 2: Time 5s
  - Wait 5s
  - Attempt 3: Time 10s
  - Total elapsed: ~10 seconds

---

### 3. **Runs Configuration**

```yaml
runs:
  using: docker
  image: Dockerfile
```

**Analysis**:

#### **using: docker**
- **Execution Type**: Docker container execution
- **Implication**: Action runs inside an isolated Docker container
- **Benefits**:
  - Reproducible environment across runs
  - No dependency conflicts with runner environment
  - Self-contained with all requirements
  - Portable across different GitHub Actions runners

#### **image: Dockerfile**
- **Docker Image Source**: Builds from local Dockerfile
- **Path**: `.github/actions/docker-ping-url/Dockerfile`
- **Build Timing**: Built fresh when action runs (or cached)
- **Alternative**: Could reference pre-built image like `docker://python:3.11`
- **Content**: 
  - Base: Python 3 image
  - Dependencies: requests library from requirements.txt
  - Entry Point: Runs main.py

---

## Input Variable Mapping

GitHub Actions automatically creates environment variables from inputs:

| Workflow Input | Environment Variable | Type | Example |
|---|---|---|---|
| `url` | `INPUT_URL` | string | `http://localhost:3000` |
| `max-trials` | `INPUT_MAX_TRIALS` | string | `'10'` |
| `delay` | `INPUT_DELAY` | string | `'5'` |

**Note**: All environment variables are strings; main.py converts max-trials and delay to integers.

---

## Example Workflow Configurations

### Minimal Configuration (Using All Defaults)
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000
```

**Result**:
- max-trials = `10` (default)
- delay = `5` (default)
- Maximum wait: ~45 seconds
- Total attempts: 10

---

### Full Custom Configuration
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:3000
      max-trials: '20'
      delay: '3'
```

**Result**:
- All parameters explicitly specified
- Maximum wait: ~57 seconds
- Total attempts: 20
- 3-second intervals

---

### Quick Service Check
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: http://localhost:8080
      max-trials: '5'
      delay: '1'
```

**Result**:
- Quick verification: only 5 attempts
- Maximum wait: ~4 seconds
- Good for already-running services

---

### Production HTTPS with Long Timeout
```yaml
steps:
  - uses: ./.github/actions/docker-ping-url
    with:
      url: https://api.production.com/health
      max-trials: '30'
      delay: '10'
```

**Result**:
- Production endpoint (HTTPS)
- Maximum wait: ~290 seconds (4+ minutes)
- Total attempts: 30
- Good for slow-starting services

---

## Validation Behavior

### Input Validation in action.yaml

| Input | Required | Validation | Failure Behavior |
|---|---|---|---|
| `url` | Yes | None in YAML | Error if missing |
| `max-trials` | No | None in YAML | Uses default '10' |
| `delay` | No | None in YAML | Uses default '5' |

**Note**: 
- action.yaml doesn't specify regex or type validation
- Actual validation happens in main.py:
  - URL schema check (must have http:// or https://)
  - Type conversion (string to int for max-trials and delay)
  - Value range checks could be added

---

## Security Considerations

### 1. **URL Input**
- No restrictions on URL destination
- Can access any HTTP/HTTPS endpoint
- Useful for internal networks and public endpoints

### 2. **No Secrets in Inputs**
- Inputs are logged in action output
- Do NOT pass passwords or tokens in `url`
- Use authentication headers if needed (requires code change)

### 3. **Network Access**
- Action requires outbound HTTP/HTTPS network access
- May be restricted in some GitHub Actions environments

### 4. **Docker Container Security**
- Runs in isolated container environment
- Cannot access runner's file system (unless mounted)
- No access to other actions or secrets

---

## Comparison with JavaScript Action

| Feature | Docker Action (Ping URL) | Node.js Action (JS Dependency) |
|---|---|---|
| Runtime | Docker container | Node 20 |
| Startup Time | Slower (container build) | Faster |
| Isolation | Complete | Partial |
| Dependencies | requirements.txt | package.json |
| Input Mapping | INPUT_* env vars | @actions/core |
| Error Handling | Exceptions | core.setFailed() |

---

## Enhancement Opportunities

### 1. Add Status Code Input
```yaml
inputs:
  expected-status:
    description: Expected HTTP status code
    default: '200'
    required: false
```

**Benefit**: Allow checking for 201, 202, etc.

---

### 2. Add Header Support
```yaml
inputs:
  headers:
    description: JSON object of headers to send
    default: '{}'
    required: false
```

**Benefit**: Support authenticated endpoints

---

### 3. Add Output Variables
```yaml
outputs:
  response-time:
    description: Time taken to get first successful response
  attempts:
    description: Number of attempts needed
```

**Benefit**: Allow downstream steps to use this information

---

### 4. Add Timeout Input
```yaml
inputs:
  timeout:
    description: Timeout in seconds for each HTTP request
    default: '30'
    required: false
```

**Benefit**: Control per-request timeout

---

### 5. Add Response Body Check
```yaml
inputs:
  expected-body:
    description: Text that must appear in response body
    default: ''
    required: false
```

**Benefit**: Verify not just availability but correct response

---

## File Metadata

| Property | Value |
|----------|-------|
| Location | `.github/actions/docker-ping-url/action.yaml` |
| Format | YAML |
| GitHub Standard | GitHub Actions action metadata v2 |
| Docker Runtime | Yes |
| Python Version | 3.x (from base image) |

---

## Related Configuration Files

### Dockerfile
```dockerfile
# Runs Python code in isolated container
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
ENTRYPOINT ["python", "/main.py"]
```

### requirements.txt
```
requests==2.34.2
# Other HTTP library dependencies
```

### main.py
```python
# Executed inside the Docker container
# Uses INPUT_URL, INPUT_DELAY, INPUT_MAX_TRIALS env vars
def run():
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))
    # ... rest of logic
```

---

## Summary

The `action.yaml` configuration:
- ✅ Defines clear input parameters with sensible defaults
- ✅ Specifies Docker-based execution for environment consistency
- ✅ Requires only the essential `url` input
- ✅ Provides optional `max-trials` and `delay` for flexibility
- ⚠️ Could benefit from outputs and additional validation
- ⚠️ No support for authentication headers or custom status codes

The action is minimal but effective, with room for enhancement as requirements grow.

---

*Part of the gh-actions-course project*
