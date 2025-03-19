from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # 允许跨域请求

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9901, debug=True)
