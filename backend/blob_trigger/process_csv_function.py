import json
from azure.storage.blob import BlobServiceClient
import os

from utils.data_cleaning import (
    load_data,
    clean_data,
    avg_macros_by_diet,
    top_5_protein_by_diet,
    cuisine_counts
)


def _get_storage_connection() -> str:
    return os.environ.get("AzureWebJobsStorage") or os.environ["BLOB_CONNECTION_STRING"]


def _get_container_name() -> str:
    return os.environ.get("BLOB_CONTAINER_NAME", "datasets")

def process_csv(file_path):
    print("STEP 1: Loading data...")
    df = load_data(file_path)

    print("STEP 2: Cleaning data...")
    df = clean_data(df)

    print("STEP 3: Calculating insights...")
    avg_macros = avg_macros_by_diet(df)
    top_recipes = top_5_protein_by_diet(df)
    cuisines = cuisine_counts(df)

    print("STEP 4: Saving processed data to Azure Blob...")

    blob_service = BlobServiceClient.from_connection_string(
        _get_storage_connection()
    )

    container = blob_service.get_container_client(_get_container_name())

    # Upload JSON files
    container.upload_blob(
        name="avg_macros.json",
        data=json.dumps(avg_macros.to_dict(orient="records")),
        overwrite=True
    )

    container.upload_blob(
        name="recipes.json",
        data=json.dumps(top_recipes.to_dict(orient="records")),
        overwrite=True
    )

    container.upload_blob(
        name="clusters.json",
        data=json.dumps(cuisines.to_dict(orient="records")),
        overwrite=True
    )

    print("Data processed and stored in Azure!")