# bibliogram-service
Backend service for Bibliogram app

## Requirements

- node
- npm
- tsc
- ts-node-dev (for development)

## Setup

1. Run setup script

```bash
./setup.sh
```
> This will install the dependencies, configure the database and run migrations. If unable to run the shell script, give full permission with `chmod 777 ./setup.sh`


2. Start service (in development mode):

```bash
npm run dev
```