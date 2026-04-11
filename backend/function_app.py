import azure.functions as func
import json
import os
import tempfile
from azure.storage.blob import BlobServiceClient

from auth.auth_routes import require_auth
from blob_trigger.process_csv_function import process_csv

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def _get_storage_connection() -> str:
    return os.environ.get("AzureWebJobsStorage") or os.environ["BLOB_CONNECTION_STRING"]


def _get_container_name() -> str:
    return os.environ.get("BLOB_CONTAINER_NAME", "datasets")

# =========================
# 🔹 BLOB TRIGGER
# =========================
@app.blob_trigger(
    arg_name="myblob",
    path="datasets/All_Diets.csv",
    connection="AzureWebJobsStorage"
)
def blob_trigger_function(myblob: func.InputStream):

    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp.write(myblob.read())
        temp_path = temp.name

    process_csv(temp_path)


# =========================
# 🔹 GET NUTRITION
# =========================
@app.route(route="get_nutrition", methods=["GET"])
def get_nutrition(req: func.HttpRequest) -> func.HttpResponse:
    try:
        _, auth_error = require_auth(req)
        if auth_error:
            return func.HttpResponse(
                json.dumps(auth_error),
                mimetype="application/json",
                status_code=401
            )

        blob_service = BlobServiceClient.from_connection_string(
            _get_storage_connection()
        )
        container = blob_service.get_container_client(_get_container_name())

        blob = container.download_blob("avg_macros.json")
        data = json.loads(blob.readall())

        return func.HttpResponse(json.dumps(data), mimetype="application/json")

    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)


# =========================
# 🔹 GET RECIPES
# =========================
@app.route(route="get_recipes", methods=["GET"])
def get_recipes(req: func.HttpRequest) -> func.HttpResponse:
    try:
        _, auth_error = require_auth(req)
        if auth_error:
            return func.HttpResponse(
                json.dumps(auth_error),
                mimetype="application/json",
                status_code=401
            )

        blob_service = BlobServiceClient.from_connection_string(
            _get_storage_connection()
        )
        container = blob_service.get_container_client(_get_container_name())

        blob = container.download_blob("recipes.json")
        data = json.loads(blob.readall())

        return func.HttpResponse(json.dumps(data), mimetype="application/json")

    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)


# =========================
# 🔹 GET CLUSTERS
# =========================
@app.route(route="get_clusters", methods=["GET"])
def get_clusters(req: func.HttpRequest) -> func.HttpResponse:
    try:
        _, auth_error = require_auth(req)
        if auth_error:
            return func.HttpResponse(
                json.dumps(auth_error),
                mimetype="application/json",
                status_code=401
            )

        blob_service = BlobServiceClient.from_connection_string(
            _get_storage_connection()
        )
        container = blob_service.get_container_client(_get_container_name())

        blob = container.download_blob("clusters.json")
        data = json.loads(blob.readall())

        return func.HttpResponse(json.dumps(data), mimetype="application/json")

    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)