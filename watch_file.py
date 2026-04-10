import time
import os
import sys

sys.path.append(".")

from backend.blob_trigger.process_csv_function import process_csv

FILE = "All_Diets.csv"

last_modified = os.path.getmtime(FILE)

print("Watching CSV file for changes...")

while True:
    current_modified = os.path.getmtime(FILE)

    if current_modified != last_modified:
        print("\nFile changed → Processing STARTED...")
        process_csv(FILE)
        print("Processing DONE\n")

        last_modified = current_modified

    time.sleep(3)