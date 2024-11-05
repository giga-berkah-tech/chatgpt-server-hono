# Use the official Bun image as the base
FROM bun:latest

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port your Hono app listens on
EXPOSE 3000

CMD ["bun", "run", "seed"]

CMD ["bun", "run", "start"]