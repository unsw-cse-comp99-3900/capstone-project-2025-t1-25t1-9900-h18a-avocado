from flask import Flask, request, jsonify, send_file
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from services.mysql_test import DroughtDatabase  # 从 services/mysql_test.py 导入类

# 创建 Flask 应用
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# 创建 Flask-RESTX API 对象，用于生成 Swagger 文档
api = Api(app,
          version="1.0",
          title="Drought Data API",
          description="API for calculating drought statistics based on SPI data")

ns = api.namespace("drought", description="Drought statistics operations")

# 定义请求模型（请求体参数）
drought_request_model = api.model("DroughtRequest", {
    "index": fields.String(required=True, description="系数名称，例如 spi "),
    "data_source": fields.String(required=True, description="数据源名称，例如 CMIP5"),
    "scenario": fields.String(required=True, description="气候条件名称，例如 rcp45"),
    "start_year": fields.Integer(required=True, description="起始年份 (包含)"),
    "end_year": fields.Integer(required=True, description="结束年份 (包含)"),
    "region_id": fields.Integer(required=True, description="指定的区域 ID"),
    "threshold": fields.Float(required=False, default=-1.0, description="SPI 阈值（默认 -1.0）")
})
scenario_model = api.model("ScenarioRequest", {
    "scenario": fields.String(required=True, description="气候条件名称，例如 rcp45")
})
# 创建 DroughtDatabase 对象并加载 CSV 数据（注意：首次运行会导入数据）
db_loader = DroughtDatabase()
db_loader.load_csv_files()

@ns.route("/drought-month-count")
class DroughtMonthCount(Resource):
    @ns.doc("get_drought_month_count", description="统计指定区域在指定年份范围内满足 SPI < threshold 的干旱独立月份数")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        data_source = data.get("data_source")
        scenario = data.get("scenario")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        count = db_loader.get_drought_month_count_for_region(index, data_source, scenario, start_year, end_year, region_id, threshold)
        return {"success": True, "drought_month_count": count}

@ns.route("/drought-months-details")
class DroughtMonthsDetails(Resource):
    @ns.doc("get_drought_months_details", description="返回指定区域在指定年份范围内满足 SPI < threshold 的所有干旱月份（格式 'YYYY-MM'）")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        scenario = data.get("scenario")
        data_source = data.get("data_source")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        details = db_loader.get_drought_months_details_for_region(index, data_source, scenario, start_year, end_year, region_id, threshold)
        details_formatted = [f"{y}-{m:02d}" for (y, m) in details]
        return {"success": True, "drought_months_details": details_formatted}

@ns.route("/drought-event-count")
class DroughtEventCount(Resource):
    @ns.doc("get_drought_event_count", description="统计指定区域在指定年份范围内的干旱事件数量（连续 ≥2 个月算作一个事件），并返回事件的起始和结束时间")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        scenario = data.get("scenario")
        data_source = data.get("data_source")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        events = db_loader.get_drought_events_for_region(index, data_source, scenario, start_year, end_year, region_id, threshold)
        return {"success": True, "drought_events": events}

@ns.route("/regions")
class Regions(Resource):
    @ns.doc("get_regions", description="返回所有数据表中不同的区域信息（region_id 和 region_name）")
    @ns.expect(scenario_model)
    def post(self):
        data = request.get_json()
        scenario = data.get("scenario")
        regions_list = db_loader.get_regions_for_model(scenario)
        return {"success": True, "regions": regions_list}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9901, debug=True)
