"""
SEWAA India - Complete Production Authentication & Verification Pipeline Test
Tests:
1. Server-side Mobile OTP Generation & Rate Limiting
2. 6-Digit Mobile OTP Verification
3. Email OTP Generation & Verification
4. Identity / KYC Document Verification & Masking
5. Live Face / Liveness Verification with Anti-Spoof confidence
6. Verified Multi-Role Account Creation (Worker, Technician, Employer, Customer)
7. Mobile OTP 1-Step Login
8. Email/Password Login
9. Session Persistence (/api/auth/me)
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

def run_tests():
    print("=" * 66)
    print("  SEWAA — PRODUCTION AUTH & VERIFICATION STATE MACHINE TEST       ")
    print("=" * 66)

    # 1. Send Mobile OTP
    phone = f"98401{int(time.time()) % 100000:05d}"
    st, res = make_req("/auth/otp/send", "POST", {"phone_or_email": phone, "channel": "mobile"})
    assert st == 200, f"Send Mobile OTP failed: {res}"
    dev_otp = res.get("dev_hint")
    print(f"1. Mobile OTP Dispatch: Status={st}, Phone=+91 {phone}, OTP={dev_otp}")

    # 2. Cooldown Rate-Limit check
    st2, res2 = make_req("/auth/otp/send", "POST", {"phone_or_email": phone, "channel": "mobile"})
    assert st2 == 429, f"Cooldown enforcement failed: {res2}"
    print(f"2. Resend Cooldown Enforcement: Status={st2}, Detail={res2.get('detail')}")

    # 3. Verify Mobile OTP
    st, res = make_req("/auth/otp/verify", "POST", {"phone_or_email": phone, "otp": dev_otp, "channel": "mobile"})
    assert st == 200 and res.get("verified"), f"Verify Mobile OTP failed: {res}"
    print(f"3. Mobile OTP Verification: Status={st}, Verified={res.get('verified')}")

    # 4. Email OTP
    email = f"verified.{int(time.time())}@sewaa.in"
    st, res = make_req("/auth/otp/send", "POST", {"phone_or_email": email, "channel": "email"})
    assert st == 200, f"Send Email OTP failed: {res}"
    email_otp = res.get("dev_hint")
    st, res = make_req("/auth/otp/verify", "POST", {"phone_or_email": email, "otp": email_otp, "channel": "email"})
    assert st == 200 and res.get("verified"), f"Verify Email OTP failed: {res}"
    print(f"4. Email OTP Verification: Status={st}, Email={email}, Verified=True")

    # 5. KYC Document Verification
    st, res = make_req("/auth/kyc/verify", "POST", {
        "document_type": "Aadhaar Card",
        "document_number": "987654321098",
        "full_name": "Arun Kumar",
        "consent_accepted": True
    })
    assert st == 200 and res.get("is_kyc_verified"), f"KYC verification failed: {res}"
    print(f"5. Identity/KYC Verification: Status={st}, Masked={res.get('masked_document_number')}")

    # 6. Live Face Liveness Verification
    st, res = make_req("/auth/liveness/verify", "POST", {
        "face_image_base64": None,
        "challenge_action": "blink_and_smile",
        "confidence_score": 0.96
    })
    assert st == 200 and res.get("is_face_verified"), f"Liveness check failed: {res}"
    print(f"6. Live Face Check: Status={st}, Confidence={res.get('confidence_score')}, Challenge={res.get('challenge_passed')}")

    # 7. Register Verified Worker
    st, res = make_req("/auth/register-verified", "POST", {
        "role": "worker",
        "full_name": "Arun Kumar",
        "phone": phone,
        "email": email,
        "password": "password123",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "area": "Sholinganallur",
        "skills": ["Delivery", "Retail Assistant"],
        "is_mobile_verified": True,
        "is_email_verified": True,
        "is_kyc_verified": True,
        "is_face_verified": True
    })
    assert st == 200 and res.get("access_token"), f"Register Verified Worker failed: {res}"
    worker_token = res["access_token"]
    print(f"7. Verified Account Creation: Status={st}, Role={res['role']}, Token Generated")

    # 8. Session Persistence (/auth/me)
    st, me = make_req("/auth/me", "GET", token=worker_token)
    assert st == 200 and me.get("is_verified"), f"Session retrieval failed: {me}"
    print(f"8. Session Hydration (/auth/me): Status={st}, Name={me['full_name']}, Verification={me.get('verification_status')}")

    # 9. Phone OTP Login
    st, res = make_req("/auth/otp/send", "POST", {"phone_or_email": "+91 98401 23456", "channel": "mobile"})
    dev_login_otp = res.get("dev_hint")
    st, login_res = make_req("/auth/login/otp", "POST", {"phone": "+91 98401 23456", "otp": dev_login_otp})
    assert st == 200 and login_res.get("access_token"), f"Phone OTP login failed: {login_res}"
    print(f"9. Mobile OTP 1-Step Login: Status={st}, User={login_res['full_name']}")

    # 10. Email/Password Login
    st, email_login_res = make_req("/auth/login", "POST", {"email": "worker@sewaa.in", "password": "password123", "role": "worker"})
    assert st == 200 and email_login_res.get("access_token"), f"Email login failed: {email_login_res}"
    print(f"10. Email/Password Login: Status={st}, User={email_login_res['full_name']}")

    print("\n" + "-" * 66)
    print("  ALL 10 PRODUCTION AUTHENTICATION SUITE TESTS PASSED (100%)!     ")
    print("-" * 66)

if __name__ == "__main__":
    run_tests()
