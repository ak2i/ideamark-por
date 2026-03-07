FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
COPY README.md ARCHITECTURE.md AGENTS.md ./
COPY docs ./docs

RUN npm run build

CMD ["node", "dist/main.js", "--help"]
