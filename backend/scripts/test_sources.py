import requests

print("Uploading test.pdf...")
with open("C:/Users/dell/Desktop/test.pdf", "rb") as f:
    res = requests.post("http://127.0.0.1:8000/upload", files={"file": f})
    doc_id = res.json()["doc_id"]

print("Doc ID:", doc_id)

print("\nQ: who is anita desai")
res1 = requests.post("http://127.0.0.1:8000/chat", json={"doc_id": doc_id, "question": "who is anita desai", "purpose": "general"})
print(res1.json())

print("\nQ: what happened at the end")
res2 = requests.post("http://127.0.0.1:8000/chat", json={"doc_id": doc_id, "question": "what happened at the end", "purpose": "general"})
print(res2.json())
