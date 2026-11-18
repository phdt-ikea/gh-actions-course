
"""
Docker Ping URL Action - Main Module

This module provides URL reachability checking functionality for GitHub Actions.
It attempts to reach a specified URL with configurable retry logic to verify
that a service is running and responding to HTTP requests.

Usage:
    - Called by GitHub Actions workflow
    - Retrieves URL and retry parameters from environment variables
    - Pings the URL and raises an exception if unreachable
"""

import os
import time

import requests


class WebsiteUnreachableError(Exception):
    """Raised when the target website is malformed or unreachable."""


def ping_url(url, delay, max_trials):
    """
    Attempts to reach a URL with retry logic and exponential backoff.
    
    This function makes HTTP GET requests to the specified URL and retries
    on connection failures. It respects the delay and max_trials parameters
    to control retry behavior.
    
    Args:
        url (str): The URL to ping (must include http:// or https://)
        delay (int): Seconds to wait between retry attempts
        max_trials (int): Maximum number of retry attempts
    
    Returns:
        bool: True if URL returns HTTP 200, False if unreachable or malformed
    
    Raises:
        No exceptions - returns False on error instead
    
    Error Handling:
        - ConnectionError: Retries up to max_trials times
        - MissingSchema: Returns False immediately (invalid URL format)
        - Other RequestExceptions: Treated as connection failures
    
    Example:
        >>> ping_url("http://localhost:8080", delay=2, max_trials=5)
        True  # if the service is reachable
    """
    trials = 0
    while trials < max_trials:
        try:
            # Attempt to reach the URL with GET request
            response = requests.get(url)
            # Success if we get HTTP 200 OK response
            if response.status_code == 200:
                print(f"Website {url} is reachable.")
                return True
        except requests.ConnectionError:
            # Connection failed - log and retry with delay
            print(f"Website {url} is unreachable. Retrying in {delay} seconds...")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            # URL format is invalid (missing http:// or https://)
            print(f"Invalid URL format: {url}. Make sure the URL has a valid schema (e.g. http:// or https://)")
            return False
        
    # All retry attempts exhausted - service is unreachable
    return False

def run():
    """
    Main action entry point - orchestrates URL reachability checking.
    
    This function is called when the action runs. It:
    1. Retrieves input parameters from GitHub Actions environment variables
    2. Calls ping_url() to check if the service is running
    3. Raises an exception if the service is unreachable
    
    Environment Variables (from action.yaml inputs):
        INPUT_URL (str): The URL to ping (required)
            Format: http://localhost:8080 or https://example.com
        INPUT_DELAY (str): Seconds between retry attempts (required)
            Will be converted to int
        INPUT_MAX_TRIALS (str): Maximum number of retry attempts (required)
            Will be converted to int
    
    Raises:
        WebsiteUnreachableError: If the website is malformed or unreachable
                     after all retries
    
    Exit Behavior:
        - Success (0): Website is reachable, all checks pass
        - Failure (1): Website is unreachable, exception is raised
    
    Example Usage in GitHub Actions:
        steps:
          - uses: ./.github/actions/docker-ping-url
            with:
              url: http://localhost:3000
              delay: 5
              max_trials: 10
    """
    # Retrieve input parameters from GitHub Actions environment variables
    # Format: INPUT_<input_name> (defined in action.yaml)
    website_url = os.getenv("INPUT_URL")
    delay = os.getenv("INPUT_DELAY")
    max_trials = os.getenv("INPUT_MAX_TRIALS")

    if delay is None or max_trials is None:
        raise WebsiteUnreachableError("INPUT_DELAY and INPUT_MAX_TRIALS are required.")

    # Attempt to reach the website with retry logic
    website_reachable = ping_url(website_url, int(delay), int(max_trials))

    # Fail the action if website is not reachable
    if not website_reachable:
        raise WebsiteUnreachableError(
            f"Website {website_url} is malformed or unreachable."
        )

    # Success message
    print(f"Website {website_url} is reachable.")

if __name__ == "__main__":
    # Execute the action when this script is run directly
    # This is the entry point for GitHub Actions
    run()
