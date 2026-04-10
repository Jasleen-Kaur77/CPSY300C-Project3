import json
import sys
sys.path.append(".")

def get_nutrition():
    """
    Returns precomputed nutrition data (FAST)
    """

    try:
        with open("data/processed/avg_macros.json") as f:
            data = json.load(f)

        print("Returning cached nutrition data")
        return data

    except FileNotFoundError:
        print("Error: Data not processed yet")
        return {"error": "Data not processed yet. Run processing first."}