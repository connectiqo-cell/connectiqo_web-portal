pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        // Must match the project name of the currently running app, so Jenkins
        // updates the existing container instead of colliding with it on the
        // fixed container_name. Compose defaults an unset project name to the
        // directory it's run from — confirmed on the VPS via `docker ps`,
        // where the already-running image is tagged connectiqo_web-portal-app
        // (that's ~/connectiqo_web-portal, Compose's <project>-<service> tag).
        COMPOSE_PROJECT_NAME = 'connectiqo_web-portal'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Load Environment') {
            steps {
                // docker-compose.yml's ${VAR} substitution (both build.args and
                // the runtime environment: block) reads from a .env file next to
                // it. That file is gitignored, so a clean checkout has none —
                // without this stage, docker compose build would silently bake
                // empty strings into the NEXT_PUBLIC_* values.
                //
                // Create a Jenkins "Secret file" credential (Manage Jenkins ->
                // Credentials) whose content is the production .env — same
                // format as the one already deployed on the VPS, containing
                // NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                // SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SENTRY_DSN,
                // SENTRY_AUTH_TOKEN — then set its ID below.
                withCredentials([file(credentialsId: 'connectiqo-env-prod', variable: 'ENV_FILE')]) {
                    sh 'cp "$ENV_FILE" .env'
                }
            }
        }

        stage('Validate') {
            steps {
                // Fails early if docker-compose.yml has a syntax error
                sh 'docker compose config --quiet'
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build --pull'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d --remove-orphans'
                sh 'docker compose ps'
            }
        }

        stage('Health Check') {
            steps {
                // Curling the app's own port from here doesn't work: Jenkins
                // runs as its own container (talking to the host's Docker
                // daemon over a mounted socket), so "127.0.0.1" here is
                // Jenkins's loopback, not the VPS host's — and the app is
                // deliberately bound to the host's 127.0.0.1 only, per
                // docker-compose.yml. Asking Docker for the container's own
                // healthcheck status sidesteps that entirely, since Docker
                // computes it from inside the container regardless of which
                // network namespace is asking.
                retry(6) {
                    sleep 10
                    script {
                        def status = sh(
                            script: "docker inspect --format='{{.State.Health.Status}}' connectweb",
                            returnStdout: true,
                        ).trim()
                        if (status != 'healthy') {
                            error "Container health status: ${status}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployed build #${env.BUILD_NUMBER} successfully."
        }
        failure {
            echo 'Deployment failed. Container logs:'
            sh 'docker compose logs --tail=50 || true'
        }
        always {
            // Remove dangling images left behind by rebuilds to save disk space
            sh 'docker image prune -f || true'
            // .env holds production secrets in plaintext — don't leave it
            // sitting in the workspace between builds.
            sh 'rm -f .env'
        }
    }
}
