import { readFile } from "fs/promises";
import path from "path";
import glob from "tiny-glob";
import { Node } from "typescript";
import { Driver, Session, TypedValues, Types } from "ydb-sdk";
import emit from "./emit";
import getImports from "./getImports";
import getQueryOptions from "./getQueryOptions";
import processFile from "./processFile";

const IMPORTS = [TypedValues.name, Types.name, Driver.name, Session.name];

export const processFiles = (files: { name: string; content: string }[]) => {
  let result: Node[] = [];
  result = [getImports(IMPORTS, "ydb-sdk"), getQueryOptions()];
  for (const file of files) {
    result = result.concat(...processFile(file.name, file.content));
  }
  return emit(result);
};

export const processFolder = async (source: string) => {
  const target = `${source}/**/*.sql`;
  const filenames = await glob(target, {
    absolute: true,
    filesOnly: true,
  });
  const files = await Promise.all(
    filenames.map(async (filename) => ({
      name: path.parse(filename).name,
      content: await readFile(filename, "utf-8"),
    }))
  );
  return processFiles(files);
};
