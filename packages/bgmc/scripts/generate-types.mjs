import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import openapiTS, { COMMENT_HEADER, astToString } from 'openapi-typescript';

/**
 * Generate `bgmc` OpenAPI types from the bundled Bangumi OpenAPI config.
 *
 * Usage:
 *   pnpm -C packages/bgmc generate:types
 *
 * Prerequisites:
 * - `packages/bgmc/bangumi/config.json` must include:
 *   - `./open-api/api.yml`
 *   - `./open-api/v0.yaml`
 *   - `./open-api/version.json`
 * - `openapi-typescript` and `js-yaml` must be installed in this workspace.
 *
 * What this script does:
 * - Reads Bangumi's split OpenAPI sources from the local bundled config.
 * - Merges the base legacy paths from `api.yml` with the v0 paths from `v0.yaml`.
 * - Merges shared `components`, `tags`, and selected top-level metadata.
 * - Uses `version.json` to override the generated schema version when present.
 * - Generates runtime-free TypeScript definitions with `openapi-typescript`.
 *
 * Output:
 * - Writes the generated type source to:
 *   `packages/bgmc/src/types/types/index.ts`
 *
 * Notes:
 * - This script only regenerates the raw OpenAPI type map.
 * - Compatibility wrappers in `src/types/params.ts` and `src/types/type.ts`
 *   may still need manual updates when the upstream schema changes.
 */
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const repoDir = path.resolve(packageDir, '../..');
const openapiConfigFile = path.join(packageDir, 'bangumi', 'config.json');
const outputFile = path.join(packageDir, 'src', 'types', 'types', 'index.ts');

async function readYaml(file) {
  return yaml.load(await readFile(file, 'utf8'));
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function readSchemaFile(file) {
  if (path.extname(file) === '.json') {
    return readJson(file);
  }

  return readYaml(file);
}

async function loadInputSpecs(configFile) {
  const config = await readJson(configFile);
  const configDir = path.dirname(configFile);
  const inputs = new Map();

  for (const item of config.inputs || []) {
    if (!item?.inputFile) {
      continue;
    }

    const inputFile = path.resolve(configDir, item.inputFile);
    inputs.set(path.basename(item.inputFile), await readSchemaFile(inputFile));
  }

  return inputs;
}

function requireInputSpec(inputs, fileName) {
  const spec = inputs.get(fileName);

  if (!spec) {
    throw new Error(`Missing OpenAPI input "${fileName}" in ${path.relative(repoDir, openapiConfigFile)}`);
  }

  return spec;
}

function mergeByName(items = []) {
  return [...new Map(items.map((item) => [item.name, item])).values()];
}

function mergeRecords(...records) {
  return Object.assign({}, ...records.filter(Boolean));
}

function mergeComponents(...components) {
  return {
    schemas: mergeRecords(...components.map((item) => item?.schemas)),
    responses: mergeRecords(...components.map((item) => item?.responses)),
    parameters: mergeRecords(...components.map((item) => item?.parameters)),
    examples: mergeRecords(...components.map((item) => item?.examples)),
    requestBodies: mergeRecords(...components.map((item) => item?.requestBodies)),
    headers: mergeRecords(...components.map((item) => item?.headers)),
    securitySchemes: mergeRecords(...components.map((item) => item?.securitySchemes)),
    links: mergeRecords(...components.map((item) => item?.links)),
    callbacks: mergeRecords(...components.map((item) => item?.callbacks)),
    pathItems: mergeRecords(...components.map((item) => item?.pathItems))
  };
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value == null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      return true;
    })
  );
}

function mergeSpec(baseSpec, v0Spec, versionSpec) {
  return compactObject({
    openapi: v0Spec.openapi || baseSpec.openapi || '3.0.0',
    info: compactObject({
      ...baseSpec.info,
      ...versionSpec.info,
      title: baseSpec.info?.title || 'Bangumi API',
      version: versionSpec.info?.version || baseSpec.info?.version || 'dev'
    }),
    servers: baseSpec.servers || v0Spec.servers,
    tags: mergeByName([...(baseSpec.tags || []), ...(v0Spec.tags || [])]),
    paths: mergeRecords(baseSpec.paths, v0Spec.paths),
    components: mergeComponents(baseSpec.components, v0Spec.components),
    security: v0Spec.security || baseSpec.security,
    externalDocs: v0Spec.externalDocs || baseSpec.externalDocs
  });
}

const inputSpecs = await loadInputSpecs(openapiConfigFile);
const baseSpec = requireInputSpec(inputSpecs, 'api.yml');
const v0Spec = requireInputSpec(inputSpecs, 'v0.yaml');
const versionSpec = requireInputSpec(inputSpecs, 'version.json');

const output = await openapiTS(mergeSpec(baseSpec, v0Spec, versionSpec));

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, COMMENT_HEADER + astToString(output));

console.log(`Generated ${path.relative(repoDir, outputFile)}`);
