import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()

API_KEY = os.getenv("ILMU_API_KEY")

url = "https://api.ilmu.ai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

app = FastAPI(title="Test")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/prompt")
def prompt(from_user: str):

    data = {
        "model": "ilmu-glm-5.1",
        "messages": [
            {
                "role": "system",
                "content": "You are chaotic but helpful and funny."
            },
            {
                "role": "user",
                "content": from_user
            }
        ]
    }

    response = requests.post(url, headers=headers, json=data)

    model_response = response.json()

    print("Status Code:", response.status_code)
    print("User Prompt:", from_user)

    if response.status_code == 200:
        ai_reply = model_response["choices"][0]["message"]["content"]
        print("Model Response:", ai_reply)
        return {"reply": ai_reply}

    else:
        return {
            "error": response.status_code,
            "details": model_response
        }

@app.get("/hello")
def test():
    return {"message": "test"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)