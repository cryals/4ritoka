FROM node:24-alpine AS dependencies
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN apk add --no-cache python3 make g++
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app/web
COPY --from=dependencies /app/web/node_modules ./node_modules
COPY web ./
ARG FABRIQ_BASE_PATH=""
ENV FABRIQ_BASE_PATH=$FABRIQ_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$FABRIQ_BASE_PATH
RUN npm run build

FROM node:24-alpine AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app/web
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static
COPY --chown=nextjs:nodejs configs /app/configs
RUN mkdir -p /data && chown nextjs:nodejs /data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
