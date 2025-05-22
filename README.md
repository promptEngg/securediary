# OWASP ZAP Scanner Service

This service provides a REST API interface to OWASP ZAP (Zed Attack Proxy) for automated security scanning of web applications.

## Prerequisites

1. Install OWASP ZAP:
   - Download from: https://www.zaproxy.org/download/
   - Install and run ZAP
   - Note down the API key from ZAP's Options -> API

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. Update the `ZAP_API_KEY` in `zap_scanner.py` with your ZAP API key
2. Ensure ZAP is running and accessible at `http://localhost:8080`

## Running the Service

1. Start the Flask server:
   ```bash
   python zap_scanner.py
   ```

2. The service will be available at `http://localhost:5000`

## API Endpoints

### 1. Check ZAP Status
- **GET** `/status`
- Returns the current status of the ZAP service

### 2. Start Scan
- **POST** `/scan`
- Request body:
  ```json
  {
    "url": "http://example.com"
  }
  ```
- Returns scan results including:
  - Vulnerability severity
  - Title
  - Description
  - Location
  - Solution
  - Evidence

## Security Considerations

1. This service should only be run in a controlled environment
2. Keep your ZAP API key secure
3. Only scan applications you have permission to test
4. Consider rate limiting and authentication for production use

## Error Handling

The service includes error handling for:
- ZAP service unavailability
- Invalid URLs
- Scan failures
- API errors

## Contributing

Feel free to submit issues and enhancement requests. 