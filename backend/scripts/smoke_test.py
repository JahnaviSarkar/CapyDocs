import os
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("--- SMOKE TEST SCRIPT ---")
    
    # 1. /health
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"GET /health: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"Failed to connect to {BASE_URL}/health: {e}")
        return

    # 2. Upload valid PDF
    pdf_path = r"C:\Users\dell\Desktop\test.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        return
        
    print("\n[TEST] Uploading valid PDF...")
    with open(pdf_path, 'rb') as f:
        r = requests.post(f"{BASE_URL}/upload", files={"file": ("test.pdf", f, "application/pdf")})
    print(f"Status: {r.status_code}")
    if r.status_code != 200:
        print(r.text)
        return
        
    data = r.json()
    print(f"Upload Response: {data}")
    doc_id = data["doc_id"]
    
    # 3. Chat
    questions = [
        "who is anita desai",
        "who is bhatia",
        "what happened at the end"
    ]
    
    for q in questions:
        print(f"\n[TEST] Chat: '{q}'")
        r = requests.post(f"{BASE_URL}/chat", json={"doc_id": doc_id, "question": q})
        print(f"Status: {r.status_code}")
        try:
            print(f"Response: {r.json()}")
        except Exception:
            print(f"Error reading JSON: {r.text}")
            
    # 4. Summary
    print(f"\n[TEST] Summary")
    r = requests.post(f"{BASE_URL}/summary", json={"doc_id": doc_id})
    print(f"Status: {r.status_code}")
    try:
        print(f"Response: {r.json()}")
    except Exception:
        print(f"Error reading JSON: {r.text}")
        
    # 5. Error Cases
    
    # Upload .txt file
    print("\n[TEST ERROR] Upload .txt file")
    dummy_txt = "dummy.txt"
    with open(dummy_txt, "w") as f:
        f.write("hello")
    with open(dummy_txt, 'rb') as f:
        r = requests.post(f"{BASE_URL}/upload", files={"file": ("dummy.txt", f, "text/plain")})
    print(f"Status: {r.status_code}, Body: {r.text}")
    if os.path.exists(dummy_txt): os.remove(dummy_txt)
    
    # Upload file over 20MB
    print("\n[TEST ERROR] Upload > 20MB file")
    big_file = "big_file.pdf"
    # Create 21MB dummy file
    with open(big_file, "wb") as f:
        f.write(b"0" * (21 * 1024 * 1024))
    with open(big_file, 'rb') as f:
        r = requests.post(f"{BASE_URL}/upload", files={"file": ("big_file.pdf", f, "application/pdf")})
    print(f"Status: {r.status_code}, Body: {r.text}")
    if os.path.exists(big_file): os.remove(big_file)
    
    # Send /chat with fake doc_id
    print("\n[TEST ERROR] Chat with fake doc_id")
    r = requests.post(f"{BASE_URL}/chat", json={"doc_id": "fake_id_123", "question": "hello"})
    print(f"Status: {r.status_code}, Body: {r.text}")

if __name__ == "__main__":
    run_tests()
