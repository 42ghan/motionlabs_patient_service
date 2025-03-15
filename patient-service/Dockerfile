FROM node:22-alpine AS builder

RUN apk add --no-cache sudo

WORKDIR /app

COPY package.json \
	yarn.lock \
	.yarnrc.yml \
	tsconfig.json \
	tsconfig.build.json \
	src/ \
	ecosystem.config.js \
	/app/

RUN sudo corepack enable
RUN yarn config set enableGlobalCache false
RUN yarn config set cacheFolder .yarn/cache
RUN yarn install
RUN yarn build

# ------------------------------------------------------------

FROM node:22-alpine AS runner

WORKDIR /app

RUN yarn global add pm2

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/.pnp.cjs ./.pnp.cjs
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

EXPOSE 3000

ENV PM2_KILL_SIGNAL=SIGTERM

CMD ["pm2-runtime", "start", "ecosystem.config.js"]