import sys
import os

# Allow imports from project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.blob_trigger.process_csv_function import process_csv

print("=== RUNNING CSV PROCESSING TEST ===")

process_csv("All_Diets.csv")

print("=== PROCESSING COMPLETE ===")