import requests, json
url = 'http://127.0.0.1:8000/api/auth/login/'
payload = {
    "username": "admin",
    "password": "admin",
    "role": "admin"
}
headers = {'Content-Type': 'application/json'}
try:
    r = requests.post(url, data=json.dumps(payload), headers=headers)
    print('Status code:', r.status_code)
    print('Response text:', r.text)
except Exception as e:
    print('Request failed:', e)
