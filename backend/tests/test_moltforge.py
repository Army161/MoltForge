"""
MoltForge Backend API Tests - Iteration 1
Tests: Auth, Workspaces, Install Jobs, Billing, Admin
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TOKEN = "test_sess_t1_1773140606122"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

class TestAuth:
    """Auth endpoint tests"""

    def test_auth_me_authenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=HEADERS)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "user_id" in data
        assert "email" in data
        assert "_id" not in data

    def test_auth_me_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_register_new_user(self):
        unique = int(time.time())
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_reg_{unique}@example.com",
            "password": "Password123!",
            "name": "TEST Register"
        })
        assert r.status_code == 200, f"Register failed: {r.text}"
        data = r.json()
        assert "user" in data
        assert data["user"]["email"] == f"TEST_reg_{unique}@example.com"
        assert "password_hash" not in data["user"]

    def test_register_duplicate_email(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "testuser.t1@example.com",
            "password": "Password123!"
        })
        assert r.status_code == 400

    def test_login_valid(self):
        # First register
        unique = int(time.time()) + 1
        email = f"TEST_login_{unique}@example.com"
        pwd = "LoginPass123!"
        requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": pwd})
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd})
        assert r.status_code == 200, f"Login failed: {r.text}"
        data = r.json()
        assert "user" in data

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        })
        assert r.status_code == 401


class TestWorkspaces:
    """Workspace CRUD and job creation"""

    ws_id = None
    job_id = None

    def test_list_workspaces(self):
        r = requests.get(f"{BASE_URL}/api/workspaces", headers=HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_workspace(self):
        r = requests.post(f"{BASE_URL}/api/workspaces", headers=HEADERS, json={
            "name": "TEST Workspace",
            "description": "Test workspace",
            "agent_name": "TestAgent"
        })
        assert r.status_code == 200, f"Create workspace failed: {r.text}"
        data = r.json()
        assert "workspace_id" in data
        assert data["name"] == "TEST Workspace"
        assert "latest_job" in data
        assert data["latest_job"]["status"] == "queued"
        assert "_id" not in data
        TestWorkspaces.ws_id = data["workspace_id"]
        TestWorkspaces.job_id = data["latest_job"]["job_id"]

    def test_get_workspace(self):
        if not TestWorkspaces.ws_id:
            pytest.skip("No workspace created")
        r = requests.get(f"{BASE_URL}/api/workspaces/{TestWorkspaces.ws_id}", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert data["workspace_id"] == TestWorkspaces.ws_id

    def test_list_jobs_for_workspace(self):
        if not TestWorkspaces.ws_id:
            pytest.skip("No workspace created")
        r = requests.get(f"{BASE_URL}/api/workspaces/{TestWorkspaces.ws_id}/jobs", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "_id" not in data[0]

    def test_get_job_status(self):
        if not TestWorkspaces.job_id:
            pytest.skip("No job created")
        r = requests.get(f"{BASE_URL}/api/jobs/{TestWorkspaces.job_id}", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "status" in data
        assert data["status"] in ["queued", "provisioning", "bootstrapping", "healthy", "failed"]

    def test_wait_for_job_healthy(self):
        if not TestWorkspaces.job_id:
            pytest.skip("No job created")
        # Poll for up to 30 seconds
        for _ in range(15):
            r = requests.get(f"{BASE_URL}/api/jobs/{TestWorkspaces.job_id}", headers=HEADERS)
            data = r.json()
            if data.get("status") == "healthy":
                break
            time.sleep(2)
        assert data.get("status") == "healthy", f"Job did not reach healthy: {data.get('status')}"

    def test_get_job_logs(self):
        if not TestWorkspaces.job_id:
            pytest.skip("No job created")
        r = requests.get(f"{BASE_URL}/api/jobs/{TestWorkspaces.job_id}/logs", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert "message" in data[0]
            assert "phase" in data[0]
            assert "_id" not in data[0]


class TestBilling:
    """Billing plan tests"""

    def test_get_plans(self):
        r = requests.get(f"{BASE_URL}/api/billing/plans")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 3
        plan_ids = [p["plan_id"] for p in data]
        assert "starter" in plan_ids
        assert "pro" in plan_ids
        assert "enterprise" in plan_ids

    def test_list_transactions(self):
        r = requests.get(f"{BASE_URL}/api/billing/transactions", headers=HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestAdmin:
    """Admin endpoint tests"""

    def test_admin_stats(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=HEADERS)
        assert r.status_code == 200, f"Admin stats failed: {r.text}"
        data = r.json()
        assert "total_users" in data
        assert "total_workspaces" in data
        assert "active_workspaces" in data

    def test_admin_audit(self):
        r = requests.get(f"{BASE_URL}/api/admin/audit", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_admin_users(self):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert "password_hash" not in data[0]

    def test_health_check(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("service") == "MoltForge API"
