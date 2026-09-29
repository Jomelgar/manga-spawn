FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/content-sources/package.json packages/content-sources/
COPY server/package.json server/

RUN npm install

COPY packages ./packages
COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["npm", "run", "start", "-w", "@manga-spawn/server"]
