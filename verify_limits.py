
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_admin_flow():
    # 1. Register Admin
    username = f"admin_{int(time.time())}"
    email = f"{username}@test.com"
    payload = {
        "username": username,
        "email": email,
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Admin"
    }
    
    print(f"Testing registration for {username}...")
    resp = requests.post(f"{BASE_URL}/auth/register-admin/", json=payload)
    if resp.status_code != 201:
        print(f"FAILED registration: {resp.text}")
        return
    
    data = resp.json()
    token = data['access']
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Registered admin and got token.")

    # 2. Create first shop (Trial allow 1)
    shop_payload = {
        "name": "Shop 1",
        "address": "Address 1",
        "phone": "1234567890"
    }
    print("Creating first shop...")
    resp = requests.post(f"{BASE_URL}/shops/shops/", json=shop_payload, headers=headers)
    if resp.status_code == 201:
        print("SUCCESS: Created first shop.")
    else:
        print(f"FAILED creating first shop: {resp.text}")

    # 3. Create second shop (Should fail)
    shop_payload['name'] = "Shop 2"
    print("Creating second shop (should fail)...")
    resp = requests.post(f"{BASE_URL}/shops/shops/", json=shop_payload, headers=headers)
    if resp.status_code == 403:
        print("SUCCESS: Blocked second shop correctly.")
        print(f"Error Message: {resp.json().get('detail')}")
    else:
        print(f"FAILED: Created second shop unexpectedly or got wrong error code {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    test_admin_flow()
