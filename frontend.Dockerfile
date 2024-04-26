# First we will build the webapp
FROM node as buildstage
WORKDIR /webapp-build

# Copy in the files we need
COPY public/ public
COPY src/ src
COPY scripts/ scripts
COPY package.json .
COPY jest.config.js .

# Install dependencies
RUN npm install

# Run tests
#RUN CI=true npm test

# Do the build
RUN REACT_APP_SERVER_PREFIX='/api/model' REACT_APP_KC_REALM_NAME="UCPACT-Realm" REACT_APP_KC_CLIENT_ID="uc-pact" REACT_APP_KEYCLOAK_PREFIX="http://localhost:8080" REACT_APP_KC_REDIRECT_URL="http://localhost/" npm run build

# Setup Nginx
FROM nginx

# Copy over the static html content previously built
COPY --from=buildstage /webapp-build/build/ /usr/share/nginx/html
