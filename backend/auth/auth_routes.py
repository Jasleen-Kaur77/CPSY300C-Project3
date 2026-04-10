from backend.auth.firebase_config import verify_firebase_token


def extract_bearer_token(req):
    auth_header = req.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.replace("Bearer ", "").strip()


def require_auth(req):
    token = extract_bearer_token(req)

    if not token:
        return None, {"error": "Missing or invalid Authorization header"}

    try:
        decoded = verify_firebase_token(token)
        return decoded, None
    except Exception as e:
        return None, {"error": f"Unauthorized: {str(e)}"}