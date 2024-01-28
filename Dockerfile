FROM node:20-alpine3.19@sha256:e96618520c7db4c3e082648678ab72a49b73367b9a1e7884cf75ac30a198e454 as builder

# Install app dependencies
COPY ./package.json /source/package.json
COPY ./package-lock.json /source/package-lock.json
WORKDIR /source
RUN npm ci

# Run the vendoring script
COPY ./build/ /source/build/
COPY ./tsconfig.vendor.json /source/tsconfig.vendor.json
COPY ./app/index.html /source/app/index.html
RUN npm run vendor

# Buld the app
COPY ./tsconfig.json /source/tsconfig.json
COPY ./app/css/ /source/app/css/
COPY ./app/ts/ /source/app/ts/
COPY ./app/favicon.webp /source/app/favicon.webp
RUN npm run build

# Cache the kubo image
FROM ipfs/kubo:v0.25.0@sha256:0c17b91cab8ada485f253e204236b712d0965f3d463cb5b60639ddd2291e7c52 as ipfs-kubo

# Create the base image
FROM debian:12.2-slim@sha256:93ff361288a7c365614a5791efa3633ce4224542afb6b53a1790330a8e52fc7d

# Install kubo and initialize ipfs
COPY --from=ipfs-kubo /usr/local/bin/ipfs /usr/local/bin/ipfs

RUN ipfs init

# Copy lunaria build output
COPY --from=builder /source/app /export

# add the build output to IPFS and write the hash to a file
RUN ipfs add --cid-version 1 --quieter --only-hash --recursive /export > ipfs_hash.txt

# print the hash for good measure in case someone is looking at the build logs
RUN cat ipfs_hash.txt

# this entrypoint file will execute `ipfs add` of the build output to the docker host's IPFS API endpoint, so we can easily extract the IPFS build out of the docker image
RUN printf '#!/bin/sh\nipfs --api /ip4/`getent ahostsv4 host.docker.internal | grep STREAM | head -n 1 | cut -d \  -f 1`/tcp/5001 add --cid-version 1 -r /export' >> entrypoint.sh
RUN chmod u+x entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]
