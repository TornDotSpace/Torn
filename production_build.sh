#!/bin/bash
# Build for torn.space
echo Building Torn client 
npm install && npm audit fix && npm run build
echo Done.
