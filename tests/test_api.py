import sys
import os

# Allow imports from project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.api_functions.get_nutrition import get_nutrition
from backend.api_functions.get_recipes import get_recipes

print("=== TESTING NUTRITION API ===")

nutrition = get_nutrition()
print(nutrition[:2])   # print first 2 results

print("\n=== TESTING RECIPES API ===")

recipes = get_recipes()
print(recipes[:2])