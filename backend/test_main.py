from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Personal Ops API is running!"}

def test_create_habit():
    response = client.post(
        "/api/habits",
        json={"title": "Automated Test Habit", "description": "Testing via pytest"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Automated Test Habit"
    assert "id" in data