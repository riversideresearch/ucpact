# Setup and then serve the backend
FROM python:3.10
WORKDIR /app
COPY requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy over the python file
COPY backend.py backend.py
COPY reconciliationScript.py reconciliationScript.py

# Create a directory for the models to go
# If you want them to persist outside the container
# see the readme for the docker command
RUN mkdir models

# Execute the backend using gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "-w", "4", "backend:app"]
