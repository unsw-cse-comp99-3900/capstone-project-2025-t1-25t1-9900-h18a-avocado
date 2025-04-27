from flask import Flask, request
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from services.mysql_test import DroughtDatabase  #  services/mysql_test.py
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

api = Api(app,
          version="1.0",
          title="Drought Data API",
          description="API for calculating drought statistics based on SPI data")

ns = api.namespace("drought", description="Drought statistics operations")

# define models for request and response
drought_request_model = api.model("DroughtRequest", {
    "index": fields.String(required=True, description="Index name, e.g., spi", default="spi"),
    "data_source": fields.String(required=True, description="Data source, e.g., CMIP5", default="cmip5"),
    "scenario": fields.String(required=True, description="Climate scenario, e.g., rcp45", default="rcp45"),
    "model": fields.String(required=True, description="Model name, e.g. For CMIP5: 'CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M'. For CMIP6: 'ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2'", default="cccma-canesm2"),
    "start_year": fields.Integer(required=True, description="Start year (inclusive)", default=1976),
    "end_year": fields.Integer(required=True, description="End year (inclusive)", default=2005),
    "region_id": fields.Integer(required=True, description="Region ID", default=1030),
    "threshold": fields.Float(required=False, default=-1.0, description="SPI threshold (default -1.0)")
})

drought_request_model_2 = api.model("DroughtRequest2", {
    "index": fields.String(required=True, description="Index name, e.g., spi", default="spi"),
    "data_source": fields.String(required=True, description="Data source, e.g., CMIP5", default="cmip5"),
    "scenario": fields.String(required=True, description="Climate scenario, e.g., rcp45", default="rcp45"),
    "start_year": fields.Integer(required=True, description="Start year (inclusive)", default=1976),
    "end_year": fields.Integer(required=True, description="End year (inclusive)",default=2005),
    "threshold": fields.Float(required=False, default=-1.0, description="SPI threshold (default -1.0)")
})
scenario_model = api.model("ScenarioRequest", {
    "scenario": fields.String(required=True, description="e.g. rcp45")
})

# create a DroughtDatabase instance to load data from CSV files
db_loader = DroughtDatabase()
db_loader.load_csv_files()

@ns.route("/drought-month-count")
class DroughtMonthCount(Resource):
    @ns.doc("get_drought_month_count", description="count the number of drought months in a specified region within a specified year range")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        data_source = data.get("data_source")
        scenario = data.get("scenario")
        model = data.get("model")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        count = db_loader.get_drought_month_count_for_region(index, data_source, scenario, model,start_year, end_year, region_id, threshold)
        return {"success": True, "drought_month_count": count}

@ns.route("/drought-months-details")
class DroughtMonthsDetails(Resource):
    @ns.doc("get_drought_months_details", description="return the details of drought months (format: 'YYYY-MM'）")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        scenario = data.get("scenario")
        data_source = data.get("data_source")
        model = data.get("model")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        details = db_loader.get_drought_months_details_for_region(index, data_source, scenario,model, start_year, end_year, region_id, threshold)
        details_formatted = [f"{y}-{m:02d}" for (y, m) in details]
        return {"success": True, "drought_months_details": details_formatted}

@ns.route("/drought-event-count")
class DroughtEventCount(Resource):
    @ns.doc("get_drought_event_count", description="count drought events (>=2 months)")
    @ns.expect(drought_request_model)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        scenario = data.get("scenario")
        data_source = data.get("data_source")
        model = data.get("model")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        region_id = data.get("region_id")
        threshold = data.get("threshold", -1.0)
        events = db_loader.get_drought_events_for_region(index, data_source, scenario,model, start_year, end_year, region_id, threshold)
        return {"success": True, "drought_events": events}

@ns.route("/regions")
class Regions(Resource):
    @ns.doc("get_regions", description="return all the regions（region_id abd region_name）")
    @ns.expect(scenario_model)
    def post(self):
        data = request.get_json()
        scenario = data.get("scenario")
        regions_list = db_loader.get_regions_for_model(scenario)
        return {"success": True, "regions": regions_list}

@ns.route("/drought-months-summary")
class DroughtMonthsSummary(Resource):
    @ns.doc("get_drought_months_summary", description="return drought month average count across models for predefined regions")
    @ns.expect(drought_request_model_2)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        data_source = data.get("data_source")
        scenario = data.get("scenario")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        threshold = data.get("threshold", -1.0)

        summary = db_loader.get_total_drought_months_for_regions(index, data_source, scenario, start_year, end_year, threshold)

        return {"success": True, "drought_summary": summary}
@ns.route("/drought-event-summary")
class DroughtEventSummary(Resource):
    @ns.doc("get_drought_event_summary", description="get drought event count summary (>=2 months)")
    @ns.expect(drought_request_model_2)
    def post(self):
        data = request.get_json()
        index = data.get("index")
        data_source = data.get("data_source")
        scenario = data.get("scenario")
        start_year = data.get("start_year")
        end_year = data.get("end_year")
        threshold = data.get("threshold", -1.0)

        event_summary = db_loader.get_total_drought_events_for_regions(index, data_source, scenario, start_year, end_year, threshold)
        return {"success": True, "drought_summary": event_summary}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9901, debug=True)
