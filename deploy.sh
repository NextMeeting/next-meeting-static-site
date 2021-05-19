export $(egrep -v '^#' ./.env | xargs)

gulp build

echo "🌀 Uploading..."
# Deploy assets and HTML template to S3
aws s3 cp ./dist/ s3://$S3_BUCKET --recursive --profile=$AWS_UPLOAD_PROFILE

echo "🌀 Rebuilding site..."
# Trigger an immediate rebuild of the static site
# with the updated assets
curl https://fmzbvioi44.execute-api.us-east-1.amazonaws.com/default/next-meeting-regenerate-schedule
echo "✅ Deploy complete"