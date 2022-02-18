FROM node:16.14 as builder

COPY package.json yarn.lock ./

RUN yarn install

COPY src ./

RUN yarn build

FROM node:16.14

COPY --from=builder dist/ dist/

RUN mkdir /conf
ENV CONIFG_DIR=/conf
ENV PORT=80
CMD [ "yarn", "start" ]




