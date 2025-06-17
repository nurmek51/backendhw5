# V2V-Agent (Voice-to-Voice AI Assistant)

This project sets up a Voice-to-Voice AI Assistant with a FastAPI backend, PostgreSQL database, Redis for caching and Celery for background tasks, and a React frontend.

## Project Structure

- `backend/`: Contains the FastAPI application, Dockerfile, and Python dependencies.
- `frontend/`: Contains the React application and its related files.
- `docker-compose.yml`: Defines and orchestrates all the services (Postgres, Redis, Backend API, Celery Worker, Celery Beat, Frontend).

## Getting Started

Follow these steps to set up and run the application using Docker Compose.

### 1. Environment Variables (`.env` file)

**CRITICAL:** Create a file named `.env` in the **root directory** of your project (`/home/nurmek/Desktop/backendhw4/V2V-Agent/`). This file will contain sensitive information and configurations. **Replace the placeholder values with your actual credentials.**

```
POSTGRES_DB=your_database_name
POSTGRES_USER=your_database_user
POSTGRES_PASSWORD=your_database_password
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URLS=http://localhost:80,http://localhost:8000 # Ensure http://localhost:80 is included for the frontend
GCS_BUCKET_NAME=your_google_cloud_storage_bucket_name
```

**Important Note on OpenAI API Key:**
The `OPENAI_API_KEY` is required for the voice-to-voice (V2V) AI functionality. If this key is expired, invalid, or you exceed your quota, the V2V features will **not** work. However, the rest of the application (A2A chat, basic CRUD operations, file uploads if GCS is configured) should still function. Please ensure you have a valid and active OpenAI API key for full functionality. If you do not provide one, the voice chat will gracefully inform the client of the missing key.

### 2. Run with Docker Compose

Navigate to the **root directory** of your project (`/home/nurmek/Desktop/backendhw4/V2V-Agent/`) in your terminal and run the following command to build and start all services:

```bash
docker-compose up --build -d
```

This command will:

- Build the Docker images for both the backend and frontend applications.
- Start all defined services (Postgres, Redis, FastAPI, Celery Worker, Celery Beat, Frontend) in detached mode.

### 3. Access the Application

Once all services are up and running:

- **Backend API Documentation (FastAPI):** Access your API documentation at `http://localhost:8000/docs`
- **Frontend Application:** Access the web application at `http://localhost:80`

## Stopping the Application

To stop all running services and remove their containers, networks, and volumes (for a clean restart), run the following command from the root directory:

```bash
docker-compose down -v
```

## Level 3: Deployment to a Virtual Machine

To deploy your application to a virtual machine (VM), you'll typically follow these steps:

1.  **Prepare your VM:**

    - Ensure your VM is running a Linux distribution (e.g., Ubuntu).
    - Install Docker and Docker Compose on your VM. Follow the official Docker documentation for the most up-to-date installation instructions.
    - Open necessary firewall ports (e.g., 80 for frontend, 8000 for backend API, 5432 for Postgres, 6379 for Redis, if directly exposed).

2.  **Transfer your project:**

    - Copy your entire `V2V-Agent` project directory to your VM. You can use `scp` or `rsync`:
      ```bash
      scp -r /home/nurmek/Desktop/backendhw4/V2V-Agent user@your_vm_ip:/path/on/vm/
      ```

3.  **Set up Environment Variables on the VM:**

    - Navigate to the root directory of your project on the VM (`/path/on/vm/V2V-Agent/`).
    - Create a `.env` file with your actual production credentials. **Do not commit this file to your public repository!**

    ```
    POSTGRES_DB=your_production_database_name
    POSTGRES_USER=your_production_database_user
    POSTGRES_PASSWORD=your_production_database_password
    OPENAI_API_KEY=your_production_openai_api_key
    FRONTEND_URLS=http://your_vm_ip:80,http://your_vm_ip:8000
    ```

4.  **Run the application on the VM:**

    - From the root directory of your project on the VM, run Docker Compose:
      ```bash
      docker-compose up --build -d
      ```
      This will build the images (if not already built and pulled from a registry) and start all services.

5.  **Access your deployed application:**
    - Backend API Documentation: `http://your_vm_ip:8000/docs`
    - Frontend Application: `http://your_vm_ip:80`

**Note on Production Deployment:**
For a true production environment, you would typically use a reverse proxy like Nginx, manage SSL certificates, implement proper logging, and use a more robust secrets management system instead of a `.env` file directly on the VM for sensitive data.

## moi openai api key zakonchilsya, poetomu na deploye ni4ego ne budet rabotat'

## vstav'te svoi apikey i kaifuite B-)
