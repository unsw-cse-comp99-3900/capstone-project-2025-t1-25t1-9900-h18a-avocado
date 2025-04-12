import os
import csv
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, select, func, inspect
from sqlalchemy.orm import sessionmaker
import sys
from datetime import datetime


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
                "all_regions_spi_CMIP6_ssp370_pr_CNRM-ESM2-1.csv"
            ]
        else:
            self.csv_files = csv_files

        self.table_names = []
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.Session = sessionmaker(bind=self.engine)

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
            name_part = filename.replace("all_regions_spi_", "").replace(".csv", "").lower()
            table_name = f"spi_{name_part}"
            self.table_names.append(table_name)

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

                    rows.append({
                        "year": year,
                        "month": month,
                        "SPI": float(row["SPI"]) if row["SPI"] else None,
                        "region_id": int(row["region_id"]),
                        "region_name": row["region_name"],
                        "model_name": row["model_name"]  # ✅ Capture model info
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
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_{model_name.lower()}"
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
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_{model_name.lower()}"
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
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}_{model_name.lower()}"
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


if __name__ == "__main__":
    db_loader = DroughtDatabase()
    db_loader.load_csv_files()
    CMIP5_models = ['CCCma-CanESM2', 'NCC-NorESM1-M', 'CSIRO-BOM-ACCESS1-0', 'MIROC-MIROC5', 'NOAA-GFDL-GFDL-ESM2M']
    CMIP6_models = ['ACCESS-CM2', 'ACCESS-ESM1-5', 'CESM2', 'CNRM-ESM2-1', 'CMCC-ESM2']

