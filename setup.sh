#!/bin/sh
echo "Installing dependencies for this service...\n"
npm install
echo "\nSetting up database locally...\n"
touch ./db.sqlite
echo "\nConfiguring database and running migrations...\n"
npm run db-config