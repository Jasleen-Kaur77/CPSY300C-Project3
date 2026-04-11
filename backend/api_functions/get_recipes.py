import json
import azure.functions as func
from azure.storage.blob import BlobServiceClient
import os

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        blob_service = BlobServiceClient.from_connection_string(
            os.environ["BLOB_CONNECTION_STRING"]
        )

        container = blob_service.get_container_client("datasets")

        blob = container.download_blob("recipes.json")
        data = json.loads(blob.readall())

        return func.HttpResponse(
            json.dumps(data),
            mimetype="application/json"
        )

    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)