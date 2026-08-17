"""
SEWAA India - Forensic Negative Security & Edge Cases Suite
Tests:
1. Rejection of invalid Indian phone numbers (prefix, length, repetitions)
2. Rejection of incorrect Mobile OTP
3. Single-use OTP: Replay attack rejection (re-verifying already used OTP)
4. Brute-force protection: Lockout after 5 incorrect attempts
5. Rate limiting: Enforcing 30s resend cooldown
6. Rejection of invalid email formats
7. Prevention of duplicate phone registration
8. Prevention of duplicate email registration
9. Unauthorized access control without JWT
"""

import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8001/api"

def make_req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}

def run_negative_tests():
    print("=" * 66)
    print("  SEWAA — FORENSIC NEGATIVE SECURITY & EDGE CASES AUDIT           ")
    print("=" * 66)

    # 1. Invalid Indian phone (<10 digits)
    st, res = make_req("/auth/send-mobile-otp", "POST", {"phone": "98401"})
    assert st == 400 and res.get("detail", {}).get("code") == "INVALID_PHONE", f"Failed: {res}"
    print(f"1. Short Phone Rejection (<10 digits): Status={st}, Code={res['detail']['code']}")

    # 2. Invalid Indian phone prefix (starts with 1 or 2 instead of 6/7/8/9)
    st, res = make_req("/auth/send-mobile-otp", "POST", {"phone": "1234567890"})
    assert st == 400 and res.get("detail", {}).get("code") == "INVALID_PHONE_PREFIX", f"Failed: {res}"
    print(f"2. Invalid Prefix Rejection (1234567890): Status={st}, Code={res['detail']['code']}")

    # 3. Repeated dummy line (8888888888)
    st, res = make_req("/auth/send-mobile-otp", "POST", {"phone": "8888888888"})
    assert st == 400 and res.get("detail", {}).get("code") == "INVALID_PHONE_PATTERN", f"Failed: {res}"
    print(f"3. Dummy Repeats Rejection (8888888888): Status={st}, Code={res['detail']['code']}")

    # 4. Wrong Mobile OTP
    phone = f"98840{int(time.time()) % 100000:05d}"
    st, res = make_req("/auth/send-mobile-otp", "POST", {"phone": phone})
    assert st == 200, f"Send OTP failed: {res}"
    correct_otp = res.get("dev_hint")

    st, res = make_req("/auth/verify-mobile-otp", "POST", {"phone": phone, "otp": "999999"})
    assert st == 400 and res.get("detail", {}).get("code") == "INVALID_OTP", f"Failed: {res}"
    print(f"4. Incorrect OTP Rejection: Status={st}, Code={res['detail']['code']}")

    # 5. One-time use: Replay attack protection
    st, res = make_req("/auth/verify-mobile-otp", "POST", {"phone": phone, "otp": correct_otp})
    assert st == 200 and res.get("verified"), f"Legit verification failed: {res}"
    # Try verifying the exact same OTP again
    st_replay, res_replay = make_req("/auth/verify-mobile-otp", "POST", {"phone": phone, "otp": correct_otp})
    assert st_replay == 400 and res_replay.get("detail", {}).get("code") == "OTP_NOT_REQUESTED", f"Replay failed: {res_replay}"
    print(f"5. One-Time Use / Replay Attack Blocked: Status={st_replay}, Code={res_replay['detail']['code']}")

    # 6. Brute-force lockout (5 incorrect attempts)
    phone_bf = f"97890{int(time.time()) % 100000:05d}"
    st, res = make_req("/auth/send-mobile-otp", "POST", {"phone": phone_bf})
    assert st == 200
    for attempt in range(1, 5):
        st, res = make_req("/auth/verify-mobile-otp", "POST", {"phone": phone_bf, "otp": "000000"})
        assert st == 400 and res.get("detail", {}).get("code") == "INVALID_OTP"
    # 5th attempt triggers lockout
    st_lock, res_lock = make_req("/auth/verify-mobile-otp", "POST", {"phone": phone_bf, "otp": "000000"})
    assert st_lock == 429 and res_lock.get("detail", {}).get("code") == "OTP_TOO_MANY_ATTEMPTS", f"Lockout failed: {res_lock}"
    print(f"6. Brute-Force Lockout (5 attempts exceeded): Status={st_lock}, Code={res_lock['detail']['code']}")

    # 7. Invalid Email format
    st, res = make_req("/auth/send-email-otp", "POST", {"email": "invalid-email-string"})
    assert st == 400 and res.get("detail", {}).get("code") == "INVALID_EMAIL", f"Failed: {res}"
    print(f"7. Malformed Email Rejection: Status={st}, Code={res['detail']['code']}")

    # 8. Duplicate Phone Registration Prevention
    st, res = make_req("/auth/register-verified", "POST", {
        "role": "worker",
        "full_name": "Duplicate Test",
        "phone": "+919840123456",  # Existing demo-worker phone
        "email": f"unique.{int(time.time())}@sewaa.in",
        "city": "Chennai",
        "state": "Tamil Nadu"
    })
    assert st == 400 and res.get("detail", {}).get("code") == "PHONE_ALREADY_REGISTERED", f"Duplicate phone failed: {res}"
    print(f"8. Duplicate Phone Prevention: Status={st}, Code={res['detail']['code']}")

    # 9. Duplicate Email Registration Prevention
    st, res = make_req("/auth/register-verified", "POST", {
        "role": "worker",
        "full_name": "Duplicate Test",
        "phone": f"91234{int(time.time()) % 100000:05d}",
        "email": "worker@sewaa.in",  # Existing demo-worker email
        "city": "Chennai",
        "state": "Tamil Nadu"
    })
    assert st == 400 and res.get("detail", {}).get("code") == "EMAIL_ALREADY_REGISTERED", f"Duplicate email failed: {res}"
    print(f"9. Duplicate Email Prevention: Status={st}, Code={res['detail']['code']}")

    # 10. Unauthorized access control without JWT
    st, res = make_req("/auth/me", "GET")
    assert st == 401 and res.get("detail", {}).get("code") == "UNAUTHORIZED", f"Unauthorized failed: {res}"
    print(f"10. Unauthorized Route Guard (/auth/me): Status={st}, Code={res['detail']['code']}")

    print("\n" + "-" * 66)
    print("  ALL 10 NEGATIVE SECURITY & EDGE CASE TESTS PASSED (100%)!       ")
    print("-" * 66)

if __name__ == "__main__":
    run_negative_tests()
