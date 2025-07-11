from flask import Blueprint, request, send_file, jsonify
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO

charts_bp = Blueprint('charts', __name__)

# Load and preprocess data
df = pd.read_csv("mother_table_hv_01_2025.csv")
df['extraction_date'] = pd.to_datetime(df['extraction_date'], errors='coerce')
df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')
df.dropna(subset=['extraction_date', 'year'], inplace=True)
df['quantity'] = df.groupby(['region','manufacturer', 'model', 'extraction_date']).cumcount() + 1

def filter_data(region=None, manufacturer=None, model=None, year=None):
    filtered = df.copy()
    if region:
        filtered = filtered[filtered['region'] == region]
    if manufacturer:
        filtered = filtered[filtered['manufacturer'] == manufacturer]
    if model:
        filtered = filtered[filtered['model'] == model]
    if year:
        filtered = filtered[filtered['year'] == int(year)]
    return filtered

def fig_to_png(fig):
    img = BytesIO()
    fig.savefig(img, format='png', bbox_inches='tight')
    plt.close(fig)
    img.seek(0)
    return send_file(img, mimetype='image/png')

@charts_bp.route("/price-over-time")
def price_over_time():
    filtered = filter_data(
        manufacturer=request.args.get("manufacturer"),
        model=request.args.get("model"),
        region=request.args.get("region"),
        year=request.args.get("year")
    )
    if filtered.empty:
        return jsonify({"error": "No data found"}), 404

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(filtered['extraction_date'], filtered['price'], marker='o', color='teal')
    ax.set_title('Price Over Time')
    ax.set_xlabel('extraction_date')
    ax.set_ylabel('Price (GHS)')
    fig.autofmt_xdate()
    return fig_to_png(fig)
