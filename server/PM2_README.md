PM2 setup for monorepo server

Commands (run in PowerShell in the server folder):

# install pm2 globally (if not already)
pnpm add -g pm2

# build server
pnpm run build

# start with PM2 using the ecosystem file
pnpm run pm2:start

# view logs
pnpm run pm2:logs

# restart
pnpm run pm2:restart

# stop
pnpm run pm2:stop

# to persist process across server reboots (Linux):
# pm2 save
# pm2 startup
# follow printed instructions

# On Windows you can use PM2-windows-service or run pm2 in a background terminal. See PM2 docs.
