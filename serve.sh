#!/bin/bash

export GOOGLE_APPLICATION_CREDENTIALS=$PWD/service-account.json

pushd functions; npm run lint; popd

if [ -z "$1" ]; then
  firebase serve
else
  firebase serve --only $1
fi
