#!/bin/bash
# Build for test.torn.space
echo Building Torn client 
npm install && npm audit fix &&  npm run test-build
echo Done.
