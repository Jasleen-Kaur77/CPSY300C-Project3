import os
import firebase_admin
from firebase_admin import credentials, auth

firebase_app = None

def initialize_firebase():
    global firebase_app

    if firebase_app is not None:
        return firebase_app

    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        "auth/firebase-service-account.json"
    )

    cred = credentials.Certificate(service_account_path)
    firebase_app = firebase_admin.initialize_app(cred)
    return firebase_app


def verify_firebase_token(id_token: str):
    initialize_firebase()
    decoded_token = auth.verify_id_token(id_token)
    return decoded_token