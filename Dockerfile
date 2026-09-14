FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
ARG NGINX_BACKEND=confeitto-backend
RUN sed -i "s|http://confeitto-backend:3001|http://${NGINX_BACKEND}:3001|g" /etc/nginx/conf.d/default.conf
EXPOSE 80
