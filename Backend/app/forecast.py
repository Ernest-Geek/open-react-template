from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error
import traceback

forecast_bp = Blueprint('forecast', __name__)

# Load and prepare the dataset once
df = pd.read_csv("mother_table_hv_01_2025.csv")  # Replace with your actual dataset path
df['extraction_date'] = pd.to_datetime(df['extraction_date'])
df['year'] = df['year'].astype(str)
df['car_type'] = df['manufacturer'] + "" + df['model'] + "" + df['year']

@forecast_bp.route("/forecast", methods=["GET"])
def forecast_price():
    try:
        # Get input parameters
        manufacturer = request.args.get("manufacturer")
        model = request.args.get("model")
        year = request.args.get("year")

        if not all([manufacturer, model, year]):
            return jsonify({"error": "Missing manufacturer, model, or year"}), 400

        car_type = f"{manufacturer}{model}{year}"

        # Filter the relevant group
        group = df[df['car_type'] == car_type]

        if group.empty:
            return jsonify({"error": f"No data available for car type: {car_type}"}), 404

        # Time series preparation
        ts = group.set_index('extraction_date').resample('MS')['price'].mean().dropna()

        if len(ts) < 12:
            return jsonify({"error": f"Not enough data for {car_type} (only {len(ts)} months)"}), 400

        # Train-test split
        train = ts[:-6]
        test = ts[-6:]

        # Fit ARIMA and forecast
        model = ARIMA(train, order=(1,2,1))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=3)
        forecast.index = pd.date_range(start=test.index[-1] + pd.DateOffset(months=1), periods=3, freq='MS')

        # Calculate RMSE
        rmse = np.sqrt(mean_squared_error(test[:3], forecast[:3])) if len(test) >= 3 else None

        # Return result
        forecast_result = {date.strftime("%B-%Y"): round(price, 2) for date, price in forecast.items()}

        return jsonify({
            "car_type": car_type,
            "forecast": forecast_result
        })

    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@forecast_bp.route("/dropdown_data", methods=["GET"])
def get_dropdown_data():
    try:
        manufacturer = request.args.get("manufacturer")  # Filter by manufacturer
        model = request.args.get("model")  # Filter by model
        year = request.args.get("year")  # Filter by year

        # Start by fetching the full list (ensuring there are no NaN values)
        manufacturers = df['manufacturer'].dropna().unique().tolist()
        models = df['model'].dropna().unique().tolist()
        years = df['year'].dropna().unique().tolist()

        # Filter based on manufacturer
        if manufacturer:
            models = df[df['manufacturer'] == manufacturer]['model'].dropna().unique().tolist()

        # Filter based on model
        if model:
            years = df[df['model'] == model]['year'].dropna().unique().tolist()

        # Ensure all items are strings and return the results
        manufacturers = [str(m) for m in manufacturers if isinstance(m, str)]
        models = [str(m) for m in models if isinstance(m, str)]
        years = [str(y) for y in years if isinstance(y, str)]

        return jsonify({
            "manufacturers": manufacturers,
            "models": models,
            "years": years
        })

    except Exception as e:
        print(f"Error: {str(e)}")  # Logs error in terminal
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

