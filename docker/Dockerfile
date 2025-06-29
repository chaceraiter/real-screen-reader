FROM continuumio/miniconda3

# Create a non-root user
ARG USER_UID=1000
ARG USER_GID=1000
RUN groupadd -g ${USER_GID} appuser && \
    useradd -u ${USER_UID} -g appuser -s /bin/bash -m appuser

# Install system dependencies with version pinning
RUN apt-get update && apt-get install -y \
    libgtk-3-0=3.24.* \
    libx11-xcb1=2:1.* \
    libxcb1=1.* \
    libxss1=1:1.* \
    libnss3=2:* \
    libasound2=1.* \
    libxtst6=2:1.* \
    libglib2.0-0=2.* \
    ffmpeg=7:* \
    && rm -rf /var/lib/apt/lists/*

# Create conda environment with specific versions
RUN conda create -n screen-reader python=3.10.12 nodejs=20.11.1 npm=10.2.4 -y && \
    echo "conda activate screen-reader" >> /home/appuser/.bashrc

# Set up working directory with proper permissions
WORKDIR /app
RUN chown appuser:appuser /app

# Switch to non-root user
USER appuser

# Copy environment setup files with proper ownership
COPY --chown=appuser:appuser package*.json ./
COPY --chown=appuser:appuser scripts/setup.sh ./scripts/
COPY --chown=appuser:appuser resources/ ./resources/

# Activate conda environment and install dependencies
SHELL ["conda", "run", "-n", "screen-reader", "/bin/bash", "-c"]

# Install npm dependencies with better error handling and audit
RUN npm install --no-optional --audit=true || (echo "Failed to install npm dependencies" && exit 1)

# Create audio test directory with restricted permissions
RUN mkdir -p /tmp/real-screen-reader-test && \
    chmod 755 /tmp/real-screen-reader-test

# Copy the rest of the application with proper ownership
COPY --chown=appuser:appuser . .

# Set up entrypoint script with proper permissions
COPY --chown=appuser:appuser docker/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"] 