pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    CI_ENV_FILE_CREDENTIALS_ID = 'ibc-tools-ci-env'   // Secret file (.env)
    DOCKERHUB_CREDENTIALS_ID   = 'dockerhub-creds'    // Usuario + Access Token Docker Hub
    DOCKER_REGISTRY            = 'docker.io'
  }

  stages {
    stage('Imprimir nombre de la rama') {
      steps { echo "Rama actual: ${env.BRANCH_NAME}" }
    }

    stage('Cargar .env (Secret file)') {
      steps {
        withCredentials([file(credentialsId: env.CI_ENV_FILE_CREDENTIALS_ID, variable: 'CI_ENV_FILE')]) {
          sh '''
            set -eu

            if [ ! -s "$CI_ENV_FILE" ]; then
              echo "[ERROR] El Secret file (.env) está vacío o no existe: $CI_ENV_FILE" >&2
              exit 1
            fi

            # Sanitiza y exporta KEY=VALUE
            SANITIZED_ENV="$(mktemp)"
            awk 'BEGIN{OFS="="} /^[[:space:]]*#/ || /^[[:space:]]*$/ {next} {
                 line=$0
                 pos=index(line, "=")
                 if (pos==0) next
                 key=substr(line,1,pos-1)
                 val=substr(line,pos+1)
                 sub(/^[[:space:]]+/, "", key); sub(/[[:space:]]+$/, "", key)
                 sub(/^[[:space:]]+/, "", val); sub(/[[:space:]]+$/, "", val)
                 print key, val
               }' "$CI_ENV_FILE" > "$SANITIZED_ENV"

            set -a
            . "$SANITIZED_ENV"
            set +a
            rm -f "$SANITIZED_ENV"

            echo "[OK] Variables del .env cargadas."
          '''
        }
      }
    }

    stage('Preparar metadatos de imagen') {
      steps {
        script {
          def namespace  = (env.DOCKERHUB_NAMESPACE ?: '').trim()
          def repository = (env.DOCKERHUB_REPOSITORY ?: '').trim()
          if (!namespace || !repository) {
            error """Faltan variables requeridas para Docker Hub:
- DOCKERHUB_NAMESPACE
- DOCKERHUB_REPOSITORY

Defínelas en tu .env (Secret file)."""
          }

          def registry  = (env.DOCKER_REGISTRY ?: 'docker.io').trim()
          def imageRepo = "${registry}/${namespace}/${repository}"
          def tag       = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : (env.BUILD_NUMBER ?: 'latest')

          env.IMAGE_REPO = imageRepo
          env.IMAGE_TAG  = tag

          echo "Imagen objetivo: ${env.IMAGE_REPO}:${env.IMAGE_TAG}"
        }
      }
    }

    stage('Docker Build') {
      steps {
        script {
          def buildArgs = sh(
            script: '''env | awk -F= '/^NEXT_PUBLIC_/ {printf "--build-arg %s=%s ", $1, $2}' ''',
            returnStdout: true
          ).trim()

          if (buildArgs) {
            echo "Pasando a docker build: ${buildArgs}"
          } else {
            echo "[INFO] No se detectaron variables NEXT_PUBLIC_* en el entorno."
          }

          sh """
            set -eu
            docker build ${buildArgs} -t "${IMAGE_REPO}:${IMAGE_TAG}" -t "${IMAGE_REPO}:latest" .
          """
        }
      }
    }

    stage('Push a Docker Hub (solo main)') {
      when { branch 'main' }
      steps {
        withCredentials([usernamePassword(
          credentialsId: env.DOCKERHUB_CREDENTIALS_ID,
          usernameVariable: 'DOCKERHUB_USERNAME',
          passwordVariable: 'DOCKERHUB_TOKEN'
        )]) {
          sh '''
            set -eu
            echo "$DOCKERHUB_TOKEN" | docker login "${DOCKER_REGISTRY}" -u "$DOCKERHUB_USERNAME" --password-stdin
            docker push "${IMAGE_REPO}:${IMAGE_TAG}"
            docker push "${IMAGE_REPO}:latest"
            docker logout || true
          '''
        }
      }
    }
  }

  post {
    success {
      echo "✅ Éxito: ${env.IMAGE_REPO}:${env.IMAGE_TAG}"
      echo "👉 docker pull ${env.IMAGE_REPO}:${env.IMAGE_TAG}"
    }
    failure {
      echo "❌ Falló el pipeline"
    }
  }
}