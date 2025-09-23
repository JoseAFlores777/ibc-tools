pipeline {
	agent any
  options { timestamps() }

  environment {
		CI_ENV_FILE_CREDENTIALS_ID = 'ibc-tools-ci-env'
    DOCKERHUB_CREDENTIALS_ID   = 'dockerhub-creds'
    DOCKER_REGISTRY            = 'docker.io'
  }

  stages {
		stage('Imprimir nombre de la rama') { steps { echo "Rama actual: ${env.BRANCH_NAME}" } }

    stage('Cargar .env (Secret file)') {
			steps {
				withCredentials([file(credentialsId: env.CI_ENV_FILE_CREDENTIALS_ID, variable: 'CI_ENV_FILE')]) {
					sh '''
            set -eu
            if [ ! -s "$CI_ENV_FILE" ]; then
              echo "[ERROR] Secret file vacío o inexistente: $CI_ENV_FILE" >&2
              exit 1
            fi
            awk 'BEGIN{OFS="="} /^[[:space:]]*#/ || /^[[:space:]]*$/ {next} {
                 line=$0; pos=index(line, "="); if (pos==0) next
                 key=substr(line,1,pos-1); val=substr(line,pos+1)
                 sub(/^[[:space:]]+/, "", key); sub(/[[:space:]]+$/, "", key)
                 sub(/^[[:space:]]+/, "", val); sub(/[[:space:]]+$/, "", val)
                 print key, val
               }' "$CI_ENV_FILE" > .ci_env_sanitized
            echo "[OK] .env saneado a .ci_env_sanitized"
          '''
        }
      }
    }

    stage('Preparar metadatos de imagen') {
			steps {
				script {
					def props = readProperties file: '.ci_env_sanitized'
          def ns  = (props['DOCKERHUB_NAMESPACE']  ?: '').trim()
          def repo= (props['DOCKERHUB_REPOSITORY'] ?: '').trim()
          if (!ns || !repo) {
						error "Faltan DOCKERHUB_NAMESPACE / DOCKERHUB_REPOSITORY en el Secret file (.env)."
          }
          def registry  = (env.DOCKER_REGISTRY ?: 'docker.io').trim()
          def imageRepo = "${registry}/${ns}/${repo}"
          def tag       = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : (env.BUILD_NUMBER ?: 'latest')
          writeFile file: '.ci_runtime_env', text: "IMAGE_REPO=${imageRepo}\nIMAGE_TAG=${tag}\nDOCKER_REGISTRY=${registry}\n"
          echo "Imagen objetivo: ${imageRepo}:${tag}"
        }
      }
    }

    stage('Docker Build') {
			agent { docker { image 'docker:27.1.2-cli'; args '-v /var/run/docker.sock:/var/run/docker.sock'; reuseNode true } }
      steps {
				script {
					def files = ['.ci_env_sanitized', '.ci_runtime_env']
          def pairs = []
          files.each { f -> if (fileExists(f)) { readProperties(file: f).each { k,v -> pairs << "${k}=${v}" } } }
          withEnv(pairs) {
						def buildArgs = sh(script: '''env | awk -F= '/^NEXT_PUBLIC_/ {printf "--build-arg %s=%s ", $1, $2}' ''', returnStdout: true).trim()
            if (buildArgs) { echo "Pasando a docker build: ${buildArgs}" } else { echo "[INFO] No se detectaron variables NEXT_PUBLIC_*." }
            sh """
              set -eu
              docker build ${buildArgs} -t "${IMAGE_REPO}:${IMAGE_TAG}" -t "${IMAGE_REPO}:latest" .
            """
          }
        }
      }
    }

    stage('Push a Docker Hub (solo main)') {
			agent { docker { image 'docker:27.1.2-cli'; args '-v /var/run/docker.sock:/var/run/docker.sock'; reuseNode true } }
      when { branch 'main' }
      steps {
				script {
					def files = ['.ci_env_sanitized', '.ci_runtime_env']
          def pairs = []
          files.each { f -> if (fileExists(f)) { readProperties(file: f).each { k,v -> pairs << "${k}=${v}" } } }
          withEnv(pairs) {
						withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_TOKEN')]) {
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
    }

    stage('Trigger redeploy en Dokploy') {
      when { branch 'main' }
      steps {
        withCredentials([string(credentialsId: 'IBC_TOOLS_DOKPLOY_WEBHOOK_URL', variable: 'IBC_TOOLS_DOKPLOY_WEBHOOK_URL')]) {
          sh '''
            set -eu
            echo "[INFO] Dokploy: redeploy con force=true y pull=true..."

            payload='{"force":true,"pull":true}'
            code=$(curl -sS -o /tmp/dokploy_resp.txt -w "%{http_code}" \
              -X POST "$IBC_TOOLS_DOKPLOY_WEBHOOK_URL" \
              -H "Content-Type: application/json" \
              --data "$payload")

            echo "[INFO] Respuesta Dokploy (HTTP $code):"
            cat /tmp/dokploy_resp.txt || true

            if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
              echo "[ERROR] Dokploy devolvió HTTP $code" >&2
              exit 1
            fi
            echo "[OK] Redeploy (force+pull) solicitado correctamente."
          '''
        }
      }
    }

  }

  post {
		success {
			script {
				def p = fileExists('.ci_runtime_env') ? readProperties(file: '.ci_runtime_env') : [:]
        echo "✅ Éxito: ${p['IMAGE_REPO'] ?: 'repo?'}:${p['IMAGE_TAG'] ?: 'tag?'}"
      }
    }
    failure { echo "❌ Falló el pipeline" }
  }
}