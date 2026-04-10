"""
Data analysis module for diet dashboard analytics.

Provides reusable functions for processing and analyzing dietary data,
including macronutrient calculations and cuisine/protein analysis.
"""

import pandas as pd


def load_data(file_path: str) -> pd.DataFrame:
    """
    Load diet data from a local CSV file.
    
    Args:
        file_path (str): Path to the CSV file.
    
    Returns:
        pd.DataFrame: Dataset with renamed columns (Protein, Carbs, Fat, Cuisine).
        
    Raises:
        FileNotFoundError: If file path does not exist.
        pd.errors.ParserError: If file cannot be parsed as CSV.
    """
    data = pd.read_csv(file_path)
    
    # Rename columns for consistent access across functions
    rename_columns = {
        "Protein(g)": "Protein",
        "Carbs(g)": "Carbs",
        "Fat(g)": "Fat",
        "Cuisine_type": "Cuisine",
    }
    data = data.rename(columns=rename_columns)
    return data


def clean_data(data: pd.DataFrame) -> pd.DataFrame:
    """
    Clean dataset by removing rows with missing macronutrient or diet type values.
    
    Args:
        data (pd.DataFrame): Input dataset with columns: Protein, Carbs, Fat, Diet_type.
    
    Returns:
        pd.DataFrame: Cleaned dataset without null values in key columns.
    """
    return data.dropna(subset=["Protein", "Carbs", "Fat", "Diet_type"])


def avg_macros_by_diet(data: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate average macronutrients grouped by diet type.
    
    Args:
        data (pd.DataFrame): Input dataset with columns: Diet_type, Protein, Carbs, Fat.
    
    Returns:
        pd.DataFrame: Average macros per diet type with columns:
                     [Diet_type, Protein, Carbs, Fat]
    """
    return (
        data.groupby("Diet_type")[["Protein", "Carbs", "Fat"]]
        .mean()
        .round(2)
        .reset_index()
    )


def top_5_protein_by_diet(data: pd.DataFrame) -> pd.DataFrame:
    """
    Get top 5 recipes with highest protein content per diet type.
    
    Args:
        data (pd.DataFrame): Input dataset with columns: Recipe_name, Diet_type, Cuisine, Protein.
    
    Returns:
        pd.DataFrame: Top 5 high-protein recipes per diet type, sorted by protein descending.
    """
    return (
        data.sort_values(by="Protein", ascending=False)
        .groupby("Diet_type")
        .head(5)
        .reset_index(drop=True)
    )


def diet_with_most_protein(data: pd.DataFrame) -> tuple:
    """
    Identify which diet type has the highest average protein content.
    
    Args:
        data (pd.DataFrame): Input dataset with columns: Diet_type, Protein.
    
    Returns:
        tuple: (diet_type_name: str, avg_protein_value: float)
    """
    avg_protein = data.groupby("Diet_type")["Protein"].mean()
    top_diet = avg_protein.idxmax()
    return top_diet, round(avg_protein[top_diet], 2)


def cuisine_counts(data: pd.DataFrame) -> pd.DataFrame:
    """
    Count number of recipes per cuisine.
    Returns columns: Cuisine | Count
    """

    return (
        data.groupby("Cuisine")
        .size()
        .reset_index(name="Count")
        .sort_values("Count", ascending=False)
    )
    