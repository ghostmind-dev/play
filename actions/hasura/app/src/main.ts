#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function play() {
  $.verbose = true;

  await $`curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash`;
}

play();
