# 阶段 1: 依赖安装
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# 阶段 2: 构建和运行应用
FROM node:22-alpine
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 暴露应用程序端口
EXPOSE 6119

# 使用非 root 用户运行应用
USER node

# 启动应用
CMD ["npm", "start"]