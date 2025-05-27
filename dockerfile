FROM node:20.19.2-alpine

WORKDIR /usr/src/app
COPY package*.json ./
COPY package-lock*.json ./

RUN npm install
COPY . .

EXPOSE 3003