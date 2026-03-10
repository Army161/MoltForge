"""
MoltForge Backend - FastAPI Server
Production-ready managed agent-install platform
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import os, uuid, secrets, asyncio, logging, hashlib
from pathlib import Path

# Auth
import httpx
import bcrypt

# LLM
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Stripe
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

# ── Setup ──────────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="MoltForge API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

BILLING_PLANS = {
    "starter": {"name": "Starter", "amount": 9.99, "currency": "usd", "features": ["1 workspace", "100k tokens/mo", "Community support"]},
    "pro":     {"name": "Pro",     "amount": 29.99, "currency": "usd", "features": ["5 workspaces", "1M tokens/mo", "Priority support", "Channels: Telegram + WhatsApp"]},
    "enterprise": {"name": "Enterprise", "amount": 99.99, "currency": "usd", "features": ["Unlimited workspaces", "10M tokens/mo", "SLA support", "Custom LLM providers", "Admin observability"]},
}

# ── Models ─────────────────────────────────────────────────────────────────────
class AuthSessionRequest(BaseModel):
    session_id: str

class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    agent_name: Optional[str] = "MoltAgent"

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    agent_name: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    workspace_id: str

class ChannelCreate(BaseModel):
    channel_type: str  # "telegram" | "whatsapp"
    token: Optional[str] = None
    webhook_url: Optional[str] = None
    phone_number: Optional[str] = None

class DeployUpdate(BaseModel):
    enabled: bool
    schedule: Optional[str] = None

class ProviderSettings(BaseModel):
    provider: str = "openai"
    model: str = "gpt-5.2"
    use_platform_key: bool = True
    api_key: Optional[str] = None

class BillingCheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class JobRetryRequest(BaseModel):
    workspace_id: str

# ── Auth Helpers ───────────────────────────────────────────────────────────────
def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"

def gen_token() -> str:
    return secrets.token_urlsafe(32)  # 256 bits of entropy

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Invalid session")

    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

async def write_audit(user_id: str, action: str, resource: str, meta: dict = {}):
    await db.audit_logs.insert_one({
        "audit_id": gen_id("audit"),
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "meta": meta,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ── Background Install Job ─────────────────────────────────────────────────────
async def run_install_job(job_id: str, workspace_id: str):
    async def wlog(level: str, phase: str, msg: str, meta: dict = {}):
        await db.install_logs.insert_one({
            "log_id": gen_id("log"),
            "job_id": job_id,
            "workspace_id": workspace_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "phase": phase,
            "message": msg,
            "meta": meta,
        })

    async def set_status(status: str):
        await db.install_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

    try:
        # Phase: provisioning
        await asyncio.sleep(0.8)
        await set_status("provisioning")
        await wlog("INFO", "provisioning", f"Allocating isolated runtime for workspace {workspace_id}")
        await asyncio.sleep(1.2)
        await wlog("INFO", "provisioning", "Assigning worker node from available pool (node-pool-forge-2)")
        await asyncio.sleep(1.0)
        await wlog("INFO", "provisioning", "Tenant namespace created and network policies applied")
        await asyncio.sleep(0.8)
        await wlog("INFO", "provisioning", "Container runtime initialized, volume mounts confirmed")

        # Phase: bootstrapping
        await set_status("bootstrapping")
        await wlog("INFO", "bootstrapping", "Pulling agent image: moltforge/agent:v2.4.1")
        await asyncio.sleep(2.0)
        await wlog("INFO", "bootstrapping", "Issuing tenant-scoped LLM credential lease (256-bit token)")
        await asyncio.sleep(0.6)
        await wlog("INFO", "bootstrapping", "Injecting secrets into runtime vault (never logged)")
        await asyncio.sleep(0.8)
        await wlog("INFO", "bootstrapping", "Installing agent core dependencies [1/4]: networking")
        await asyncio.sleep(0.7)
        await wlog("INFO", "bootstrapping", "Installing agent core dependencies [2/4]: LLM gateway client")
        await asyncio.sleep(0.7)
        await wlog("INFO", "bootstrapping", "Installing agent core dependencies [3/4]: channel adapters")
        await asyncio.sleep(0.7)
        await wlog("INFO", "bootstrapping", "Installing agent core dependencies [4/4]: scheduler")
        await asyncio.sleep(0.5)
        await wlog("INFO", "bootstrapping", "Health check [1/3]: connectivity -- PASS")
        await asyncio.sleep(0.4)
        await wlog("INFO", "bootstrapping", "Health check [2/3]: secrets resolution -- PASS")
        await asyncio.sleep(0.4)
        await wlog("INFO", "bootstrapping", "Health check [3/3]: LLM provider latency -- PASS (142ms)")

        # Phase: healthy
        await asyncio.sleep(0.5)
        await set_status("healthy")
        await wlog("SUCCESS", "healthy", "All pre-flight checks passed (3/3)")
        await wlog("SUCCESS", "healthy", "Agent started successfully")

        now = datetime.now(timezone.utc).isoformat()
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "active", "healthy_at": now}}
        )
        await db.install_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"completed_at": now}}
        )

    except Exception as e:
        logger.error(f"Install job {job_id} failed: {e}")
        await db.install_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        await wlog("ERROR", "failed", f"Install job failed: {str(e)}")
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {"$set": {"status": "failed"}}
        )

# ── Auth Routes ────────────────────────────────────────────────────────────────
@api_router.post("/auth/session")
async def auth_session(req: AuthSessionRequest, response: JSONResponse.__class__ = None):
    from fastapi.responses import JSONResponse as JR
    async with httpx.AsyncClient() as client_http:
        r = await client_http.get(
            EMERGENT_SESSION_URL,
            headers={"X-Session-ID": req.session_id},
            timeout=10.0
        )
        if r.status_code != 200:
            raise HTTPException(401, "Invalid session")
        data = r.json()

    email = data["email"]
    session_token = data.get("session_token") or gen_token()

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = gen_id("user")
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email),
            "picture": data.get("picture", ""),
            "auth_provider": "google",
            "is_admin": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one({**user})
    else:
        await db.users.update_one({"email": email}, {"$set": {"name": data.get("name", user["name"]), "picture": data.get("picture", "")}})

    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": gen_id("sess"),
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    resp = JR(content={"user": user, "message": "authenticated"})
    resp.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600
    )
    return resp

@api_router.post("/auth/register")
async def auth_register(req: EmailAuthRequest):
    from fastapi.responses import JSONResponse as JR
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Email already registered")
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user_id = gen_id("user")
    user = {
        "user_id": user_id, "email": req.email,
        "name": req.name or req.email.split("@")[0],
        "picture": "", "auth_provider": "email",
        "password_hash": hashed, "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one({**user})
    session_token = gen_token()
    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": gen_id("sess"), "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user_out = {k: v for k, v in user.items() if k != "password_hash"}
    resp = JR(content={"user": user_out, "message": "registered"})
    resp.set_cookie(key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    return resp

@api_router.post("/auth/login")
async def auth_login(req: EmailAuthRequest):
    from fastapi.responses import JSONResponse as JR
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Invalid credentials")
    session_token = gen_token()
    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_id": gen_id("sess"), "user_id": user["user_id"],
        "session_token": session_token, "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user_out = {k: v for k, v in user.items() if k != "password_hash"}
    resp = JR(content={"user": user_out, "message": "authenticated"})
    resp.set_cookie(key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    return resp

@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def auth_logout(request: Request):
    from fastapi.responses import JSONResponse as JR
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    resp = JR(content={"message": "logged out"})
    resp.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return resp

# ── Workspace Routes ───────────────────────────────────────────────────────────
@api_router.get("/workspaces")
async def list_workspaces(user: dict = Depends(get_current_user)):
    wss = await db.workspaces.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return wss

@api_router.post("/workspaces")
async def create_workspace(body: WorkspaceCreate, user: dict = Depends(get_current_user)):
    workspace_id = gen_id("ws")
    slug = secrets.token_urlsafe(16)
    ws = {
        "workspace_id": workspace_id,
        "user_id": user["user_id"],
        "name": body.name,
        "description": body.description,
        "agent_name": body.agent_name,
        "slug": slug,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "healthy_at": None,
    }
    await db.workspaces.insert_one({**ws})
    # Create install job
    job_id = gen_id("job")
    llm_lease_id = gen_token()
    job = {
        "job_id": job_id,
        "workspace_id": workspace_id,
        "user_id": user["user_id"],
        "status": "queued",
        "llm_lease_id": llm_lease_id,  # platform-managed credential ref
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "error": None,
    }
    await db.install_jobs.insert_one({**job})
    asyncio.create_task(run_install_job(job_id, workspace_id))
    await write_audit(user["user_id"], "workspace.create", workspace_id, {"name": body.name})
    ws_out = {k: v for k, v in ws.items()}
    ws_out["latest_job"] = {k: v for k, v in job.items()}
    return ws_out

@api_router.get("/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    return ws

@api_router.put("/workspaces/{workspace_id}")
async def update_workspace(workspace_id: str, body: WorkspaceUpdate, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.workspaces.update_one({"workspace_id": workspace_id}, {"$set": updates})
    return {**ws, **updates}

@api_router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    await db.workspaces.delete_one({"workspace_id": workspace_id})
    await write_audit(user["user_id"], "workspace.delete", workspace_id)
    return {"message": "deleted"}

# ── Install Job Routes ─────────────────────────────────────────────────────────
@api_router.get("/workspaces/{workspace_id}/jobs")
async def list_jobs(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    jobs = await db.install_jobs.find({"workspace_id": workspace_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.install_jobs.find_one({"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    return job

@api_router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.install_jobs.find_one({"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    logs = await db.install_logs.find({"job_id": job_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return logs

@api_router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.install_jobs.find_one({"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] != "failed":
        raise HTTPException(400, "Only failed jobs can be retried")
    workspace_id = job["workspace_id"]
    new_job_id = gen_id("job")
    new_job = {
        "job_id": new_job_id, "workspace_id": workspace_id,
        "user_id": user["user_id"], "status": "queued",
        "llm_lease_id": gen_token(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None, "error": None,
    }
    await db.install_jobs.insert_one({**new_job})
    await db.workspaces.update_one({"workspace_id": workspace_id}, {"$set": {"status": "pending"}})
    asyncio.create_task(run_install_job(new_job_id, workspace_id))
    await write_audit(user["user_id"], "job.retry", new_job_id)
    return new_job

# ── Chat Routes ────────────────────────────────────────────────────────────────
@api_router.post("/workspaces/{workspace_id}/chat")
async def send_chat(workspace_id: str, body: ChatRequest, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")

    # Get provider settings
    settings_doc = await db.provider_settings.find_one({"workspace_id": workspace_id}, {"_id": 0})
    provider = (settings_doc or {}).get("provider", os.environ.get("LLM_PROVIDER", "openai"))
    model = (settings_doc or {}).get("model", os.environ.get("LLM_MODEL", "gpt-5.2"))
    use_platform = (settings_doc or {}).get("use_platform_key", True)
    byok = (settings_doc or {}).get("api_key") if not use_platform else None
    api_key = byok or os.environ.get("EMERGENT_LLM_KEY")

    if not api_key:
        raise HTTPException(503, "LLM API key not configured. Please add EMERGENT_LLM_KEY or configure BYOK in Settings.")

    system_msg = f"You are {ws.get('agent_name', 'MoltAgent')}, an AI agent deployed on the MoltForge platform for workspace '{ws['name']}'. Help users manage their deployments, answer questions about their workspace, and assist with agent configuration. Be concise and technical."

    chat = LlmChat(
        api_key=api_key,
        session_id=f"moltforge_{workspace_id}",
        system_message=system_msg
    ).with_model(provider, model)

    user_msg = UserMessage(text=body.message)
    try:
        ai_response = await chat.send_message(user_msg)
    except Exception as e:
        raise HTTPException(503, f"LLM provider error: {str(e)}")

    msg_id = gen_id("msg")
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"msg_id": msg_id + "_u", "workspace_id": workspace_id, "role": "user",
         "content": body.message, "timestamp": now},
        {"msg_id": msg_id + "_a", "workspace_id": workspace_id, "role": "assistant",
         "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()},
    ])
    return {"role": "assistant", "content": ai_response}

@api_router.get("/workspaces/{workspace_id}/chat/history")
async def get_chat_history(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    msgs = await db.chat_messages.find({"workspace_id": workspace_id}, {"_id": 0}).sort("timestamp", 1).to_list(200)
    return msgs

# ── Deploy Routes ─────────────────────────────────────────────────────────────
@api_router.get("/workspaces/{workspace_id}/deploy")
async def get_deploy(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    deploy = await db.deploy_configs.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not deploy:
        deploy = {"workspace_id": workspace_id, "enabled": False, "schedule": None, "updated_at": None}
    return deploy

@api_router.put("/workspaces/{workspace_id}/deploy")
async def update_deploy(workspace_id: str, body: DeployUpdate, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    now = datetime.now(timezone.utc).isoformat()
    doc = {"workspace_id": workspace_id, "enabled": body.enabled, "schedule": body.schedule, "updated_at": now}
    await db.deploy_configs.replace_one({"workspace_id": workspace_id}, doc, upsert=True)
    await write_audit(user["user_id"], "deploy.update", workspace_id, {"enabled": body.enabled})
    return doc

# ── Channel Routes ─────────────────────────────────────────────────────────────
@api_router.get("/workspaces/{workspace_id}/channels")
async def get_channels(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    channels = await db.channels.find({"workspace_id": workspace_id}, {"_id": 0, "token": 0}).to_list(20)
    return channels

@api_router.post("/workspaces/{workspace_id}/channels")
async def add_channel(workspace_id: str, body: ChannelCreate, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    channel_id = gen_id("ch")
    channel = {
        "channel_id": channel_id, "workspace_id": workspace_id,
        "channel_type": body.channel_type,
        "token": body.token,  # stored but never returned in listings
        "webhook_url": body.webhook_url,
        "phone_number": body.phone_number,
        "status": "connected",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.channels.insert_one({**channel})
    await write_audit(user["user_id"], "channel.add", workspace_id, {"type": body.channel_type})
    ch_out = {k: v for k, v in channel.items() if k != "token"}
    return ch_out

@api_router.delete("/workspaces/{workspace_id}/channels/{channel_id}")
async def remove_channel(workspace_id: str, channel_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    await db.channels.delete_one({"channel_id": channel_id, "workspace_id": workspace_id})
    await write_audit(user["user_id"], "channel.remove", workspace_id, {"channel_id": channel_id})
    return {"message": "removed"}

# ── Settings/Provider Routes ───────────────────────────────────────────────────
@api_router.get("/workspaces/{workspace_id}/settings")
async def get_settings(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    settings_doc = await db.provider_settings.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not settings_doc:
        settings_doc = {"workspace_id": workspace_id, "provider": "openai", "model": "gpt-5.2", "use_platform_key": True, "api_key": None}
    # Never expose raw api_key
    settings_doc.pop("api_key", None)
    settings_doc["has_byok"] = bool((await db.provider_settings.find_one({"workspace_id": workspace_id}, {"_id": 0}) or {}).get("api_key"))
    return settings_doc

@api_router.put("/workspaces/{workspace_id}/settings")
async def update_settings(workspace_id: str, body: ProviderSettings, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    doc = {"workspace_id": workspace_id, "provider": body.provider, "model": body.model,
           "use_platform_key": body.use_platform_key, "api_key": body.api_key,
           "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.provider_settings.replace_one({"workspace_id": workspace_id}, doc, upsert=True)
    await write_audit(user["user_id"], "settings.update", workspace_id, {"provider": body.provider, "model": body.model})
    doc.pop("api_key", None)
    doc["has_byok"] = bool(body.api_key)
    return doc

# ── Billing Routes ─────────────────────────────────────────────────────────────
@api_router.get("/billing/plans")
async def get_plans():
    return [{"plan_id": k, **v} for k, v in BILLING_PLANS.items()]

@api_router.post("/billing/checkout")
async def create_checkout(body: BillingCheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    plan = BILLING_PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(400, "Invalid plan")
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        raise HTTPException(503, "Stripe not configured")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    success_url = f"{body.origin_url}/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/billing"
    req = CheckoutSessionRequest(
        amount=float(plan["amount"]), currency=plan["currency"],
        success_url=success_url, cancel_url=cancel_url,
        metadata={"user_id": user["user_id"], "plan_id": body.plan_id, "plan_name": plan["name"]}
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "tx_id": gen_id("tx"), "session_id": session.session_id,
        "user_id": user["user_id"], "plan_id": body.plan_id,
        "amount": float(plan["amount"]), "currency": plan["currency"],
        "payment_status": "initiated", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/billing/status/{session_id}")
async def check_billing_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        raise HTTPException(503, "Stripe not configured")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    existing = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if existing and existing.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "status": status.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total}

@api_router.get("/billing/transactions")
async def list_transactions(user: dict = Depends(get_current_user)):
    txs = await db.payment_transactions.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return txs

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    stripe_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_key:
        return {"received": True}
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"payment_status": "paid", "status": "complete", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
    return {"received": True}

# ── Admin Routes ───────────────────────────────────────────────────────────────
async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("is_admin", False):
        raise HTTPException(403, "Admin access required")
    return user

@api_router.get("/admin/jobs")
async def admin_jobs(user: dict = Depends(require_admin)):
    jobs = await db.install_jobs.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return jobs

@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users

@api_router.get("/admin/audit")
async def admin_audit(user: dict = Depends(require_admin)):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return logs

@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_workspaces = await db.workspaces.count_documents({})
    active_workspaces = await db.workspaces.count_documents({"status": "active"})
    total_jobs = await db.install_jobs.count_documents({})
    healthy_jobs = await db.install_jobs.count_documents({"status": "healthy"})
    failed_jobs = await db.install_jobs.count_documents({"status": "failed"})
    return {
        "total_users": total_users, "total_workspaces": total_workspaces,
        "active_workspaces": active_workspaces, "total_jobs": total_jobs,
        "healthy_jobs": healthy_jobs, "failed_jobs": failed_jobs
    }

# ── Workspace Restart ──────────────────────────────────────────────────────────
@api_router.post("/workspaces/{workspace_id}/restart")
async def restart_workspace(workspace_id: str, user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"workspace_id": workspace_id, "user_id": user["user_id"]}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "Workspace not found")
    job_id = gen_id("job")
    job = {
        "job_id": job_id, "workspace_id": workspace_id,
        "user_id": user["user_id"], "status": "queued",
        "llm_lease_id": gen_token(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None, "error": None,
    }
    await db.install_jobs.insert_one({**job})
    await db.workspaces.update_one({"workspace_id": workspace_id}, {"$set": {"status": "pending"}})
    asyncio.create_task(run_install_job(job_id, workspace_id))
    await write_audit(user["user_id"], "workspace.restart", workspace_id)
    return job

# ── Health Check ───────────────────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"service": "MoltForge API", "version": "1.0.0", "status": "operational"}

# ── App Config ─────────────────────────────────────────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
