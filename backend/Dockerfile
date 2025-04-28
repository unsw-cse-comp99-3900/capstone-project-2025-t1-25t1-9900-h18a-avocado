# User: python:3.10-slim
FROM python:3.10-slim

# set working directory
WORKDIR /app

# copy all files from backend to /app in the container
COPY . .

# install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# expose port 9901
EXPOSE 9901

# start Flask app
CMD ["python", "app.py"]