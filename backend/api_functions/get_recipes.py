import json
import sys
sys.path.append(".")

def get_recipes():
    """
    Returns precomputed recipes data (FAST)
    """

    try:
        with open("data/processed/recipes.json") as f:
            data = json.load(f)

        print("Returning cached recipes data")
        return data

    except FileNotFoundError:
        print("Error: Data not processed yet")
        return {"error": "Data not processed yet. Run processing first."}