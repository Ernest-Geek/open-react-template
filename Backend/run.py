# run.py

from app import create_app

# Create the Flask app
app = create_app()

# Create database tables if they don't exist
with app.app_context():
    from app import db  # Import db here to avoid circular imports
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)


