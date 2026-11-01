#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CookieLauncher Web API - Auth, Friends, Rank, Leaderboard
Flask-based REST API for web and desktop sync
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json
import os
import hashlib
import time
import uuid

app = Flask(__name__)
app.secret_key = "cookilauncher-secret-key-2026"
CORS(app, supports_credentials=True)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"users": [], "friend_requests": [], "chat_messages": {}}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_rank(points):
    if points >= 9000: return {"name": "Netherite", "icon": "🔥", "color": "#4a3a2a"}
    if points >= 6000: return {"name": "Elmas", "icon": "◆", "color": "#00bfff"}
    if points >= 3000: return {"name": "Altın", "icon": "★", "color": "#ffd700"}
    if points >= 1000: return {"name": "Demir", "icon": "🛡", "color": "#b0b0b0"}
    return {"name": "Kömür", "icon": "⛏", "color": "#4a4a4a"}

def generate_friend_code():
    import random, string
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    code = "CL-"
    for _ in range(4): code += random.choice(chars)
    code += "-"
    for _ in range(4): code += random.choice(chars)
    return code

# ==================== AUTH ====================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = load_data()
    body = request.json
    username = body.get("username", "").strip()
    email = body.get("email", "").strip()
    password = body.get("password", "")
    
    if not username or not email or not password:
        return jsonify({"success": False, "error": "Tüm alanlar gerekli."}), 400
    
    if any(u["username"] == username for u in data["users"]):
        return jsonify({"success": False, "error": "Bu kullanıcı adı zaten kullanılıyor."}), 400
    
    if any(u["email"] == email for u in data["users"]):
        return jsonify({"success": False, "error": "Bu e-posta zaten kayıtlı."}), 400
    
    new_user = {
        "id": "user_" + str(uuid.uuid4())[:8],
        "username": username,
        "email": email,
        "password": hash_password(password),
        "points": 0,
        "activeSeconds": 0,
        "friendCode": generate_friend_code(),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "authType": "normal",
        "rank": "coal",
        "avatar": None
    }
    data["users"].append(new_user)
    save_data(data)
    
    return jsonify({"success": True, "user": {k: v for k, v in new_user.items() if k != "password"}, "token": new_user["id"]})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = load_data()
    body = request.json
    username = body.get("username", "").strip()
    password = body.get("password", "")
    
    user = None
    for u in data["users"]:
        if (u["username"] == username or u["email"] == username) and u["password"] == hash_password(password):
            user = u
            break
    
    if not user:
        return jsonify({"success": False, "error": "Kullanıcı adı veya şifre hatalı."}), 401
    
    return jsonify({"success": True, "user": {k: v for k, v in user.items() if k != "password"}, "token": user["id"]})

# Discord OAuth Configuration
DISCORD_CLIENT_ID = "YOUR_DISCORD_CLIENT_ID"  # Replace with actual Discord app client ID
DISCORD_CLIENT_SECRET = "YOUR_DISCORD_CLIENT_SECRET"  # Replace with actual secret
DISCORD_REDIRECT_URI = "http://localhost:5000/callback"

@app.route("/api/auth/discord", methods=["POST"])
def discord_auth():
    # Step 1: Redirect to Discord OAuth
    auth_url = f"https://discord.com/api/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={DISCORD_REDIRECT_URI}&response_type=code&scope=identify%20email"
    return jsonify({"success": True, "auth_url": auth_url})

