# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm ci

# Bundle app source
COPY . .

# Build the project
RUN npm run build

# Run the app when the container launches
CMD [ "npm", "start" ]
