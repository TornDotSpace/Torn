#!/bin/bash
# Build for torn.space
echo Building Torn client 
npm ci && npm run build
echo Done.
