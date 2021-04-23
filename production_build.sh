#!/usr/bin/env sh
# Build for torn.space
echo Building Torn client 
npm ci && npm run build
./tools/index_cache_bust.sh
echo Done.
