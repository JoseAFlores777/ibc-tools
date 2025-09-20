pipeline {
	agent any

  options { timestamps() }

  environment {
		CI_ENV_FILE_CREDENTIALS_ID = 'ibc-tools-ci-env' // Secret file (.env) en Jenkins
    DOCKERHUB_CREDENTIALS_ID = 'dockerhub-creds'  // Usuario + Access Token de Docker Hub
    DOCKER_REGISTRY = 'docker.io'
  }

  stages {
		stage('Imprimir nombre de la rama') {
			steps { echo "Rama actual: ${env.BRANCH_NAME}" }
    }

    stage('Cargar .env (Secret file)') {
			steps {
				withCredentials([file(credentialsId: env.CI_ENV_FILE_CREDENTIALS_ID, variable: 'CI_ENV_FILE')]) {
					// 1) Sanea el .env (elimina comentarios y espacios) y deja pares KEY=VALUE en .ci_env_sanitized
          sh '''
            set -eu
            if [ ! -s "$CI_ENV_FILE" ]; then
              echo "[ERROR] Secret file vacío o inexistente: $CI_ENV_FILE" >&2
              exit 1
            fi
            awk 'BEGIN{OFS="="} /^[[:space:]]*#/ || /^[[:space:]]*$/ {next} {
                 line=$0
                 pos=index(line, "=")
                 if (pos==0) next
                 key=substr(line,1,pos-1)
                 val=substr(line,pos+1)
                 sub(/^[[:space:]]+/, "", key); sub(/[[:space:]]+$/, "", key)
                 sub(/^[[:space:]]+/, "", val); sub(/[[:space:]]+$/, "", val)
                 print key, val
               }' "$CI_ENV_FILE" > .ci_env_sanitized
            echo "[OK] .env saneado a .ci_env_sanitized"
          '''
          // NO escribir en env[...] (bloqueado por sandbox). Solo dejamos el archivo listo.
        }
      }
    }

    stage('Preparar metadatos de imagen') {
			steps {
				script {
					// Lee variables requeridas desde el archivo saneado
          def props = readProperties file: '.ci_env_sanitized'
          def namespace = (props['DOCKERHUB_NAMESPACE'] ?: '').trim()
          def repository = (props['DOCKERHUB_REPOSITORY'] ?: '').trim()
          if (!namespace || !repository) {
						error """Faltan variables para Docker Hub:
- DOCKERHUB_NAMESPACE
- DOCKERHUB_REPOSITORY
Defínelas en tu .env (Secret file)."""
          }
          def registry = (env.DOCKER_REGISTRY ?: 'docker.io').trim()
          def imageRepo = "${registry}/${namespace}/${repository}"
          def tag = env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : (env.BUILD_NUMBER ?: 'latest')

          // Persistimos variables dinámicas para etapas posteriores sin tocar env[...]
          writeFile file: '.ci_runtime_env', text: """
IMAGE_REPO=${imageRepo}
IMAGE_TAG=${tag}
DOCKER_REGISTRY=${registry}
""".trim() + "\n"

          echo "Imagen objetivo: ${imageRepo}:${tag}"
        }
      }
    }

    stage('Docker Build') {
      agent {
        docker {
          image 'docker:27.1.2-cli'
          args  '-v /var/run/docker.sock:/var/run/docker.sock'
          reuseNode true
        }
      }
			steps {
				script {
					// Carga pares K=V desde .ci_env_sanitized y .ci_runtime_env y los inyecta al entorno de ESTA etapa
          def files = ['.ci_env_sanitized', '.ci_runtime_env']
          def pairs = []
          files.each { f ->
            if (fileExists(f)) {
						def p = readProperties file: f
              p.each { k, v -> pairs << "${k}=${v}" }
            }
          }

          withEnv(pairs) {
						// Construye --build-arg para TODAS las NEXT_PUBLIC_*
            def buildArgs = sh(script: '''env | awk -F= '/^NEXT_PUBLIC_/ {printf "--build-arg %s=%s ", $1, $2}' ''', returnStdout: true).trim()
            if (buildArgs) {
							echo "Pasando a docker build: ${buildArgs}"
            } else {
							echo "[INFO] No se detectaron variables NEXT_PUBLIC_*."
            }
            // Wrapper del plugin Docker de Jenkins
            def ctx = "."
            def imgRef = "${IMAGE_REPO}:${IMAGE_TAG}"
            def buildOpts = [buildArgs, ctx].findAll { it && it.trim() }.join(' ')
            echo "Construyendo imagen con docker wrapper: ${imgRef}"
            def app = docker.build(imgRef, buildOpts)
          }
        }
      }
    }

    stage('Push a Docker Hub (solo main)') {
      agent {
        docker {
          image 'docker:27.1.2-cli'
          args  '-v /var/run/docker.sock:/var/run/docker.sock'
          reuseNode true
        }
      }
			when { branch 'main' }
      steps {
				script {
					// Vuelve a cargar variables dinámicas + .env para esta etapa
          def files = ['.ci_env_sanitized', '.ci_runtime_env']
          def pairs = []
          files.each { f ->
            if (fileExists(f)) {
						def p = readProperties file: f
              p.each { k, v -> pairs << "${k}=${v}" }
            }
          }
          withEnv(pairs) {
						withCredentials([usernamePassword(
              credentialsId: env.DOCKERHUB_CREDENTIALS_ID,
              usernameVariable: 'DOCKERHUB_USERNAME',
              passwordVariable: 'DOCKERHUB_TOKEN'
            )]) {
							def imgRef = "${IMAGE_REPO}:${IMAGE_TAG}"
              docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKERHUB_CREDENTIALS_ID) {
								def app = docker.image(imgRef)
                app.push()
                app.push('latest')
              }
            }
          }
        }
      }
    }
  }

  post {
		success {
			script {
				def p = fileExists('.ci_runtime_env') ? readProperties(file: '.ci_runtime_env') : [:]
        def repo = p['IMAGE_REPO'] ?: 'desconocido'
        def tag = p['IMAGE_TAG']  ?: 'desconocido'
        echo "✅ Éxito: ${repo}:${tag}"
        echo "👉 docker pull ${repo}:${tag}"
      }
    }
    failure { echo "❌ Falló el pipeline" }
  }
}