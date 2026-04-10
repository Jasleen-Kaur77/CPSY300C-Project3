import json
from backend.utils.data_cleaning import (
    load_data,
    clean_data,
    avg_macros_by_diet,
    top_5_protein_by_diet,
    cuisine_counts
)

def process_csv(file_path):
    """
    Simulates blob trigger:
    Runs ONLY when CSV file is updated
    """

    print("STEP 1: Loading data...")
    df = load_data(file_path)

    print("STEP 2: Cleaning data...")
    df = clean_data(df)

    print("STEP 3: Calculating insights...")
    avg_macros = avg_macros_by_diet(df)
    top_recipes = top_5_protein_by_diet(df)
    cuisines = cuisine_counts(df)

    print("STEP 4: Saving processed data (cache)...")

    # Save average macros
    with open("data/processed/avg_macros.json", "w") as f:
        json.dump(avg_macros.to_dict(orient="records"), f)

    # Save top recipes
    with open("data/processed/recipes.json", "w") as f:
        json.dump(top_recipes.to_dict(orient="records"), f)

    # Save cluster data (extra insight)
    with open("data/processed/clusters.json", "w") as f:
        json.dump(cuisines.to_dict(orient="records"), f)

    print("Data processed ONCE and stored successfully!")