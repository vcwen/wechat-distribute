FROM node:16.14 as builder

RUN mkdir -p /usr/local/app

WORKDIR /usr/local/app

COPY package.json yarn.lock tsconfig.json ./

RUN yarn install

COPY src/  src/

RUN yarn build

FROM node:16.14

RUN mkdir /conf

ENV CONIFG_DIR=/conf
ENV PORT=80

COPY package.json yarn.lock ./

RUN yarn install --production

COPY --from=builder /usr/local/app/dist/ dist/

CMD [ "yarn", "start" ]




