import pymysql
import csv
import os

# 数据库连接信息
conn = pymysql.connect(
    host="localhost",
    user="root",
    password="yourpassword"
)
cursor = conn.cursor()

# 创建数据库和使用
cursor.execute("CREATE DATABASE IF NOT EXISTS drought_system")
cursor.execute("USE drought_system")

# 要导入的 CSV 文件路径（按需修改）
csv_files = [
    "all_regions_spi_CMIP5_rcp45_pr.csv",
    "all_regions_spi_CMIP5_rcp85_pr.csv",
    "all_regions_spi_CMIP6_ssp126_pr.csv",
    "all_regions_spi_CMIP6_ssp370_pr.csv"
]

# 基础路径
services_path = os.path.dirname(os.path.abspath(__file__))

for filename in csv_files:
    file_path = os.path.join(services_path, filename)
    print(f"📥 导入中: {filename}")

    # 生成表名，如 CMIP5_rcp45 -> spi_cmip5_rcp45
    name_part = filename.replace("all_regions_spi_", "").replace("_pr.csv", "").lower()
    table_name = f"spi_{name_part}"

    # 创建表（如果不存在）
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            time VARCHAR(10),
            SPI FLOAT,
            region_id INT,
            region_name VARCHAR(100)
        )
    """)

    # 读取并插入数据
    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute(f"""
                INSERT INTO {table_name} (time, SPI, region_id, region_name)
                VALUES (%s, %s, %s, %s)
            """, (
                row["time"],
                float(row["SPI"]) if row["SPI"] else None,
                int(row["region_id"]),
                row["region_name"]
            ))

    print(f"✅ 导入完成: {table_name}")

conn.commit()
cursor.close()
conn.close()
print("✅ 所有数据已分表导入到 drought_system 数据库中")
