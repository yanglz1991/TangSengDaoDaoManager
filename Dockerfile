FROM node:20 as builder
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
RUN npm install pnpm -g

COPY . .

RUN pnpm install && pnpm build


FROM nginx:latest
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint2.sh 
COPY --from=builder /app/nginx.conf.template /
COPY --from=builder /app/dist /usr/share/nginx/html
ENTRYPOINT ["sh", "/docker-entrypoint2.sh"]
CMD ["nginx","-g","daemon off;"]