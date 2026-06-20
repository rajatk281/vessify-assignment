FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /tmp/dev
COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev && bun install --frozen-lockfile

RUN mkdir -p /tmp/prod
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /tmp/dev/node_modules node_modules
COPY . .

RUN bunx prisma generate

FROM base AS release
COPY --from=install /tmp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/prisma prisma
COPY --from=prerelease /usr/src/app/prisma.config.ts .
COPY --from=prerelease /usr/src/app/src/generated src/generated

EXPOSE 3000/tcp

USER bun
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
