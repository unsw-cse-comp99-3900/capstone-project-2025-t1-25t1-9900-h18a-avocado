import os
import csv
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, select, func, inspect
from sqlalchemy.orm import sessionmaker
import json
import sys
from datetime import datetime

region_ids = [
    1030, 1040, 1060, 1100, 5040, 5050, 5060, 6010, 6020, 6030,
    7010, 4020, 4030, 4010, 4040, 4080, 4070, 4050, 9010, 9020,
    9030, 3150, 1010, 1020, 2010, 2020, 2030, 2080, 2090, 3010,
    3020, 3040, 3060, 3070, 3080, 3100, 3110, 3130, 3140, 5010,
    5020, 5030, 1050, 1070, 1080, 1090, 1110, 2040, 2050, 2060,
    2070, 2100, 3030, 3050, 3090, 3120, 5070, 4060
]
class DroughtDatabase:
    def __init__(self, db_url="sqlite:///drought_system.db", csv_files=None):
        """
        initialize the database connection and load CSV files to the database.
        :param db_url: the database URL, default is "sqlite:///drought_system.db"
        :param csv_files: a list of CSV file names, default is None, which means all CSV files in the same directory will be loaded.
        """
        self.engine = create_engine(db_url)
        self.metadata = MetaData()
        if csv_files is None:
            self.csv_files = [
                "all_regions_spi_CMIP5_rcp45_pr_CCCma-CanESM2.csv",
                "all_regions_spi_CMIP5_rcp45_pr_CSIRO-BOM-ACCESS1-0.csv",
                "all_regions_spi_CMIP5_rcp45_pr_MIROC-MIROC5.csv",
                "all_regions_spi_CMIP5_rcp45_pr_NCC-NorESM1-M.csv",
                "all_regions_spi_CMIP5_rcp45_pr_NOAA-GFDL-GFDL-ESM2M.csv",
                "all_regions_spi_CMIP5_rcp85_pr_CCCma-CanESM2.csv",
                "all_regions_spi_CMIP5_rcp85_pr_CSIRO-BOM-ACCESS1-0.csv",
                "all_regions_spi_CMIP5_rcp85_pr_MIROC-MIROC5.csv",
                "all_regions_spi_CMIP5_rcp85_pr_NCC-NorESM1-M.csv",
                "all_regions_spi_CMIP5_rcp85_pr_NOAA-GFDL-GFDL-ESM2M.csv",
                "all_regions_spi_CMIP6_ssp126_pr_ACCESS-CM2.csv",
                "all_regions_spi_CMIP6_ssp126_pr_ACCESS-ESM1-5.csv",
                "all_regions_spi_CMIP6_ssp126_pr_CESM2.csv",
                "all_regions_spi_CMIP6_ssp126_pr_CMCC-ESM2.csv",
                "all_regions_spi_CMIP6_ssp126_pr_CNRM-ESM2-1.csv",
                "all_regions_spi_CMIP6_ssp370_pr_ACCESS-CM2.csv",
                "all_regions_spi_CMIP6_ssp370_pr_ACCESS-ESM1-5.csv",
                "all_regions_spi_CMIP6_ssp370_pr_CESM2.csv",
                "all_regions_spi_CMIP6_ssp370_pr_CMCC-ESM2.csv",
                "all_regions_spi_CMIP6_ssp370_pr_CNRM-ESM2-1.csv",
                # -----------------------------------------------
                "all_regions_spei_CMIP5_rcp45_pr_CCCma-CanESM2.csv",
                "all_regions_spei_CMIP5_rcp45_pr_CSIRO-BOM-ACCESS1-0.csv",
                "all_regions_spei_CMIP5_rcp45_pr_MIROC-MIROC5.csv",
                "all_regions_spei_CMIP5_rcp45_pr_NCC-NorESM1-M.csv",
                "all_regions_spei_CMIP5_rcp45_pr_NOAA-GFDL-GFDL-ESM2M.csv",
                "all_regions_spei_CMIP5_rcp85_pr_CCCma-CanESM2.csv",
                "all_regions_spei_CMIP5_rcp85_pr_CSIRO-BOM-ACCESS1-0.csv",
                "all_regions_spei_CMIP5_rcp85_pr_MIROC-MIROC5.csv",
                "all_regions_spei_CMIP5_rcp85_pr_NCC-NorESM1-M.csv",
                "all_regions_spei_CMIP5_rcp85_pr_NOAA-GFDL-GFDL-ESM2M.csv",
                "all_regions_spei_CMIP6_ssp126_pr_ACCESS-CM2.csv",
                "all_regions_spei_CMIP6_ssp126_pr_ACCESS-ESM1-5.csv",
                "all_regions_spei_CMIP6_ssp126_pr_CESM2.csv",
                "all_regions_spei_CMIP6_ssp126_pr_CMCC-ESM2.csv",
                "all_regions_spei_CMIP6_ssp126_pr_CNRM-ESM2-1.csv",
                "all_regions_spei_CMIP6_ssp370_pr_ACCESS-CM2.csv",
                "all_regions_spei_CMIP6_ssp370_pr_ACCESS-ESM1-5.csv",
                "all_regions_spei_CMIP6_ssp370_pr_CESM2.csv",
                "all_regions_spei_CMIP6_ssp370_pr_CMCC-ESM2.csv",
                "all_regions_spei_CMIP6_ssp370_pr_CNRM-ESM2-1.csv"
            ]
        else:
            self.csv_files = csv_files

        self.table_names = []
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.cache = {}
        self.cache_file = "cache.json"
        self.load_cache()
        self.Session = sessionmaker(bind=self.engine)

    def load_cache(self):
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
                print("✅ Cache loaded from file.")
            except Exception as e:
                print(f"⚠️ Failed to load cache: {e}")

    def save_cache(self):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.cache, f)
            print("✅ Cache saved to file.")
        except Exception as e:
            print(f"⚠️ Failed to save cache: {e}")

    def load_csv_files(self):
        """
        Load all CSV files defined in self.csv_files.
        Each CSV file contains SPI time series for different regions and a specific model.
        The function creates corresponding tables (one per CSV), parses time into year/month,
        and includes the model name. If the table already exists and has data, it skips re-import.
        """
        inspector = inspect(self.engine)

        for filename in self.csv_files:
            file_path = os.path.join(self.base_path, filename)
            print(f"📥 Loading: {filename}")

            # Generate table name based on file name
            # Example: "all_regions_spi_CMIP5_rcp45_pr_CCCma-CanESM2.csv" -> "spi_cmip5_rcp45_pr_cccma-canesm2"
            if filename.startswith("all_regions_spi_"):
                index_prefix = "spi"
                name_part = filename.replace("all_regions_spi_", "").replace(".csv", "").lower()
            elif filename.startswith("all_regions_spei_"):
                index_prefix = "spei"
                name_part = filename.replace("all_regions_spei_", "").replace(".csv", "").lower()
            else:
                print(f"⛔️ Unrecognized filename format: {filename}")
                continue

            table_name = f"{index_prefix}_{name_part}"

            # Skip if the table already exists and contains data
            existing_tables = inspector.get_table_names()
            if table_name in existing_tables:
                table = Table(table_name, self.metadata, autoload_with=self.engine)
                with self.engine.connect() as conn:
                    count = conn.execute(select(func.count()).select_from(table)).scalar()
                    if count and count > 0:
                        print(f"⚠️ Table {table_name} already has {count} records. Skipping import.")
                        continue

            # Define table structure with additional "model_name" column
            table = Table(
                table_name, self.metadata,
                Column("id", Integer, primary_key=True, autoincrement=True),
                Column("year", Integer),
                Column("month", Integer),
                Column("SPI", Float),
                Column("region_id", Integer),
                Column("region_name", String(100)),
                Column("model_name", String(100))
            )

            # Create the table if not exists
            self.metadata.create_all(self.engine, tables=[table])

            rows = []
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    time_str = row["time"]  # Expected format: "YYYY-MM"
                    try:
                        year_str, month_str = time_str.split('-')
                        year = int(year_str)
                        month = int(month_str)
                    except Exception as e:
                        print(f"⛔️ Failed to parse time '{time_str}': {e}")
                        continue

                    value_field = "SPI" if "SPI" in row else "SPEI"
                    spi_value = row.get(value_field, None)
                    rows.append({
                        "year": year,
                        "month": month,
                        "SPI": float(spi_value) if spi_value else None,  # SPEI still name SPI
                        "region_id": int(row["region_id"]),
                        "region_name": row["region_name"],
                        "model_name": row["model_name"]
                    })

            # Insert data into the table
            with self.engine.connect() as conn:
                conn.execute(table.insert(), rows)
                conn.commit()

            print(f"✅ Load success: {table_name}")

        print("✅ All data loaded to drought_system.db database.")


    def get_regions_for_model(self, model_identifier):
        regions = {}
        with self.engine.connect() as conn:
            for table_name in self.table_names:
                if model_identifier.lower() in table_name:
                    table = Table(table_name, self.metadata, autoload_with=self.engine)
                    stmt = select(table.c.region_id, table.c.region_name).distinct()
                    result = conn.execute(stmt).mappings()
                    for row in result:
                        regions[row['region_id']] = row['region_name']
        return [{"region_id": rid, "region_name": rname} for rid, rname in regions.items()]

    def get_drought_month_count_for_region(self, index, data_source, scenario, model_name, start_year, end_year, region_id, threshold=-1.0):
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_pr_{model_name.lower()}"

        table = Table(table_name, self.metadata, autoload_with=self.engine)
        session = self.Session()
        stmt = select(func.count(func.distinct((table.c.year * 100) + table.c.month))).where(
            table.c.year.between(start_year, end_year),
            table.c.SPI < threshold,
            table.c.region_id == region_id
        )
        count = session.execute(stmt).scalar()
        session.close()
        return count if count is not None else 0

    def get_drought_events_for_region(self, index, data_source, scenario, model_name,start_year, end_year, region_id, threshold=-1.0):

        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_pr_{model_name.lower()}"
        table = Table(table_name, self.metadata, autoload_with=self.engine)
        session = self.Session()
        stmt = select(table.c.year, table.c.month).where(
            table.c.year.between(start_year, end_year),
            table.c.region_id == region_id,
            table.c.SPI < threshold
        ).order_by(table.c.year.asc(), table.c.month.asc())
        results = session.execute(stmt).fetchall()
        session.close()

        drought_months = []
        for row in results:
            y, m = row[0], row[1]
            month_index = y * 12 + (m - 1)
            drought_months.append((month_index, y, m))
        drought_months.sort(key=lambda x: x[0])

        events = []
        if not drought_months:
            return events

        current_event = [drought_months[0]]
        for i in range(1, len(drought_months)):
            current = drought_months[i]
            previous = drought_months[i - 1]
            if current[0] == previous[0] + 1:
                current_event.append(current)
            else:
                if len(current_event) >= 2:
                    start_event = current_event[0]
                    end_event = current_event[-1]
                    events.append({
                        "start": {"year": start_event[1], "month": start_event[2]},
                        "end": {"year": end_event[1], "month": end_event[2]}
                    })
                current_event = [current]
        if len(current_event) >= 2:
            start_event = current_event[0]
            end_event = current_event[-1]
            events.append({
                "start": {"year": start_event[1], "month": start_event[2]},
                "end": {"year": end_event[1], "month": end_event[2]}
            })
        return events

    def get_drought_months_details_for_region(self, index, data_source, scenario, model_name, start_year, end_year, region_id, threshold=-1.0):
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_pr_{model_name.lower()}"
        table = Table(table_name, self.metadata, autoload_with=self.engine)
        session = self.Session()
        stmt = select(table.c.year, table.c.month).where(
            table.c.year.between(start_year, end_year),
            table.c.region_id == region_id,
            table.c.SPI < threshold
        ).distinct().order_by(table.c.year.asc(), table.c.month.asc())
        results = session.execute(stmt).fetchall()
        session.close()
        return [(row[0], row[1]) for row in results]

    def get_total_drought_months_for_regions(self, index, data_source, scenario, start_year, end_year, threshold=-1.0):



        # 确定要查的表名
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_pr"

        if "cmip5" in data_source.lower():
            model_names = ['cccma-canesm2', 'ncc-noresm1-m', 'csiro-bom-access1-0', 'miroc-miroc5',
                           'noaa-gfdl-gfdl-esm2m']
        else:
            model_names = ['access-cm2', 'access-esm1-5', 'cesm2', 'cnrm-esm2-1', 'cmcc-esm2']

        session = self.Session()
        drought_counts = {rid: [] for rid in region_ids}

        for model in model_names:
            full_table_name = f"{table_name}_{model}"

            try:
                table = Table(full_table_name, self.metadata, autoload_with=self.engine)
            except Exception as e:
                print(f"⚠️ Warning: Failed to load table {full_table_name}: {e}")
                continue

            stmt = (
                select(
                    table.c.region_id,
                    func.count().label("drought_months")
                )
                .where(
                    table.c.year.between(start_year, end_year),
                    table.c.SPI < threshold,
                    table.c.region_id.in_(region_ids)
                )
                .group_by(table.c.region_id)
            )

            result = session.execute(stmt).fetchall()

            for row in result:
                region_id = row[0]
                drought_months = row[1]
                if region_id in drought_counts:
                    drought_counts[region_id].append(drought_months)

        session.close()

        final_result = []
        for rid in region_ids:
            counts = drought_counts[rid]
            if counts:
                avg_count = sum(counts) / len(counts)
                final_result.append(avg_count)
            else:
                final_result.append(0)

        return final_result

    def get_total_drought_events_for_regions(self, index, data_source, scenario, start_year, end_year, threshold=-1.0):

        cache_key = f"{index}_{data_source}_{scenario}_{start_year}_{end_year}_{threshold}_event"
        if cache_key in self.cache:
            return self.cache[cache_key]

        drought_summary = []

        models_cmip5 = ['CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M']
        models_cmip6 = ['ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2']

        models = models_cmip5 if data_source.lower() == "cmip5" else models_cmip6

        for region_id in region_ids:
            total_events = 0
            for model_name in models:
                table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_pr_{model_name.lower()}"
                table = Table(table_name, self.metadata, autoload_with=self.engine)
                session = self.Session()
                stmt = select(table.c.year, table.c.month).where(
                    table.c.year.between(start_year, end_year),
                    table.c.region_id == region_id,
                    table.c.SPI < threshold
                ).order_by(table.c.year.asc(), table.c.month.asc())
                results = session.execute(stmt).fetchall()
                session.close()

                drought_months = []
                for row in results:
                    y, m = row[0], row[1]
                    month_index = y * 12 + (m - 1)
                    drought_months.append(month_index)
                drought_months.sort()

                # 统计干旱事件（连续2个月及以上）
                if not drought_months:
                    continue

                event_count = 0
                current_event = [drought_months[0]]
                for i in range(1, len(drought_months)):
                    if drought_months[i] == drought_months[i - 1] + 1:
                        current_event.append(drought_months[i])
                    else:
                        if len(current_event) >= 2:
                            event_count += 1
                        current_event = [drought_months[i]]

                if len(current_event) >= 2:
                    event_count += 1

                total_events += event_count

            # 5个模型求平均
            drought_summary.append(round(total_events / 5, 2))

        self.cache[cache_key] = drought_summary
        self.save_cache()

        return drought_summary

if __name__ == "__main__":
    db_loader = DroughtDatabase()
    db_loader.load_csv_files()
    CMIP5_models = ['CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M']
    CMIP6_models = ['ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2']


