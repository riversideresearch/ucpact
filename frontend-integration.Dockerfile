# First we will build the webapp
FROM node:25.2.1 AS buildstage
ARG ENVFILES_DIR="."

WORKDIR /frontend-build

# Copy in the files we need
COPY package*.json .
COPY jest.config.js .

# Install dependencies
RUN npm install

# Copy over the other files we need
COPY ./public ./public
COPY ./src ./src
COPY ${ENVFILES_DIR}/.env* .

CMD npm start