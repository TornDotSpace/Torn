#!/bin/bash
# Build for test.torn.space
echo Building Torn client 
npm ci &&  npm run test-build
echo Done.
