pipeline {
    agent any
    
    environment {
        REPO_URL = 'https://github.com/Nischith7102005/certisure.git'
        BRANCH_NAME = 'main'
        // Use a deployment path that doesn't require sudo
        DEPLOY_PATH = "${WORKSPACE}/deployment"
    }
    
    options {
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '5'))
        disableConcurrentBuilds()
    }
    
    stages {
        stage('🔄 GitHub Checkout') {
            steps {
                echo "📥 Cloning repository: ${env.REPO_URL}"
                script {
                    try {
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: "*/${env.BRANCH_NAME}"]],
                            extensions: [],
                            userRemoteConfigs: [[url: env.REPO_URL]]
                        ])
                        echo "✅ Successfully checked out branch: ${env.BRANCH_NAME}"
                    } catch (Exception e) {
                        error("❌ Failed to checkout repository: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('📋 Verify Files') {
            steps {
                echo "📋 Verifying project files..."
                script {
                    try {
                        // Check if required files exist
                        def requiredFiles = ['index.html', 'issuer.html', 'verify.html']
                        def allFilesExist = true
                        
                        requiredFiles.each { file ->
                            if (!fileExists(file)) {
                                echo "❌ Missing required file: ${file}"
                                allFilesExist = false
                            } else {
                                echo "✅ Found: ${file}"
                            }
                        }
                        
                        if (!allFilesExist) {
                            error("❌ Required files are missing")
                        }
                        
                        // List all files in the project
                        sh 'ls -la'
                        echo "✅ All required files are present"
                    } catch (Exception e) {
                        error("❌ File verification failed: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('✅ HTML Validation') {
            steps {
                echo "🔍 Validating HTML files..."
                script {
                    try {
                        // Try to use tidy if available, otherwise do basic validation
                        sh '''
                            # Check if tidy is available
                            if command -v tidy &> /dev/null; then
                                echo "Using tidy for HTML validation"
                                for file in *.html; do
                                    echo "Validating $file..."
                                    tidy -qe "$file" || echo "⚠️ $file has validation issues"
                                done
                            else
                                echo "Tidy not found, doing basic HTML validation..."
                                # Basic validation - check for basic HTML structure
                                for file in *.html; do
                                    echo "Basic validation for $file..."
                                    if grep -q "<!DOCTYPE html" "$file" && grep -q "</html>" "$file"; then
                                        echo "✅ $file has basic HTML structure"
                                    else
                                        echo "⚠️ $file might be missing basic HTML structure"
                                    fi
                                done
                            fi
                        '''
                        echo "✅ HTML validation completed"
                    } catch (Exception e) {
                        unstable("⚠️ HTML validation had issues: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('🔍 Security Scan') {
            steps {
                echo "🔍 Running security scan on HTML files..."
                script {
                    try {
                        sh '''
                            echo "Checking for security vulnerabilities..."
                            
                            # Check for potentially dangerous patterns
                            echo "Checking for AWS Access Key IDs..."
                            if grep -r "AKIA[0-9A-Z]\\{16\\}" .; then
                                echo "⚠️ WARNING: Potential AWS Access Key ID found"
                            fi
                            
                            echo "Checking for potential secret tokens..."
                            if grep -r "[0-9a-zA-Z/+]\\{40\\}" .; then
                                echo "⚠️ WARNING: Potential secret token found"
                            fi
                            
                            echo "Checking for inline scripts..."
                            if grep -n "javascript:" *.html; then
                                echo "⚠️ WARNING: Found inline javascript: URLs"
                            else
                                echo "✅ No inline javascript: URLs found"
                            fi
                            
                            echo "✅ Security scan completed"
                        '''
                        echo "✅ Security scan completed"
                    } catch (Exception e) {
                        unstable("⚠️ Security scan found issues: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('📱 Responsiveness Check') {
            steps {
                echo "📱 Checking for responsive design elements..."
                script {
                    try {
                        sh '''
                            echo "Checking for viewport meta tag..."
                            if grep -l "viewport" *.html; then
                                echo "✅ Viewport meta tag found in files:"
                                grep -l "viewport" *.html
                            else
                                echo "⚠️ WARNING: No viewport meta tag found"
                            fi
                            
                            echo "Checking for responsive design classes..."
                            if grep -l "md:" *.html; then
                                echo "✅ Responsive design classes found in files:"
                                grep -l "md:" *.html
                            else
                                echo "⚠️ WARNING: No responsive design classes found"
                            fi
                            
                            echo "Responsive breakpoints used:"
                            grep -o "sm:\\|md:\\|lg:\\|xl:" *.html | sort | uniq -c
                            
                            echo "✅ Responsiveness check completed"
                        '''
                        echo "✅ Responsiveness check completed"
                    } catch (Exception e) {
                        echo "⚠️ Responsiveness check had issues: ${e.getMessage()}"
                    }
                }
            }
        }
        
        stage('🔗 Link Validation') {
            steps {
                echo "🔗 Validating internal and external links..."
                script {
                    try {
                        sh '''
                            echo "Checking links in HTML files..."
                            
                            # Extract all links from HTML files
                            grep -ho "href=\\"[^\\"]*\\"" *.html | sort | uniq > links.txt
                            echo "Found $(wc -l < links.txt) unique links"
                            
                            # Check for broken internal links
                            echo "Checking internal links..."
                            while IFS= read -r link; do
                                # Extract URL from href="URL"
                                url=$(echo "$link" | sed 's/href="//; s/"//')
                                
                                # Skip external URLs and mailto links
                                case "$url" in
                                    http*|mailto*|data:*|tel:*)
                                        continue
                                        ;;
                                esac
                                
                                # Remove query parameters and fragments
                                clean_url=$(echo "$url" | cut -d'?' -f1 | cut -d'#' -f1)
                                
                                # Skip empty URLs
                                if [ -z "$clean_url" ]; then
                                    continue
                                fi
                                
                                # Check if the file exists
                                if [ ! -f "$clean_url" ]; then
                                    echo "⚠️ WARNING: Broken link to $clean_url"
                                else
                                    echo "✅ Valid link: $clean_url"
                                fi
                            done < links.txt
                            
                            rm -f links.txt
                            echo "✅ Link validation completed"
                        '''
                        echo "✅ Link validation completed"
                    } catch (Exception e) {
                        unstable("⚠️ Link validation had issues: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('🚀 CD: Deploy') {
            when {
                branch env.BRANCH_NAME
            }
            steps {
                echo "🚀 Deploying CertiSure web application..."
                script {
                    try {
                        sh '''
                            # Create deployment directory
                            mkdir -p ${DEPLOY_PATH}
                            
                            # Create backup of current deployment if it exists
                            if [ -d "${DEPLOY_PATH}" ]; then
                                cp -r ${DEPLOY_PATH} ${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S)
                            fi
                            
                            # Remove old deployment files
                            rm -rf ${DEPLOY_PATH}/*
                            
                            # Copy HTML files to deployment directory
                            cp *.html ${DEPLOY_PATH}/
                            
                            # Create a simple info file
                            echo "CertiSure Web Application" > ${DEPLOY_PATH}/INFO.txt
                            echo "Deployed on: $(date)" >> ${DEPLOY_PATH}/INFO.txt
                            echo "Build: ${BUILD_ID}" >> ${DEPLOY_PATH}/INFO.txt
                            echo "Commit: ${GIT_COMMIT}" >> ${DEPLOY_PATH}/INFO.txt
                            
                            # List deployed files
                            echo "Deployed files:"
                            ls -la ${DEPLOY_PATH}/
                            
                            echo "✅ Deployment completed successfully"
                            echo "🌐 Files deployed to: ${DEPLOY_PATH}"
                        '''
                    } catch (Exception e) {
                        error("❌ Deployment failed: ${e.getMessage()}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo '📊 Pipeline execution completed'
            
            // Archive HTML files for later access
            archiveArtifacts artifacts: '*.html', allowEmptyArchive: true
            
            // Archive deployment files if they exist
            archiveArtifacts artifacts: 'deployment/**/*', allowEmptyArchive: true
            
            // Clean up workspace
            cleanWs()
        }
        
        success {
            echo '✅ CI/CD Pipeline SUCCEEDED'
            
            // Send notification
            script {
                echo "🔔 Notification: Build ${env.BUILD_NUMBER} of ${env.JOB_NAME} succeeded"
                echo "🌐 CertiSure web application deployed successfully"
                echo "📁 Deployment location: ${env.DEPLOY_PATH}"
            }
        }
        
        failure {
            echo '❌ CI/CD Pipeline FAILED'
            
            // Send failure notification
            script {
                echo "🔔 Notification: Build ${env.BUILD_NUMBER} of ${env.JOB_NAME} failed"
            }
        }
        
        unstable {
            echo '⚠️ CI/CD Pipeline UNSTABLE - Some checks failed but pipeline continued'
        }
        
        cleanup {
            echo '🧹 Cleaning up workspace'
        }
    }
}
