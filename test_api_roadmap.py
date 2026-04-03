import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8001"

# Test 1: Upload resume
print("=" * 50)
print("TEST 1: Uploading resume...")
print("=" * 50)

resume_text = """Senior Software Engineer
10 years of experience in backend development
- Python, Go, JavaScript
- Microservices, Kubernetes, Docker
- AWS, Google Cloud
- Team leadership"""

with open("test_resume_upload.txt", "w") as f:
    f.write(resume_text)

with open("test_resume_upload.txt", "rb") as f:
    files = {"file": f}
    try:
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            resume_id = data.get("resume_id")
            print(f"✅ Resume uploaded successfully!")
            print(f"Resume ID: {resume_id}")
        else:
            print(f"❌ Error: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

# Test 2: Generate roadmap
print("\n" + "=" * 50)
print("TEST 2: Generating roadmap...")
print("=" * 50)

roadmap_data = {
    "resume_id": resume_id,
    "job_description": "Senior Full Stack Engineer at Google - Need React, System Design, GraphQL",
    "daily_hours": 2
}

try:
    response = requests.post(f"{BASE_URL}/api/roadmap", data=roadmap_data, timeout=15)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        roadmap = response.json()
        print(f"✅ Roadmap generated successfully!")
        print(f"Duration: {roadmap.get('duration_weeks')} weeks")
        print(f"Tasks: {len(roadmap.get('tasks', []))}")
        if roadmap.get('tasks'):
            print(f"First task: {roadmap['tasks'][0].get('task')}")
            print(f"Milestones: {roadmap.get('milestones')}")
    else:
        print(f"❌ Error: {response.text}")
        sys.exit(1)
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 50)
print("✅ ALL TESTS PASSED!")
print("=" * 50)
