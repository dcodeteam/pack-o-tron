import * as path from "path";

import { RuleSetLoader } from "webpack";

import { BuilderOptions } from "../abstract/AbstractConfigBuilder";
import { tryResolve } from "../utils/ConfigUtils";
import { RuleBuilder } from "./RuleBuilder";

export type BabelDependency<T = object> = [string, T];

export interface BabelLoader extends RuleSetLoader {
  options: {
    babelrc?: boolean;
    configFile?: boolean;
    cacheDirectory?: boolean;
    cacheCompression?: boolean;

    presets: Array<BabelDependency>;
    plugins: Array<BabelDependency>;
  };
}

export class JSRuleBuilder extends RuleBuilder {
  public static createBabelLoader({
    mode,
    target,
    config,
  }: BuilderOptions): null | RuleSetLoader {
    const loader = tryResolve("babel-loader");

    if (!loader) {
      return null;
    }

    const { cwd } = config;

    return {
      loader,
      options: {
        // Use task cwd.
        cwd,

        // Use task env.
        envName: mode,

        // Disallow to modify settings via `.babelrc` file.
        babelrc: false,

        // Allow to modify babel settings via `babel.config.js` file.
        configFile: tryResolve(path.join(cwd, "babel.config.js")) || false,

        // This is a feature of `babel-loader` for webpack (not Babel itself).
        // It enables caching results in ./node_modules/.cache/babel-loader/
        // directory for faster rebuilds.
        cacheDirectory: true,
        // Don't waste time on Gzipping the cache
        cacheCompression: false,

        presets: [[require.resolve("./babel"), { mode, target }]],
      },
    };
  }

  public constructor(options: BuilderOptions) {
    super("JSRuleBuilder", options);

    this.test = [/\.js$/];
    this.exclude = [/node_modules/];

    const loader = JSRuleBuilder.createBabelLoader(options);

    if (loader) {
      this.use.push(loader);
    }
  }
}
