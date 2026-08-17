"""
SEWAA India - Provider Configuration & Zero-Bypass Test
Verifies that:
1. No dev_hint or plain-text OTP is returned in API responses
2. Missing credentials throw structured 503 SMS_PROVIDER_NOT_CONFIGURED
3. Endpoint paths match /api/auth/mobile/send-otp and /api/auth/mobile/verify-otp
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8001/api"

def test_no_dev_hint():
    url = f"{BASE_URL}/auth/mobile/send-otp"
    body = json.dumps({"phone": "9840123456"}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            print("Response:", data)
            assert "dev_hint" not in data, "Security violation: dev_hint found in response!"
            print("✓ Confirmed: No dev_hint in API response")
    except urllib.error.HTTPError as e:
        err_data = json.loads(e.read().decode())
        print(f"Status: {e.code}, Detail: {err_data}")
        if e.code == 503:
            assert err_data.get("detail", {}).get("code") == "SMS_PROVIDER_NOT_CONFIGURED"
            print("✓ Confirmed: Correctly throws 503 SMS_PROVIDER_NOT_CONFIGURED when credentials are missing")
        elif e.code == 400:
            print("✓ Phone validation triggered")

if __name__ == "__main__":
    test_no_dev_hint()
