#!/bin/sh

echo "Running Prisma db push..."
npx prisma@6.19.0 db push

echo "Starting server..."
node server.js
