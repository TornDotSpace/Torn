#!/usr/bin/env sh

GIT_HASH=$(git rev-parse HEAD)
echo Got hash $GIT_HASH

sed "s/{GIT_HASH}/$GIT_HASH/g" client/index.html.template > client/index.html
