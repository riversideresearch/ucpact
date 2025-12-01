# Setup and then serve the backend
FROM python:3.12
WORKDIR /app
COPY requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade pytest
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy over the python files
COPY interpreter_parser.py interpreter_parser.py
COPY backend.py backend.py
COPY test_backend.py test_backend.py
COPY ./tests/ ./tests
COPY ./tests/models/ ./models

# Create a directory for the models to go
# If you want them to persist outside the container
# see the readme for the docker command

# Execute the pytests
# ENTRYPOINT [ "/bin/sh", "python" ]
CMD ["slipcover", "-m", "pytest", "-v", "test_backend.py"]
