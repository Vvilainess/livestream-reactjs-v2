# --- Giai đoạn 1: Build ứng dụng React ---
FROM node:20 AS build

WORKDIR /app

COPY package.json ./
# Bạn cũng có thể cần copy package-lock.json
# COPY package-lock.json ./ 

RUN npm install

COPY . .

RUN npm run build

# --- Giai đoạn 2: Serve ứng dụng bằng Nginx ---
FROM nginx:stable-alpine

# Sao chép file cấu hình Nginx tự tạo vào container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép các file đã build từ giai đoạn 'build' vào thư mục của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

# Lệnh để khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]