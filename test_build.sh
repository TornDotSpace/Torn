#!/usr/bin/env sh
# Build for test.torn.space
echo Building Torn client 
npm ci &&  npm run test-build
./tools/index_cache_bust.sh
echo Done.
