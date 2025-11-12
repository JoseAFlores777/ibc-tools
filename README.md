This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Variables de Entorno

Configura las variables necesarias para ejecutar la app y para CI/CD.

Aplicación:
- DIRECTUS_URL: URL base del servidor Directus utilizada por el backend de Next.js (Node). Ejemplo: http://localhost:8055
- NEXT_PUBLIC_DIRECTUS_URL: URL pública de Directus expuesta al navegador. Si no se define, se usa DIRECTUS_URL.
- NEXT_PUBLIC_CHATWOOT_BASE_URL: URL base de tu instancia de Chatwoot (se usa para cargar el SDK y en el navegador).
- NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: Token del sitio de Chatwoot para inicializar el widget en el navegador.

CI/CD (Jenkins con Secret file .env):
- DOCKERHUB_NAMESPACE: Namespace/usuario de Docker Hub (p. ej., myorg o myuser).
- DOCKERHUB_REPOSITORY: Nombre del repositorio en Docker Hub (p. ej., ibc-tools).
- DOCKERHUB_USERNAME: Usuario de Docker Hub para login.
- DOCKERHUB_TOKEN: Token/contraseña de Docker Hub para login.
- DOCKER_REGISTRY: Registro de Docker (opcional). Por defecto: docker.io.
- CI_ENV_FILE_CREDENTIALS_ID: (opcional) credentialsId del Secret file .env en Jenkins. Por defecto: ibc-tools-ci-env.

Notas:
- docker-compose.yml carga el archivo .env automáticamente.
- Las variables que empiezan con NEXT_PUBLIC_ se exponen al navegador; no coloques secretos allí.
- En Jenkins, crea una credencial de tipo "Secret file" que contenga un archivo .env con formato KEY=value (sin comillas). El pipeline lo cargará para obtener las credenciales.
- Ya no se usa DOCKERHUB_CREDENTIALS_ID; en su lugar se usan DOCKERHUB_USERNAME y DOCKERHUB_TOKEN desde el Secret file.

### Setup rápido

1. Copia el archivo de ejemplo:
   - cp .env.example .env
2. Edita .env y coloca los valores correctos para tu entorno local (al menos DIRECTUS_URL/NEXT_PUBLIC_DIRECTUS_URL).
3. En Jenkins:
   - Crea una credencial de tipo "Secret file" con un .env que incluya DOCKERHUB_NAMESPACE, DOCKERHUB_REPOSITORY, DOCKERHUB_USERNAME, DOCKERHUB_TOKEN y, opcionalmente, DOCKER_REGISTRY.
   - Asigna el credentialsId ibc-tools-ci-env o define CI_ENV_FILE_CREDENTIALS_ID en Variables Globales para usar otro credentialsId.
