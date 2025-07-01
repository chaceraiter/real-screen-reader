#!/bin/bash

# Exit on any error
set -e

echo "Real Screen Reader - Installation Script"
echo "======================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to verify downloads
verify_download() {
    local url="$1"
    local expected_hash="$2"
    local temp_file
    temp_file=$(mktemp)
    
    if curl -sSL "$url" -o "$temp_file"; then
        local actual_hash
        actual_hash=$(sha256sum "$temp_file" | cut -d' ' -f1)
        if [ "$actual_hash" = "$expected_hash" ]; then
            cat "$temp_file"
            rm "$temp_file"
            return 0
        fi
    fi
    rm "$temp_file"
    return 1
}

# Function to check system requirements
check_requirements() {
    echo "Checking system requirements..."
    
    # Check disk space (need at least 2GB free)
    local free_space
    if [[ "$OSTYPE" == "darwin"* ]]; then
        free_space=$(df -k / | awk 'NR==2 {print $4}')
    else
        free_space=$(df -k / | awk 'NR==2 {print $4}')
    fi
    if [ "$free_space" -lt 2097152 ]; then  # 2GB in KB
        echo "Error: Not enough disk space. Need at least 2GB free."
        exit 1
    fi

    # Check for X11 on Linux
    if [[ "$OSTYPE" != "darwin"* ]]; then
        if ! command_exists xhost; then
            echo "Error: X11 is required but not found. Please install X11 or a desktop environment."
            exit 1
        fi
        
        if [ -z "$DISPLAY" ]; then
            echo "Error: No display found. Please run this in a graphical environment."
            exit 1
        fi
    fi

    # Check internet connection using multiple reliable endpoints
    echo "Checking internet connection..."
    local endpoints=("1.1.1.1" "8.8.8.8" "9.9.9.9")
    local connected=false
    
    for endpoint in "${endpoints[@]}"; do
        if ping -c 1 "$endpoint" >/dev/null 2>&1; then
            connected=true
            break
        fi
    done
    
    if ! "$connected"; then
        echo "Error: No internet connection. Please check your network."
        exit 1
    fi
}

# Function to install Docker on Mac
install_docker_mac() {
    if ! command_exists brew; then
        echo "Installing Homebrew..."
        # Homebrew install script hash (update this regularly)
        local brew_hash="e5c8eab9e7e694b03f0d526f58b7d86cd2c1f5c80e56af7c7bd6e0f4d1c1f2d"
        local brew_url="https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
        
        if ! verify_download "$brew_url" "$brew_hash" | bash; then
            echo "Error: Homebrew installation script verification failed"
            exit 1
        fi
        
        # Add Homebrew to PATH for the current session
        eval "$(/opt/homebrew/bin/brew shellenv)" || eval "$(/usr/local/bin/brew shellenv)"
    fi

    if ! command_exists docker; then
        echo "Installing Docker Desktop for Mac..."
        if ! brew install --cask docker; then
            echo "Please download and install Docker Desktop manually from:"
            echo "https://www.docker.com/products/docker-desktop"
            echo "After installation, press Enter to continue..."
            read -r
        fi
    fi
}

# Function to install Docker on Linux
install_docker_linux() {
    if command_exists apt-get; then
        # Ubuntu/Debian
        echo "Installing Docker using apt..."
        sudo apt-get update || { echo "Failed to update package list"; exit 1; }
        sudo apt-get install -y docker.io docker-compose || { echo "Failed to install Docker"; exit 1; }
        sudo systemctl enable --now docker || { echo "Failed to enable Docker service"; exit 1; }
    elif command_exists dnf; then
        # Fedora
        echo "Installing Docker using dnf..."
        sudo dnf -y install docker docker-compose || { echo "Failed to install Docker"; exit 1; }
        sudo systemctl enable --now docker || { echo "Failed to enable Docker service"; exit 1; }
    elif command_exists yum; then
        # CentOS/RHEL
        echo "Installing Docker using yum..."
        sudo yum install -y yum-utils || { echo "Failed to install yum-utils"; exit 1; }
        # Verify Docker's GPG key
        local key_url="https://download.docker.com/linux/centos/gpg"
        local expected_fingerprint="060A 61C5 1B55 8A7F 742B 77AA C52F EB6B 621E 9F35"
        if ! curl -fsSL "$key_url" | sudo gpg --import --fingerprint | grep -q "$expected_fingerprint"; then
            echo "Error: Docker GPG key verification failed"
            exit 1
        fi
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo || { echo "Failed to add Docker repository"; exit 1; }
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || { echo "Failed to install Docker"; exit 1; }
        sudo systemctl enable --now docker || { echo "Failed to enable Docker service"; exit 1; }
    else
        echo "Could not detect package manager. Please install Docker manually."
        exit 1
    fi
}

# Check system requirements first
check_requirements

# Install Docker based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Setting up for macOS..."
    install_docker_mac
else
    echo "Setting up for Linux..."
    install_docker_linux
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Starting Docker service..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Please start Docker Desktop manually."
        echo "1. Look for the Docker Desktop icon in your menu bar"
        echo "2. If it's not running, launch Docker Desktop from your Applications folder"
        echo "3. Wait until the Docker icon shows it's running (whale icon)"
        echo "After Docker Desktop is running, press Enter to continue..."
        read -r
    else
        sudo systemctl start docker || { echo "Failed to start Docker service"; exit 1; }
    fi
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Setting up Real Screen Reader..."

# Build and start the container
cd "$PROJECT_ROOT" || { echo "Failed to change directory"; exit 1; }

# Configure X11 for Linux with restricted access
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Configuring X server access..."
    # Only allow local connections from the container
    xhost -
    xhost +local:docker || { echo "Failed to configure X server access"; exit 1; }
fi

# Export user ID for container
export UID GID

# Start the application
echo "Starting Real Screen Reader..."
if ! docker-compose up --build -d; then
    echo "Failed to start the application. Check the logs with: docker-compose logs"
    exit 1
fi

echo "==============================================="
echo "Real Screen Reader is now running!"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "Important notes for Mac users:"
    echo "1. Make sure Docker Desktop is running (check menu bar)"
    echo "2. If you don't see the application window:"
    echo "   - Check Docker Desktop dashboard for container status"
    echo "   - View logs with: docker-compose logs"
    echo "3. To stop: Use Docker Desktop or run 'docker-compose down'"
else
    echo "To access the application:"
    echo "1. Wait a few moments for everything to start"
    echo "2. The application window should appear automatically"
fi
echo ""
echo "Common commands:"
echo "- Stop application:  docker-compose down"
echo "- View logs:        docker-compose logs -f"
echo "- Restart:          docker-compose restart"
echo ""
echo "If you encounter any issues:"
echo "1. Check the logs:    docker-compose logs"
echo "2. Restart Docker:    Restart Docker Desktop (Mac) or 'sudo systemctl restart docker' (Linux)"
echo "3. Rebuild:           docker-compose up --build -d"
echo "===============================================" 