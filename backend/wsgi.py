import os
import sys

# Add the project directory to the Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
