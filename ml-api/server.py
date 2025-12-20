# server.py (in your ml-api folder)
from flask import Flask, request, jsonify
import time
import requests

app = Flask(__name__)

# Dummy scraped data (same shape as your real example)
DUMMY_SCRAPED = [
    {
        "keyword": "ai automation",
        "url": "https://example.com/article",
        "content": "This is scraped content for keyword: ai automation.",
    },
    {
        "keyword": "dataset generation",
        "url": "https://example.com/article",
        "content": "This is scraped content for keyword: dataset generation.",
    },
    {
        "keyword": "machine learning",
        "url": "https://example.com/article",
        "content": "This is scraped content for keyword: machine learning.",
    },
]

@app.route("/process", methods=["POST"])
def process():
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    prompt_id = data.get("promptId")  # from Node

    print("📩 ML API RECEIVED PROMPT:", prompt, flush=True)
    print("🔗 promptId:", prompt_id, flush=True)

    # Simulate ML work
    time.sleep(2)

    generated_keywords = ["ai automation", "dataset generation", "machine learning"]
    vector = [0.3559, 0.2934, 0.6253, 0.3809, 0.9998]

    # ---- Simulate scraping + send final dataset to Node ----
    if prompt_id:
        print("🕸 Starting fake scraping for promptId=", prompt_id, flush=True)

        preview = []
        for item in DUMMY_SCRAPED:
            preview.append(
                {
                    "title": f"Sample title for {item['keyword']}",
                    "url": item["url"],
                    "content": item["content"],
                    "keywordUsed": item["keyword"],
                }
            )

        payload = {
            "promptId": prompt_id,
            "preview": preview,
            "downloadLink": "https://example.com/generated-dataset.zip",
            "totalItems": len(preview),
            "errorMessage": "",
        }

        try:
            resp = requests.post("http://127.0.0.1:8000/scrape", json=payload, timeout=5)
            print("📤 Sent scraped dataset to Node. Status:", resp.status_code, resp.text, flush=True)
        except Exception as e:
            print("❌ Error calling Node /scrape:", e, flush=True)

    # Response to Node for keyword/vector step
    return jsonify(
        {
            "status": "done",
            "generated_keywords": generated_keywords,
            "vector": vector,
            "message": "Dataset generated from ML API!",
        }
    )


if __name__ == "__main__":
    app.run(port=5001)
