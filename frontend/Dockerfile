# build stage
FROM node:18 AS build

WORKDIR /app
COPY . .
RUN npm install && npm run build

# deploy stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]