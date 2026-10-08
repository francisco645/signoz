# Serves a frontend build next to an existing SigNoz, proxying the API to it.
# The running SigNoz is untouched: no image swap, no database migration.
FROM nginx:1.27-alpine

ENV SIGNOZ_BACKEND=http://signoz:8080

COPY frontend-validation/default.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/build/ /usr/share/nginx/html/

EXPOSE 80
