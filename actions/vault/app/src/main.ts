import core from '@actions/core';
import { $ } from 'zx';

try {
  const login = core.getInput('login');
  const token = core.getInput('token');
  const addrr = core.getInput('addrr');

  const HOME = process.env.HOME;
  const SRC = process.env.SRC;

  $.verbose = true;

  await $`sudo apt-get update`;
  await $`curl https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg`;
  await $`gpg --no-default-keyring --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg --fingerprint`;
  await $`echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`;
  await $`sudo apt-get update`;
  await $`sudo apt-get install --reinstall -y vault`;
  await $`sudo chown root:root /usr/bin/vault`;

  if (login === 'true') {
    const VAULT_TOKEN =
      token == '' || undefined ? process.env.VAULT_ROOT_TOKEN : token;
    const VAULT_ADDR =
      addrr == '' || undefined ? process.env.VAULT_ADDR : addrr;

    await $`vault login "${VAULT_TOKEN}" -address="${VAULT_ADDR}" -non-interactive=true --no-print=true >/dev/null 2>&1`;
  }
} catch (error) {
  core.setFailed(error.message);
}
