#!/bin/bash

# Exit on error
set -e

echo "Real Screen Reader - Uninstall Script"
echo "===================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to confirm action
confirm() {
    local prompt="$1"
    local response
    
    echo -n "$prompt [y/N] "
    read -r response
    
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Parse command line arguments
REMOVE_DOCKER=false
REMOVE_DATA=true  # Now true by default
FORCE=false
KEEP_DATA=false   # New flag to keep data if requested

while [[ $# -gt 0 ]]; do
    case $1 in
        --remove-docker)
            REMOVE_DOCKER=true
            shift
            ;;
        --keep-data)
            KEEP_DATA=true
            REMOVE_DATA=false
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --remove-docker    Also remove Docker and Docker Desktop"
            echo "  --keep-data        Keep application data (by default, data is removed)"
            echo "  -f, --force        Don't ask for confirmation"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Show warning about data removal
if [ "$REMOVE_DATA" = true ] && [ "$FORCE" = false ]; then
    echo "⚠️  WARNING: This will remove all application data including:"
    echo "   - Configuration files"
    echo "   - Cached files"
    echo "   - Voice models"
    echo "   - Temporary files"
    echo ""
    echo "   Use --keep-data to keep your data"
    echo ""
    if ! confirm "Do you want to continue?"; then
        echo "Uninstallation cancelled."
        exit 0
    fi
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run this script as root"
    exit 1
fi

# Stop and remove containers
if command_exists docker; then
    echo "Stopping and removing Docker containers..."
    cd "$PROJECT_ROOT" || exit 1
    
    if [ -f docker-compose.yml ]; then
        docker-compose down --volumes --remove-orphans || true
    fi
    
    # Remove any remaining containers with our image
    if docker images | grep -q "real-screen-reader"; then
        docker rmi $(docker images | grep "real-screen-reader" | awk '{print $3}') || true
    fi
fi

# Remove temporary files
echo "Removing temporary files..."
rm -rf /tmp/real-screen-reader-test /tmp/real-screen-reader-tts 2>/dev/null || true

# Remove data if requested
if [ "$REMOVE_DATA" = true ]; then
    if [ "$FORCE" = true ] || confirm "Are you sure you want to remove all data files?"; then
        echo "Removing data directories..."
        
        # Remove application data
        if [[ "$OSTYPE" == "darwin"* ]]; then
            rm -rf ~/Library/Application\ Support/Real\ Screen\ Reader 2>/dev/null || true
        else
            rm -rf ~/.config/real-screen-reader 2>/dev/null || true
        fi
        
        # Remove cached files
        rm -rf ~/.cache/real-screen-reader 2>/dev/null || true
        
        # Remove voice models
        rm -rf "$PROJECT_ROOT/resources/voices/"*.onnx 2>/dev/null || true
        
        echo "All data files have been removed"
    fi
fi

# Remove Docker if requested
if [ "$REMOVE_DOCKER" = true ]; then
    if [ "$FORCE" = true ] || confirm "Are you sure you want to remove Docker?"; then
        echo "Removing Docker..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew uninstall --cask docker || true
            fi
        else
            if command_exists apt-get; then
                sudo apt-get remove -y docker docker.io docker-compose containerd runc || true
            elif command_exists dnf; then
                sudo dnf remove -y docker docker-compose || true
            elif command_exists yum; then
                sudo yum remove -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || true
            fi
            
            # Remove Docker group
            if getent group docker >/dev/null; then
                sudo groupdel docker || true
            fi
            
            # Remove Docker files
            sudo rm -rf /var/lib/docker /etc/docker /var/run/docker.sock 2>/dev/null || true
        fi
        
        echo "Docker has been removed"
    fi
fi

echo "Uninstallation complete!"
echo ""
echo "To reinstall:"
echo "1. Run: ./scripts/install.sh"
echo ""
echo "For a complete fresh start (including Docker):"
echo "./scripts/uninstall.sh --remove-docker"
echo "./scripts/install.sh"
echo ""
echo "To keep your data during uninstall:"
echo "./scripts/uninstall.sh --keep-data" 