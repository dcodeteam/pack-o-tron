import { isAbsolute, join } from "path";

import { Validator } from "jsonschema";

import { tryResolve } from "../builders/utils/ConfigUtils";
import { getYarnWorkspaces } from "../utils/YarnUtils";
import { TaskConfig, TaskConfigOptions } from "./TaskConfig";

function resolveFilePath(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath);
}

function readPlainConfig(
  cwd: string,
  configFile: string,
): Partial<TaskConfigOptions> {
  const configPath = resolveFilePath(cwd, configFile);
  const idPath = tryResolve(configPath);

  if (!idPath) {
    throw new Error(`Config file "${configPath}" not found.`);
  }

  return require(idPath);
}

export async function parseTaskConfig(
  cwd: string,
  options: TaskConfigOptions,
): Promise<TaskConfig> {
  const validator = new Validator();
  const result = validator.validate(
    options,
    {
      $schema: "config",
      type: "object",
      required: ["srcDir"],
      properties: {
        srcDir: { type: "string" },

        client: {
          type: "object",
          required: ["entryFile"],
          properties: {
            entryFile: { type: "string" },
          },
        },

        server: {
          type: "object",
          required: ["entryFile"],
          properties: {
            entryFile: { type: "string" },
          },
        },
      },
    },
    { propertyName: "config" },
  );

  if (result.errors.length > 0) {
    throw new Error(
      result.errors.map(x => `${x.property} ${x.message}`).join("\n"),
    );
  }

  const workspaces = options.workspaces || (await getYarnWorkspaces(cwd));

  return new TaskConfig(cwd, { ...options, workspaces });
}

export async function parseTaskConfigFile(
  cwd: string,
  configFile = "pack-o-tron.config.js",
): Promise<TaskConfig> {
  const plain = readPlainConfig(cwd, configFile);

  return parseTaskConfig(cwd, plain);
}
