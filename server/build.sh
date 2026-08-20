set -e  # Exit on error

echo "🚀 Starting SCSP build process..."

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run Django migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create cache table
echo "💾 Creating cache table..."
python manage.py createcachetable

# Create superuser if needed (optional)
# echo "👤 Creating superuser..."
# python manage.py createsuperuser --noinput --email admin@example.com || true

echo "✅ Build completed successfully!"

# Verify Django installation
python -c "import django; print(f'Django {django.get_version()}')"