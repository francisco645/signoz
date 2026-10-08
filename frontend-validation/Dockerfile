# Serves a frontend build next to an existing SigNoz, proxying the API to it.
# The running SigNoz is untouched: no image swap, no database migration.
FROM nginx:1.27-alpine

ENV SIGNOZ_BACKEND=http://signoz:8080
# 1 allows login and session refresh, which write session rows.
ENV ALLOW_LOGIN=0

COPY frontend-validation/default.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/build/ /usr/share/nginx/html/

# The SigNoz server fills the base href at request time; at the root path it is "/".
RUN grep -rl '\[\[\.BaseHref\]\]' /usr/share/nginx/html | xargs -r sed -i 's#\[\[\.BaseHref\]\]#/#g'

EXPOSE 80
