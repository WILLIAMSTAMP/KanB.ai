FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# If you're in production, use:
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Create required directories if they don't exist
RUN mkdir -p app/logs

# Expose port
EXPOSE 5000

# Command to run the app
CMD ["npm", "start"]