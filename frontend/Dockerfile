FROM node:20-alpine AS development

WORKDIR /app

COPY .npmrc* ./
COPY package.json package-lock.json* ./

RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 10 && \
    npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM node:20-alpine AS builder
WORKDIR /app
COPY .npmrc* ./
COPY package.json package-lock.json* ./
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