@app.route("/callback", methods=["GET"])
def discord_callback():
    code = request.args.get("code")
    if not code:
        return "Authorization code not found", 400
    
    # Exchange code for access token
    import requests
    token_response = requests.post("https://discord.com/api/oauth2/token", data={
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": DISCORD_REDIRECT_URI
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    
    if token_response.status_code != 200:
        return "Token exchange failed", 400
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    # Fetch user info from Discord
    user_response = requests.get("https://discord.com/api/users/@me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    
    if user_response.status_code != 200:
        return "Failed to fetch user info", 400
    
    discord_user_info = user_response.json()
    
    data = load_data()
    # Check if user already exists
    existing_user = next((u for u in data["users"] if u.get("discordId") == discord_user_info["id"]), None)
    
    if existing_user:
        return jsonify({"success": True, "user": {k: v for k, v in existing_user.items() if k != "password"}, "token": existing_user["id"]})
    
    # Create new user
    discord_user = {
        "id": "discord_" + str(uuid.uuid4())[:8],
        "username": discord_user_info.get("username", "DiscordUser"),
        "email": discord_user_info.get("email", "discord@example.com"),
        "password": "",
        "points": 0,
        "activeSeconds": 0,
        "friendCode": generate_friend_code(),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "authType": "discord",
        "rank": "coal",
        "avatar": discord_user_info.get("avatar"),
        "discordId": discord_user_info["id"],
        "discordTag": f"{discord_user_info['username']}#{discord_user_info.get('discriminator', '0')}"
    }
    data["users"].append(discord_user)
    save_data(data)
    
    return jsonify({"success": True, "user": {k: v for k, v in discord_user.items() if k != "password"}, "token": discord_user["id"]})

@app.route("/api/auth/discord", methods=["POST"])
# ==================== USER ====================

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    data = load_data()
    user = next((u for u in data["users"] if u["id"] == user_id), None)
    if not user:
        return jsonify({"success": False, "error": "Kullanıcı bulunamadı."}), 404
    user_data = {k: v for k, v in user.items() if k != "password"}
    user_data["rank"] = get_rank(user["points"])
    return jsonify({"success": True, "user": user_data})

@app.route("/api/user/<user_id>/points", methods=["POST"])
def add_points(user_id):
    data = load_data()
    user = next((u for u in data["users"] if u["id"] == user_id), None)
    if not user:
        return jsonify({"success": False, "error": "Kullanıcı bulunamadı."}), 404
    
    body = request.json
    seconds = body.get("seconds", 0)
    points_earned = seconds // 60
    user["points"] = min(9000, user["points"] + points_earned)
    user["activeSeconds"] = user.get("activeSeconds", 0) + seconds
    user["rank"] = get_rank(user["points"])["name"].lower()
    save_data(data)
    
    return jsonify({"success": True, "points": user["points"], "rank": get_rank(user["points"])})

# ==================== FRIENDS ====================

@app.route("/api/friends/<user_id>", methods=["GET"])
def get_friends(user_id):
    data = load_data()
    user = next((u for u in data["users"] if u["id"] == user_id), None)
    if not user:
        return jsonify({"success": False, "error": "Kullanıcı bulunamadı."}), 404
    
    friends = []
    for fr in data.get("friend_requests", []):
        if fr["to"] == user_id and fr["status"] == "accepted":
            friend = next((u for u in data["users"] if u["id"] == fr["from"]), None)
            if friend:
                friends.append({"id": friend["id"], "username": friend["username"], "friendCode": friend["friendCode"], "points": friend["points"], "rank": get_rank(friend["points"]), "status": "online"})
        if fr["from"] == user_id and fr["status"] == "accepted":
            friend = next((u for u in data["users"] if u["id"] == fr["to"]), None)
            if friend:
                friends.append({"id": friend["id"], "username": friend["username"], "friendCode": friend["friendCode"], "points": friend["points"], "rank": get_rank(friend["points"]), "status": "online"})
    
    return jsonify({"success": True, "friends": friends})

@app.route("/api/friends/request", methods=["POST"])
def send_friend_request():
    data = load_data()
    body = request.json
    from_id = body.get("from")
    friend_code = body.get("friendCode", "").upper()
    
    from_user = next((u for u in data["users"] if u["id"] == from_id), None)
    to_user = next((u for u in data["users"] if u["friendCode"] == friend_code), None)
    
    if not from_user or not to_user:
        return jsonify({"success": False, "error": "Kullanıcı bulunamadı."}), 404
    
    if from_user["id"] == to_user["id"]:
        return jsonify({"success": False, "error": "Kendinize arkadaşlık isteği gönderemezsiniz."}), 400
    
    # Check if already friends
    existing = next((fr for fr in data.get("friend_requests", []) 
        if ((fr["from"] == from_id and fr["to"] == to_user["id"]) or (fr["from"] == to_user["id"] and fr["to"] == from_id)) and fr["status"] == "accepted"), None)
    if existing:
        return jsonify({"success": False, "error": "Bu kullanıcı zaten arkadaşınız."}), 400
    
    req = {
        "id": "req_" + str(uuid.uuid4())[:8],
        "from": from_id,
        "fromUsername": from_user["username"],
        "fromFriendCode": from_user["friendCode"],
        "to": to_user["id"],
        "toUsername": to_user["username"],
        "toFriendCode": friend_code,
        "status": "pending",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    data.setdefault("friend_requests", []).append(req)
    save_data(data)
    
    return jsonify({"success": True, "request": req})

@app.route("/api/friends/requests/<user_id>", methods=["GET"])
def get_friend_requests(user_id):
    data = load_data()
    pending = [fr for fr in data.get("friend_requests", []) if fr["to"] == user_id and fr["status"] == "pending"]
    return jsonify({"success": True, "requests": pending})

@app.route("/api/friends/accept", methods=["POST"])
def accept_friend():
    data = load_data()
    body = request.json
    req_id = body.get("requestId")
    
    req = next((fr for fr in data.get("friend_requests", []) if fr["id"] == req_id), None)
    if not req:
        return jsonify({"success": False, "error": "İstek bulunamadı."}), 404
    
    req["status"] = "accepted"
    save_data(data)
    return jsonify({"success": True})

@app.route("/api/friends/reject", methods=["POST"])
def reject_friend():
    data = load_data()
    body = request.json
    req_id = body.get("requestId")
    
    req = next((fr for fr in data.get("friend_requests", []) if fr["id"] == req_id), None)
    if not req:
        return jsonify({"success": False, "error": "İstek bulunamadı."}), 404
    
    req["status"] = "rejected"
    save_data(data)
    return jsonify({"success": True})

# ==================== CHAT ====================

@app.route("/api/chat/<user_id>/<friend_id>", methods=["GET"])
def get_chat(user_id, friend_id):
    data = load_data()
    key = f"{user_id}:{friend_id}"
    messages = data.get("chat_messages", {}).get(key, [])
    # Also check reverse key
    if not messages:
        key2 = f"{friend_id}:{user_id}"
        messages = data.get("chat_messages", {}).get(key2, [])
    return jsonify({"success": True, "messages": messages})

@app.route("/api/chat/send", methods=["POST"])
def send_chat():
    data = load_data()
    body = request.json
    from_id = body.get("from")
    to_id = body.get("to")
    text = body.get("text", "")
    
    if not text.strip():
        return jsonify({"success": False, "error": "Mesaj boş olamaz."}), 400
    
    key = f"{from_id}:{to_id}"
    data.setdefault("chat_messages", {}).setdefault(key, []).append({
        "from": from_id,
        "text": text,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    save_data(data)
    return jsonify({"success": True})

# ==================== LEADERBOARD ====================

@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    data = load_data()
    sorted_users = sorted(data["users"], key=lambda u: u.get("points", 0), reverse=True)[:20]
    result = []
    for u in sorted_users:
        result.append({
            "id": u["id"],
            "username": u["username"],
            "points": u.get("points", 0),
            "rank": get_rank(u.get("points", 0)),
            "friendCode": u["friendCode"]
        })
    return jsonify({"success": True, "leaderboard": result})

# ==================== HEALTH ====================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "api_version": 14})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)