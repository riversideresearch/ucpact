# First we will build the webapp
FROM node:25.2.1 AS buildstage
ARG ENVFILES_DIR="."

WORKDIR /webapp-build

# Copy in the files we need
COPY public/ public
COPY src/ src
COPY scripts/ scripts
COPY package.json .
COPY jest.config.js .
COPY ${ENVFILES_DIR}/.env* .

# Install dependencies
RUN npm install

# Run tests
#RUN CI=true npm test

# Do the build
RUN npm run build

# Setup Nginx
FROM nginx

# Copy over the static html content previously built
COPY --from=buildstage /webapp-build/build/ /usr/share/nginx/html
