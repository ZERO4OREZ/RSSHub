import * as path from 'node:path';

import readDirectoryAsync from './directory-reader-async';
import readDirectorySync from './directory-reader-sync';
import { ImportedModules, ImportedModulesPrivateOptions } from './types.d';

const VALID_IMPORT_EXTENSIONS = new Set(['.js', '.mjs', '.ts', '.json']);

const handlers = { async: asyncHandler, sync: syncHandler };

/**
 * Synchronously import modules from the specified directory.
 * @param {ImportedModulesPrivateOptions} options - The private options generated by the preparePrivateOptions function.
 * @returns {ImportedModules} An object containing all imported modules.
 */
function syncHandler(options: ImportedModulesPrivateOptions): ImportedModules {
  const modules = {};

  const filesPaths = readDirectorySync(options, options.targetDirectoryPath);

  let index = 0;

  for (const filePath of filesPaths) {
    const isModuleImported = importModule(filePath, index, options, modules);

    if (isModuleImported) index += 1;
    if (index === options.limit) break;
  }

  return modules;
}

/**
 * Asynchronously import modules from the specified directory.
 * @param {ImportedModulesPrivateOptions} options - The private options generated by the preparePrivateOptions function.
 * @returns {Promise<ImportedModules>} An object containing all imported modules.
 */
async function asyncHandler(options: ImportedModulesPrivateOptions): Promise<ImportedModules> {
  const modules = {};

  const filesPaths = await readDirectoryAsync(options, options.targetDirectoryPath);

  let index = 0;

  for (const filePath of filesPaths) {
    const isModuleImported = importModule(filePath, index, options, modules);

    if (isModuleImported) index += 1;
    if (index === options.limit) break;
  }

  return modules;
}

/**
 * Import a module and add it to the modules object.
 * @param {string} filePath - The path to the file to import.
 * @param {number} index - The index of the module.
 * @param {ImportedModulesPrivateOptions} options - The private options generated by the preparePrivateOptions function.
 * @param {ImportedModules} modules - The object containing all imported modules.
 * @returns {boolean} Whether the module was imported or not.
 */
function importModule(
  filePath: string,
  index: number,
  options: ImportedModulesPrivateOptions,
  modules: ImportedModules,
) {
  const { name: fileName, ext: fileExtension } = path.parse(filePath);
  const isValidModuleExtension = VALID_IMPORT_EXTENSIONS.has(fileExtension);
  const isDeclarationFile = filePath.endsWith('.d.ts');
  const isValidFilePath = options.importPattern ? options.importPattern.test(filePath) : true;

  if (!isValidModuleExtension) return false;
  if (!isValidFilePath) return false;
  if (isDeclarationFile) return false;

  const relativeModulePath = filePath.slice(options.targetDirectoryPath.length + 1);

  // eslint-disable-next-line security/detect-non-literal-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
  const importedModule = require(filePath) as unknown;

  modules[relativeModulePath] = importedModule;

  if (options.callback) {
    options.callback(fileName, relativeModulePath, importedModule, index);
  }

  return true;
}

/**
 * Import all modules from the specified directory synchronously or asynchronously.
 * @param {ImportedModulesPrivateOptions} options - The private options generated by the preparePrivateOptions function.
 * @returns {ImportedModules | Promise<ImportedModules>} An object containing all imported modules.
 */
export default function importModules(
  options: ImportedModulesPrivateOptions,
): ImportedModules | Promise<ImportedModules> {
  if (!handlers[options.importMode]) {
    throw new Error(`Expected sync or async import method, but got: ${options.importMode}`);
  }

  return handlers[options.importMode](options);
}
