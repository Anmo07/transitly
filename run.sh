#!/usr/bin/env bash

# Transitly One-Command Run Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

node run.js
