import os
import csv
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, select, func, inspect
from sqlalchemy.orm import sessionmaker
import sys
from datetime import datetime


class DroughtDatabase:
    def __init__(self, db_url="sqlite:///drought_system.db", csv_files=None):
        """
        初始化数据库连接、元数据和 CSV 文件列表。
        默认使用 SQLite 数据库，生成的数据库文件 drought_system.db 会在当前工作目录下创建。
        """
        self.engine = create_engine(db_url)
        self.metadata = MetaData()
        if csv_files is None:
            self.csv_files = [
                "all_regions_spi_CMIP5_rcp45_pr.csv",
                "all_regions_spi_CMIP5_rcp85_pr.csv",
                "all_regions_spi_CMIP6_ssp126_pr.csv",
                "all_regions_spi_CMIP6_ssp370_pr.csv"
            ]
        else:
            self.csv_files = csv_files
        self.table_names = []  # 存储所有生成的表名
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.Session = sessionmaker(bind=self.engine)

    def load_csv_files(self):
        """
        遍历 CSV 文件，读取数据，将 time 字段拆分为 year 和 month，
        并将数据插入到对应的表中。表名根据 CSV 文件名动态生成。
        如果表已存在且有数据，则跳过导入。
        """
        inspector = inspect(self.engine)

        for filename in self.csv_files:
            file_path = os.path.join(self.base_path, filename)
            print(f"📥 Loading: {filename}")

            # 生成表名，例如 "all_regions_spi_CMIP5_rcp45_pr.csv" -> "spi_cmip5_rcp45"
            name_part = filename.replace("all_regions_spi_", "").replace("_pr.csv", "").lower()
            table_name = f"spi_{name_part}"
            self.table_names.append(table_name)

            # 检查表是否存在以及是否已有数据
            existing_tables = inspector.get_table_names()
            if table_name in existing_tables:
                table = Table(table_name, self.metadata, autoload_with=self.engine)
                with self.engine.connect() as conn:
                    count = conn.execute(select(func.count()).select_from(table)).scalar()
                    if count and count > 0:
                        print(f"⚠️ Table {table_name} already has {count} records. Skipping import.")
                        continue

            # 定义表结构，将 time 拆分为 year 和 month 两列
            table = Table(
                table_name, self.metadata,
                Column("id", Integer, primary_key=True, autoincrement=True),
                Column("year", Integer),
                Column("month", Integer),
                Column("SPI", Float),
                Column("region_id", Integer),
                Column("region_name", String(100))
            )

            # 创建表（如果不存在）
            self.metadata.create_all(self.engine, tables=[table])

            rows = []
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    time_str = row["time"]  # 格式例如 "1960-01"
                    try:
                        year_str, month_str = time_str.split('-')
                        year = int(year_str)
                        month = int(month_str)
                    except Exception as e:
                        print(f"Parse time {time_str} failed: {e}")
                        continue
                    rows.append({
                        "year": year,
                        "month": month,
                        "SPI": float(row["SPI"]) if row["SPI"] else None,
                        "region_id": int(row["region_id"]),
                        "region_name": row["region_name"]
                    })

            with self.engine.connect() as conn:
                conn.execute(table.insert(), rows)
                conn.commit()
            print(f"✅ Load success: {table_name}")

        print("✅ All data loaded to drought_system.db database.")

    # 其他方法保持不变...
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

    def get_drought_month_count_for_region(self, index, data_source, scenario, start_year, end_year, region_id, threshold=-1.0):
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}"
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

    def get_drought_events_for_region(self, index, data_source, scenario, start_year, end_year, region_id, threshold=-1.0):
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}"
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

    def get_drought_months_details_for_region(self, index, data_source, scenario, start_year, end_year, region_id, threshold=-1.0):
        table_name = f"{index.lower()}_{data_source.lower()}_{scenario.lower()}"
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

    # 示例：获取模型 "rcp45" 的区域信息
    regions_rcp45 = db_loader.get_regions_for_model("rcp45")
    print("Regions for model rcp45:")
    for region in regions_rcp45:
        print(region)

    # 示例：统计模型 "spi_cmip6_ssp370" 中 region_id 为 3050，
    # 在 2030 到 2060 年期间的干旱独立月份数（SPI < -1.0）
    index = "spi"
    data_source = "cmip6"
    scenario = "ssp370"
    region_id = 3050
    drought_months = db_loader.get_drought_month_count_for_region(index, data_source, scenario, 2030, 2060, region_id, threshold=-1.0)
    print(f"Drought months count  for region {region_id} from 2030 to 2060: {drought_months}")

    # 示例：获取指定 region 在模型 "spi_cmip6_ssp370" 中，
    # 在 2030 到 2060 年期间的所有干旱月份 (year, month)
    drought_details = db_loader.get_drought_months_details_for_region(index, data_source, scenario, 2030, 2060, region_id,
                                                                      threshold=-1.0)
    print(f"Drought months details for region {region_id} from 2030 to 2060:")
    for y, m in drought_details:
        print(f"{y}-{m:02d}")

    # 示例：统计并列出模型 "spi_cmip6_ssp370" 中 region_id 为 3050，
    # 在 2030 到 2060 年期间的干旱事件（连续干旱月为一个事件，单月不计）
    drought_events = db_loader.get_drought_events_for_region(index, data_source, scenario, 2030, 2060, region_id, threshold=-1.0)
    print(f"Drought events for region {region_id} from 2030 to 2060:")
    for event in drought_events:
        print(event)
