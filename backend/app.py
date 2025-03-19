import random

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":  # 处理预检请求
        return jsonify({"success": True, "message": "Preflight request successful"}), 200

# 定义 12 种情况的 54 维返回数据
response_mapping = {}

# 生成 12 种情况的随机数据（示例）
definitions = ["Change in Number", "Change in Length"]
timeframes = ["2020-2059", "2040-2079", "2060-2099"]
sources = ["CMIP5", "CMIP6"]

for definition in definitions:
    for timeframe in timeframes:
        for source in sources:
            key = (definition, timeframe, source)
            # 确保存入 response_mapping 的值都是 Python int 类型
            response_mapping[key] = [int(x) for x in np.random.choice([0, 1, 2], size=54)]
#========================================
# 生成 1-58 号区域的数据映射
region_data = {}

# 干旱事件变化的可能性权重
drought_change_labels = ["increase", "decrease", "no change", "unclear"]
drought_change_weights = [0.4, 0.4, 0.15, 0.05]

for region_id in range(1, 59):  # 1 到 58
    key = str(region_id)
    region_data[key] = [
        round(random.uniform(4, 8), 2),  # 平均干旱月份数 (4~8)
        round(random.uniform(6, 36), 2),  # 平均干旱持续时间 (6~36 个月)
        random.choices(drought_change_labels, weights=drought_change_weights)[0],  # 干旱事件变化
        round(random.uniform(-30, 40), 2)  # 干旱持续时间变化（%）
    ]
#============================================================================================
@app.route('/drought-data', methods=['POST'])
def get_data():
    try:
        # 获取前端 JSON 数据
        data = request.get_json()

        # 打印接收到的数据（查看格式）
        print("Received JSON from frontend:", data)

        # 解析 JSON 数据
        definition = data["Definition"]  # "Change in Number" or "Change in Length"
        timeframe = data["Time Frames"]  # "2020-2059", "2040-2079", "2060-2099"
        source = data["Source"]  # "CMIP5" or "CMIP6"

        # 生成 key 并查找返回值
        key = (definition, timeframe, source)
        response_data = response_mapping.get(key, ["No Data Available"])

        return jsonify({"success": True, "message": "Data received", "received_data": response_data})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
#===============================================================================================

@app.route('/region-table', methods=['POST', 'OPTIONS'])
def get_region_data():
    if request.method == "OPTIONS":  # 预检请求
        return jsonify({"success": True, "message": "Preflight request successful"}), 200
    
    try:
        data = request.get_json()
        region_id = str(data.get("region_id"))  # 确保是字符串

        if region_id not in region_data:
            return jsonify({"success": False, "message": "Invalid regionId"}), 400

        return jsonify({"success": True, "region_id": region_id, "data": region_data[region_id]})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9901, debug=True)
