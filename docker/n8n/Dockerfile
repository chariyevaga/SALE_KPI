FROM n8nio/n8n:2.35.7

USER root

RUN mkdir -p /home/node/.n8n/custom && \
    chown -R node:node /home/node/.n8n/custom

USER node
