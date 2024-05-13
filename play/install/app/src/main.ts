#!/usr/bin/env node
import { $ } from 'zx';

async function run() {
  const application = core.getInput('application');

  if (application === 'vault') {
    await $`sudo apt install -y gpg`;
    await $`wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg >/dev/null`;
    await $`gpg --no-default-keyring --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg --fingerprint`;
    await $`echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`;
    await $`sudo apt update`;
    await $`sudo apt-get install --reinstall -y vault`;
    await $`sudo chown root:root /usr/bin/vault`;
  }
}

run();
