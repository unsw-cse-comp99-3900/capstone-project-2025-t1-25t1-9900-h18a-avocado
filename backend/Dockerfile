# 使用官方 Python 镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 复制 backend 所有内容进容器
COPY . .

# 安装依赖（你需要有 requirements.txt 文件）
RUN pip install --no-cache-dir -r requirements.txt

# 暴露端口（你程序监听的是 9901）
EXPOSE 9901

# 启动 Flask 应用
CMD ["python", "app.py"]
