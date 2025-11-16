pipeline {
    agent any
    
    stages {
        stage('Validate') {
            steps {
                echo '🔍 Validating HTML files...'
                sh '''
                    # Check required files exist
                    if [ ! -f index.html ] || [ ! -f issuer.html ] || [ ! -f verify.html ]; then
                        echo "❌ Missing HTML files"
                        exit 1
                    fi
                    
                    # Verify basic HTML structure
                    for file in *.html; do
                        if ! grep -q "<!DOCTYPE html>" "$file"; then
                            echo "❌ $file missing DOCTYPE declaration"
                            exit 1
                        fi
                        echo "✓ $file validated"
                    done
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Simulating deployment...'
                sh '''
                    echo "Would deploy to:"
                    echo "1. S3 bucket: s3://certisure-web"
                    echo "2. Server path: /var/www/html"
                    echo "3. GitHub Pages branch: gh-pages"
                    
                    # This is where real deployment commands would go
                    # aws s3 cp *.html s3://certisure-web/
                    # scp *.html user@server:/var/www/html/
                '''
            }
        }
    }
    
    post {
        always {
            echo '✅ Pipeline completed'
        }
    }
}
