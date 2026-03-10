# MoltForge Auth Testing Playbook

## Step 1: Create Test User & Session

```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: '',
  auth_provider: 'email',
  is_admin: false,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  session_id: 'sess_test_' + Date.now(),
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Test auth/me with session token
curl -s "$API_URL/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN" | python3 -m json.tool

# Test workspaces
curl -s "$API_URL/api/workspaces" -H "Authorization: Bearer YOUR_SESSION_TOKEN" | python3 -m json.tool

# Create a workspace
curl -s -X POST "$API_URL/api/workspaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"name":"Test Workspace","description":"Testing","agent_name":"TestAgent"}' | python3 -m json.tool
```

## Step 3: Browser Testing

```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "forge-provision.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://forge-provision.preview.emergentagent.com/dashboard")
```

## Checklist
- [ ] User document has user_id field
- [ ] Session user_id matches user's user_id exactly
- [ ] All queries use `{"_id": 0}` projection
- [ ] /api/auth/me returns user data
- [ ] Dashboard loads without redirect to login
- [ ] Workspace creation triggers install job
- [ ] Install progress polling works (queued → provisioning → bootstrapping → healthy)
- [ ] Chat sends real OpenAI request
- [ ] Billing checkout creates Stripe session

## Success Indicators
- /api/auth/me returns user data (200)
- Dashboard loads without redirect
- Install job reaches "healthy" status
- Agent chat responds via OpenAI API

## Failure Indicators
- 401 Unauthorized on /api/auth/me
- Redirect loop to /login
- Install job stuck in "queued"
- Chat returns LLM provider error
