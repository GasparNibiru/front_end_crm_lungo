FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY disc-demo.html disc-demo.js disc-demo.css disc-demo-viewport.css notifications.css notifications.js daily-assistant.css daily-assistant.js index.html config.js app.js admin-api.js supervisor-api.js business-intelligence.js supervisor-finance.js styles.css prospecting.css supervisor-finance.css marketing-nav.css ai-agent.css ai-agent.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
