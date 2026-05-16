# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/codesync-frontend /usr/share/nginx/html
# If your build output is in a different folder, adjust the path above (e.g., /app/dist/frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
