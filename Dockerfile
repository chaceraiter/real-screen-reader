FROM node:20-slim

# Install system dependencies required for Electron
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcb1 \
    libxss1 \
    libnss3 \
    libasound2 \
    libxtst6 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

CMD ["npm", "run", "dev"] 