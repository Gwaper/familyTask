# --- Build : dépendances, vérification des types, tests, front ---
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm test && npm prune --omit=dev

# --- Exécution : Node lance directement le TypeScript du serveur ---
FROM node:24-slim
ENV NODE_ENV=production \
    PORT=8090 \
    RESET_TIME=03:00 \
    TZ=Europe/Paris \
    DATA_DIR=/data/kanban \
    STATIC_DIR=dist/web
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
USER node
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.ts"]
