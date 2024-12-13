# ---------------------------------------------
# App Setup: Install dependencies and build app
# ---------------------------------------------

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

# --------------------------------------------------------
# Base Image: Create the base image that will host the app
# --------------------------------------------------------

# Cache the kubo image
FROM ipfs/kubo:v0.25.0@sha256:0c17b91cab8ada485f253e204236b712d0965f3d463cb5b60639ddd2291e7c52 as ipfs-kubo

# Create the base image
FROM debian:12.6-slim@sha256:39868a6f452462b70cf720a8daff250c63e7342970e749059c105bf7c1e8eeaf

# Add curl to the base image (7.88.1-10+deb12u6)
# Add jq to the base image (1.6-2.1)
RUN sed -i 's/URIs/# URIs/g' /etc/apt/sources.list.d/debian.sources && \
	sed -i 's/# http/URIs: http/g' /etc/apt/sources.list.d/debian.sources && \
	apt-get update -o Acquire::Check-Valid-Until=false && apt-get install -y curl=7.88.1-10+deb12u6 jq=1.6-2.1

# Install kubo and initialize ipfs
COPY --from=ipfs-kubo /usr/local/bin/ipfs /usr/local/bin/ipfs

# Copy app's build output and initialize IPFS api
COPY --from=builder /source/app /export
RUN ipfs init

# Store the hash to a file
RUN ipfs add --cid-version 1 --quieter --only-hash --recursive /export > ipfs_hash.txt

# print the hash for good measure in case someone is looking at the build logs
RUN cat ipfs_hash.txt

# --------------------------------------------------------
# Publish Script: Option to host app locally or on nft.storage
# --------------------------------------------------------

WORKDIR ~
COPY <<'EOF' /entrypoint.sh
#!/bin/sh
set -e

if [ $# -ne  1 ]; then
  echo "Example usage: docker run --rm ghcr.io/darkflorist/bouquet:latest [docker-host|nft.storage]"
  exit  1
fi

case $1 in

  docker-host)
    # Show the IFPS build hash
    echo "Build Hash: $(cat /ipfs_hash.txt)"

    # Determine the IPV4 address of the docker-hosted IPFS instance
    IPFS_IP4_ADDRESS=$(getent ahostsv4 host.docker.internal | grep STREAM | head -n 1 | cut -d ' ' -f 1)

    echo "Adding files to docker running IPFS at $IPFS_IP4_ADDRESS"
    IPFS_HASH=$(ipfs add --api /ip4/$IPFS_IP4_ADDRESS/tcp/5001 --cid-version 1 --quieter -r /export)
    echo "Uploaded Hash: $IPFS_HASH"
    ;;

  nft.storage)
    if [ -z $NFTSTORAGE_API_KEY ] || [ $NFTSTORAGE_API_KEY = "" ]; then
      echo "NFTSTORAGE_API_KEY environment variable is not set";
      exit  1;
    fi

    # Show the IFPS build hash
    echo "Build Hash: $(cat /ipfs_hash.txt)"

    # Create a CAR archive from build hash
    echo "Uploading files to nft.storage..."
    IPFS_HASH=$(ipfs add --cid-version 1 --quieter -r /export)
    ipfs dag export $IPFS_HASH > output.car

    # Upload the entire directory to nft.storage
    UPLOAD_RESPONSE=$(curl \
      --request POST \
      --header "Authorization: Bearer $NFTSTORAGE_API_KEY" \
      --header "Content-Type: application/car" \
      --data-binary @output.car \
      --silent \
      https://api.nft.storage/upload)

    # Show link to nft.storage (https://xxx.ipfs.nftstorage.link)
    UPLOAD_SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r ".ok")

    if [ "$UPLOAD_SUCCESS" = "true" ]; then
      echo "Succesfully uploaded to https://"$(echo "$UPLOAD_RESPONSE" | jq -r ".value.cid")".ipfs.nftstorage.link"
    else
      echo "Upload Failed: " $(echo "$UPLOAD_RESPONSE" | jq -r ".error | @json")
    fi
    ;;

  *)
    echo "Invalid option: $1"
    echo "Example usage: docker run --rm ghcr.io/darkflorist/bouquet:latest [docker-host|nft.storage]"
    exit  1
    ;;
esac
EOF

RUN chmod u+x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
