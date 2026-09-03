FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/vite.config.js ./
COPY --from=build /app/dist ./dist

RUN npm install --omit=dev && npm install vite@^5.0.8 --no-save

EXPOSE 5173

CMD ["npm", "run", "preview"]
