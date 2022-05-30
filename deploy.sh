export $(egrep -v '^#' ./.env | xargs)

gulp build

echo "🌀 Uploading..."
# Deploy assets and HTML template to S3
aws s3 cp ./dist/ s3://$S3_BUCKET --recursive --profile=$AWS_UPLOAD_PROFILE

echo "🌀 Rebuilding site..."
# Trigger an immediate rebuild of the static site
# with the updated assets
curl "https://xjat3lkitsqhdth7i3rgah7jpu0zbups.lambda-url.us-east-1.on.aws"
echo "✅ Deploy complete"