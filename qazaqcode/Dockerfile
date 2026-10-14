# syntax=docker/dockerfile:1
# QazaqCode Platform: көп сатылы образ (deps -> build -> run), standalone Next.js, non-root.
# ЕСКЕРТУ: Docker демоны әзірлеу ортасында жоқ болғандықтан `docker build` ЖҮРГІЗІЛМЕГЕН (сыналмаған).
# Бірдей қадамдар қолмен орындалып дәлелденген: docs/SECURITY-AUDIT.md «Deployment тексерісі».
# Өндірісте базалық образды digest-пен бекітіңіз: --build-arg NODE_IMAGE=node:22-alpine@sha256:<digest>
ARG NODE_IMAGE=node:22-alpine

# ---------- 1) тәуелділіктер (build үшін devDependencies де керек: tailwind, typescript) ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

# ---------- 2) build ----------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_OUTPUT=standalone: тек іске қосуға қажет файлдар (өндіріс тәуелділіктері трассировкамен таңдалады)
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN npm run build

# ---------- 3) миграция/қызмет құралдары (psql, pg_dump): `docker build --target tools` ----------
FROM ${NODE_IMAGE} AS tools
RUN apk add --no-cache bash postgresql16-client openssl \
 && addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
WORKDIR /app
COPY --chown=app:app db ./db
COPY --chown=app:app scripts ./scripts
USER app
# db/migrate.sh --dev-shim өндірісте ҚОЛДАНЫЛМАЙДЫ (db/migrate.sh өзі қорғайды)
ENTRYPOINT ["bash"]

# ---------- 4) өндіріс образы (әдепкі соңғы саты) ----------
FROM ${NODE_IMAGE} AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
# standalone: server.js + трассировкаланған node_modules + шрифттер (assets/fonts, PDF есептері үшін; next.config.mjs outputFileTracingIncludes)
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
# трассировка шрифтті жіберіп алса да, олар образда болуы тиіс (PDF шрифтсіз 500 береді)
COPY --from=build --chown=app:app /app/assets ./assets
# public/ қалтасы жоқ (статикалық файл жоқ). Пайда болса: COPY --from=build --chown=app:app /app/public ./public
RUN mkdir -p .next/cache && chown app:app .next/cache
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
