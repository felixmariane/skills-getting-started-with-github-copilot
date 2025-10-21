import pytest
from fastapi.testclient import TestClient
from src.app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_get_activities(client):
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    # Verifica se temos as chaves esperadas em cada atividade
    for activity_name, details in activities.items():
        assert isinstance(activity_name, str)
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)

def test_signup_for_activity(client):
    # Primeiro, vamos pegar a lista de atividades
    activities_response = client.get("/activities")
    activities = activities_response.json()
    
    # Pega o nome da primeira atividade
    activity_name = list(activities.keys())[0]
    
    # Tenta registrar um participante
    email = "test@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Verifica se o participante foi adicionado
    activities_after = client.get("/activities").json()
    assert email in activities_after[activity_name]["participants"]

def test_unregister_from_activity(client):
    # Primeiro, vamos registrar um participante
    activity_name = list(client.get("/activities").json().keys())[0]
    email = "test_unregister@mergington.edu"
    
    # Registra o participante
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Tenta remover o participante
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Verifica se o participante foi removido
    activities_after = client.get("/activities").json()
    assert email not in activities_after[activity_name]["participants"]

def test_signup_invalid_activity(client):
    response = client.post("/activities/invalid_activity/signup?email=test@mergington.edu")
    assert response.status_code == 404

def test_signup_invalid_email(client):
    activity_name = list(client.get("/activities").json().keys())[0]
    response = client.post(f"/activities/{activity_name}/signup?email=invalid_email")
    assert response.status_code == 400

def test_activity_max_participants(client):
    # Primeiro, vamos pegar a lista de atividades e limpar os participantes
    activities_response = client.get("/activities")
    activities = activities_response.json()
    
    # Pega o nome da primeira atividade
    activity_name = list(activities.keys())[0]
    max_participants = activities[activity_name]["max_participants"]
    
    # Remove todos os participantes existentes
    current_participants = activities[activity_name]["participants"].copy()
    for email in current_participants:
        client.post(f"/activities/{activity_name}/unregister?email={email}")
    
    # Tenta registrar mais participantes que o limite
    for i in range(max_participants + 1):
        email = f"test{i}@mergington.edu"
        response = client.post(f"/activities/{activity_name}/signup?email={email}")
        
        if i < max_participants:
            assert response.status_code == 200, f"Failed on participant {i}"
        else:
            assert response.status_code == 400, f"Should have failed on participant {i}"
            assert "full" in response.json()["detail"].lower()