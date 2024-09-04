# First we will build the webapp
FROM node as buildstage
WORKDIR /frontend-build

# Copy in the files we need
COPY package*.json .
COPY jest.config.js .
COPY scripts/ scripts
COPY src/ src

# Install dependencies
RUN npm ci

CMD CI=true npm run test

# Copy over the other files we need
# COPY ./public ./public
# COPY ./src ./src
# COPY .env .

# CMD npm start