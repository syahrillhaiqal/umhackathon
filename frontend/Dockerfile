FROM cgr.dev/chainguard/node:latest-dev AS build

WORKDIR /app

# Chainguard images run as non-root by default.
# Ensure the workspace is writable so TypeScript can emit *.tsbuildinfo.
USER root
RUN mkdir -p /app && chown -R 65532:65532 /app
USER 65532

ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend/package.json /app/package.json
COPY frontend/package-lock.json /app/package-lock.json
RUN npm ci

COPY --chown=65532:65532 frontend /app
RUN npm run build

FROM cgr.dev/chainguard/nginx:latest

COPY --from=build --chown=65532:65532 /app/dist /usr/share/nginx/html

EXPOSE 8080
