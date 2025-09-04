.PHONY: all setup install run clean

VENV_NAME := venv
PYTHON := $(VENV_NAME)/bin/python
PIP := $(VENV_NAME)/bin/pip
REQUIREMENTS := requirements.txt

# Default target
all: setup install

# Setup virtual environment
setup: $(VENV_NAME)/bin/activate

$(VENV_NAME)/bin/activate:
	@echo "Creating virtual environment..."
	python3 -m venv $(VENV_NAME)

# Install dependencies
install: $(VENV_NAME)/bin/activate
	@echo "Installing dependencies..."
	@$(PIP) install --upgrade pip
	@$(PIP) install -r $(REQUIREMENTS)

# Run the FastAPI server
run: $(VENV_NAME)/bin/activate
	@echo "Starting the server..."
	@$(PYTHON) main.py

# Clean the project
clean:
	@echo "Cleaning up..."
	@rm -rf $(VENV_NAME)
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
