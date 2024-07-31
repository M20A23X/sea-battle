FROM mysql:8.0
ARG PORT

COPY ./database/global.sql /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=10s \
    --timeout=3s \
    --retries=5 \
    CMD mysqladmin ping -h localhost

EXPOSE $PORT
