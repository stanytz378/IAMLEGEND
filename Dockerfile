FROM node:lts-bookworm

WORKDIR /app

RUN git clone https://github.com/Stanytz378/IAMLEGEND . && \
    npm install

EXPOSE 3000

CMD ["npm", "start"]