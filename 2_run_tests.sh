#! /bin/bash

set -e

cd patient-service

corepack enable

yarn install

yarn run test

