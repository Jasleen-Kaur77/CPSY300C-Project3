import os
import io
import json
import time
import pandas as pd
import azure.functions as func
from azure.storage.blob import BlobServiceClient
from helpers.analysis_core import (
    clean_data,
    avg_macros_by_diet,
    top_5_protein_by_diet,
    cuisine_counts,
)

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def _load_df_from_blob(connection_string: str, container_name: str, blob_name: str) -> pd.DataFrame:
    """Load CSV from Azure Blob Storage and rename columns."""
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    
    stream = blob_client.download_blob().readall()
    df = pd.read_csv(io.BytesIO(stream))
    
    # Rename columns for consistency
    rename_columns = {
        "Protein(g)": "Protein",
        "Carbs(g)": "Carbs",
        "Fat(g)": "Fat",
        "Cuisine_type": "Cuisine",
    }
    df = df.rename(columns=rename_columns)
    
    return df


def _format_avg_macros(avg_macros_df: pd.DataFrame) -> list:
    """Convert average macros DataFrame to list of dicts."""
    return avg_macros_df.to_dict(orient="records")


def _format_top_protein(top_protein_df: pd.DataFrame) -> list:
    """Convert top protein DataFrame to list of dicts with relevant columns."""
    required_columns = ["Recipe_name", "Diet_type", "Cuisine", "Protein"]
    return top_protein_df[required_columns].to_dict(orient="records")


def _format_cuisine_counts(cuisine_df: pd.DataFrame) -> list:
    """Convert cuisine counts to list of dicts."""
    return cuisine_df.to_dict(orient="records")


@app.route(route="diet-dashboard", methods=["GET"])
def diet_dashboard(req: func.HttpRequest) -> func.HttpResponse:
    """
    Analyze diet data from Azure Blob Storage.
    
    Returns:
        - avg_macros: Average macros by diet type
        - top_protein: Top 5 foods with highest protein per diet type
        - cuisine_counts: Most common cuisine per diet type
        - execution_time_ms: Query execution time in milliseconds
    """
    start_time = time.time()

    try:
        # Load environment variables
        connection_string = os.getenv("BLOB_CONNECTION_STRING")
        if not connection_string:
            raise ValueError("BLOB_CONNECTION_STRING is not set")
        
        container_name = os.getenv("BLOB_CONTAINER_NAME", "datasets")
        blob_name = os.getenv("BLOB_FILE_NAME", "All_Diets.csv")

        # Load and process data
        df = _load_df_from_blob(connection_string, container_name, blob_name)
        df = clean_data(df)

        # Calculate analytics
        avg_macros_df = avg_macros_by_diet(df)
        top_protein_df = top_5_protein_by_diet(df)
        cuisine_df = cuisine_counts(df)

        # Format response
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        
        response_data = {
            "avg_macros": _format_avg_macros(avg_macros_df),
            "top_protein": _format_top_protein(top_protein_df),
            "cuisine_counts": _format_cuisine_counts(cuisine_df),
            "execution_time_ms": execution_time_ms
        }

        return func.HttpResponse(
            json.dumps(response_data, indent=2),
            mimetype="application/json",
            status_code=200
        )

    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"error": f"Configuration error: {str(e)}"}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": f"Failed to process diet data: {str(e)}"}),
            mimetype="application/json",
            status_code=500
        )