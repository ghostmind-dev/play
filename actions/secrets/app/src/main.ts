import core from '@actions/core';
import { $ } from 'zx';
import fs from 'fs-extra';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';
import { readFileSync } from 'fs';

////////////////////////////////////////////////////////////////////////////////
// TYPES DEFINITION
////////////////////////////////////////////////////////////////////////////////

export interface MetaJsonBase {
  id: string;
  type: string;
  name: string;
}

export interface MetaJson extends MetaJsonBase {
  [key: string]: any;
}

////////////////////////////////////////////////////////////////////////////////
// GET META.JSON
////////////////////////////////////////////////////////////////////////////////

export async function verifyIfMetaJsonExists(
  path: string
): Promise<MetaJson | undefined> {
  try {
    await fs.access(`${path}/meta.json`);
    let metaconfig = fs.readJsonSync(`${path}/meta.json`);

    const replaceEnvVariables = (obj: any) => {
      let updatedMetaConfig = obj;

      for (let key in obj) {
        if (typeof updatedMetaConfig[key] === 'string') {
          const matches = updatedMetaConfig[key].match(/\${(.*?)}/g);

          if (matches) {
            for (let match of matches) {
              const envVariable = match.replace('${', '').replace('}', '');

              // ignore if if match ${this.whatver}

              if (!envVariable.includes('this.')) {
                updatedMetaConfig[key] = updatedMetaConfig[key].replace(
                  match,
                  process.env[envVariable]
                );
              }
            }
          }
        } else if (typeof obj[key] === 'object') {
          replaceEnvVariables(obj[key]);
        }
      }

      return updatedMetaConfig;
    };

    const envReplacedUpdatedConfig = replaceEnvVariables(metaconfig);

    // replace the field that containers ${this.} with the value of the field

    type AnyObject = { [key: string]: any };

    const getProperty = (object: AnyObject, path: string) => {
      return path
        .split('.')
        .reduce(
          (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
          object
        );
    };

    const updatedMetaConfigAction = (obj: MetaJson): MetaJson => {
      const resolveTemplateString = (
        value: string,
        context: AnyObject
      ): string => {
        return value.replace(/\${this\.(.*?)}/g, (_: any, path: any): any => {
          const resolvedValue = getProperty(context, path);
          return resolvedValue !== undefined ? resolvedValue : '';
        });
      };

      const updateProperties = (object: MetaJson, context: AnyObject) => {
        for (let key in object) {
          if (typeof object[key] === 'string') {
            const matches = object[key].match(/\${this\.(.*?)}/g);
            if (matches) {
              object[key] = resolveTemplateString(object[key], context);
            }
          } else if (typeof object[key] === 'object') {
            updateProperties(object[key], context);
          }
        }
      };

      let updatedMetaConfig = { ...obj };
      updateProperties(updatedMetaConfig, updatedMetaConfig);
      return updatedMetaConfig;
    };

    return updatedMetaConfigAction(envReplacedUpdatedConfig);
  } catch (error) {
    console.log('This part has an error', error);
    return undefined;
  }
}

////////////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////////////

try {
  const global = core.getInput('global');
  const directory = core.getInput('dir');

  $.verbose = true;

  if (global === 'true') {
    await $`rm -rf /tmp/env.global.json`;
    await $`vault kv get -format=json kv/GLOBAL/global/secrets  > /tmp/env.global.json`;
    const credsValue = await fs.readJSONSync(`/tmp/env.global.json`);
    const { CREDS } = credsValue.data.data;
    await $`rm -rf /tmp/.env.global`;
    fs.writeFileSync('/tmp/.env.global', CREDS, 'utf8');
    const originalEnvContent = readFileSync(`/tmp/.env.global`, 'utf8');
    const envConfig = parse(originalEnvContent);
    // Use dotenv-expand to expand the variables
    const expandedConfig: any = expand({
      parsed: envConfig,
    });
    const gitEnvPathRaw = await $`echo $GITHUB_ENV`;
    const gitEnvPath = `${gitEnvPathRaw}`.replace(/(\r\n|\n|\r)/gm, '');

    // First, set all secrets to ensure they are masked in logs
    for (let [key, value] of Object.entries(expandedConfig.parsed)) {
      core.setSecret(String(value));
    }

    // Then process them (now they will be masked)
    for (let [key, value] of Object.entries(expandedConfig.parsed)) {
      core.setOutput(key, value);
      // Use fs.appendFileSync instead of shell echo to avoid command line exposure
      fs.appendFileSync(gitEnvPath, `${key}=${value}\n`);
    }
  } else {
    // generqta a random string
    const APP = `${Math.random().toString(36).substring(7)}`;

    const target = process.env.ENV;
    const gitEnvPathRaw = await $`echo $GITHUB_ENV`;
    const gitEnvPath = `${gitEnvPathRaw}`.replace(/(\r\n|\n|\r)/gm, '');
    await $`rm -rf /tmp/.env.${APP}`;
    const metajson = await verifyIfMetaJsonExists(directory);

    let { id } = metajson;

    let env_file = `/tmp/.env.${APP}`;
    if (metajson?.secrets?.base) {
      let base = metajson.secrets.base;

      await $`rm -rf /tmp/.env.base.${APP}`;
      await $`rm -rf /tmp/.env.target.${APP}`;

      await $`vault kv get -format=json kv/${id}/${base}/secrets  > /tmp/.env.base.${APP}.json`;
      const credsValueBase = await fs.readJSONSync(
        `/tmp/.env.base.${APP}.json`
      );
      const { CREDS: creadsBase } = credsValueBase.data.data;
      fs.writeFileSync(`/tmp/.env.base.${APP}`, creadsBase, 'utf8');

      await $`vault kv get -format=json kv/${id}/${target}/secrets  > /tmp/.env.target.${APP}.json`;
      const credsValueTarget = await fs.readJSONSync(
        `/tmp/.env.target.${APP}.json`
      );
      const { CREDS: credsTarget } = credsValueTarget.data.data;
      fs.writeFileSync(`/tmp/.env.target.${APP}`, credsTarget, 'utf8');

      // merge base and target files in /tmp/.env.APP_NAME
      await $`rm -rf /tmp/.env.${APP}`;
      await $`cat /tmp/.env.target.${APP} /tmp/.env.base.${APP} > /tmp/.env.${APP}`;
    } else {
      await $`rm -rf /tmp/.env.${APP}`;
      $.verbose = true;
      // await $`run vault kv export --target=${target} --envfile=/tmp/.env.${APP}`;
      let secretNamespace = `${id}/${target}/secrets`;
      await $`vault kv get -format=json kv/${secretNamespace}  > /tmp/.env.${APP}.json`;

      const credsValue = await fs.readJSONSync(`/tmp/.env.${APP}.json`);

      const { CREDS } = credsValue.data.data;

      // create a file with the secrets

      fs.writeFileSync(`/tmp/.env.${APP}`, CREDS, 'utf8');
      $.verbose = true;
    }

    const content: any = readFileSync(env_file, 'utf-8');

    // Extract all variable names that don't start with TF_VAR
    const nonTfVarNames: any = content.match(/^(?!TF_VAR_)[A-Z_]+(?==)/gm);
    // Generate the prefixed variable declarations for non-TF_VAR variables
    // remove element TF_VAR_PORT
    let prefixedVars = nonTfVarNames
      .map((varName: any) => {
        const value = content.match(new RegExp(`^${varName}=(.*)$`, 'm'))[1];
        return `TF_VAR_${varName}=${value}`;
      })
      .join('\n');
    const projectHasBeenDefined = prefixedVars.match(/^TF_VAR_PROJECT=(.*)$/m);
    const appNameHasBeenDefined = prefixedVars.match(/^TF_VAR_APP=(.*)$/m);
    const portHasBeenDefined = prefixedVars.match(/^TF_VAR_PORT=(.*)$/m);
    const gcpProjectIdhAsBeenDefined = prefixedVars.match(
      /^TF_VAR_GCP_PROJECT_ID=(.*)$/m
    );
    if (!projectHasBeenDefined) {
      const SRC = process.env.SRC;
      const metaconfig = await verifyIfMetaJsonExists(SRC);
      let name = metaconfig?.name || '';
      fs.appendFileSync(gitEnvPath, `PROJECT=${name}\n`);
      // add the project name to the .env file
      prefixedVars += `\nTF_VAR_PROJECT=${name}`;
    }
    if (!appNameHasBeenDefined) {
      const metaconfig = await verifyIfMetaJsonExists(directory);
      let name = metaconfig?.name;
      fs.appendFileSync(gitEnvPath, `APP=${name}\n`);
      prefixedVars += `\nTF_VAR_APP=${name}`;
    }
    if (!gcpProjectIdhAsBeenDefined) {
      const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
      core.setSecret(String(GCP_PROJECT_ID));
      fs.appendFileSync(gitEnvPath, `GCP_PROJECT_ID=${GCP_PROJECT_ID}\n`);
      prefixedVars += `\nTF_VAR_GCP_PROJECT_ID=${GCP_PROJECT_ID}`;
    }
    if (!portHasBeenDefined) {
      const { port }: any = await verifyIfMetaJsonExists(directory);
      fs.appendFileSync(gitEnvPath, `PORT=${port}\n`);
      prefixedVars += `\nTF_VAR_PORT=${port}`;
    }
    await $`rm -rf /tmp/.env.${APP}`;
    // write content to /tmp/.env.APP_NAME and add prefixedVars at the end
    const tempEnvPath = `/tmp/.env.${APP}`;
    await fs.writeFile(tempEnvPath, `${content}\n${prefixedVars}`);
    const originalEnvContent = readFileSync(tempEnvPath, 'utf8');
    const envConfig = parse(originalEnvContent);
    // Use dotenv-expand to expand the variables
    const expandedConfig: any = expand({
      parsed: envConfig,
    });

    // First, set all secrets to ensure they are masked in logs
    for (let [key, value] of Object.entries(expandedConfig.parsed)) {
      core.setSecret(String(value));
    }

    // Then process them (now they will be masked)
    for (let [key, value] of Object.entries(expandedConfig.parsed)) {
      core.setOutput(key, value);
      // Use fs.appendFileSync instead of shell echo to avoid command line exposure
      fs.appendFileSync(gitEnvPath, `${key}=${value}\n`);
    }
    await fs.promises.unlink(tempEnvPath);

    // Clean up the temporary env file
  }
} catch (error) {
  core.setFailed(error.message);
}

////////////////////////////////////////////////////////////////////////////////
// THE END
////////////////////////////////////////////////////////////////////////////////
