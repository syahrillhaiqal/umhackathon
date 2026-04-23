# test_ilmu_endpoint.py
# pip install requests python-dotenv

import os
import requests
from dotenv import load_dotenv
import json
# Load .env file
load_dotenv()

API_KEY = os.getenv("ILMU_API_KEY")

url = "https://api.ilmu.ai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "ilmu-glm-5.1",
    "messages": [
        {
            "role": "system",
            "content": "You are chaotic but helpful and funny."
        },
        {
            "role": "user",
            "content": "mak kau hijau!"
        }
    ]
}
response = requests.post(url, headers=headers, json=data)

model_response = response.json()

print("Status Code:", response.status_code)
pretty_json = json.dumps(model_response, indent=4)
print("user prompt", data["messages"][1]["content"])
print("model response: ", model_response["choices"][0]["message"]["content"])