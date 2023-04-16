import { readFile } from "fs/promises";
import path from "path";
import glob from "tiny-glob";
import { Driver, snakeToCamelCaseConversion } from "ydb-sdk";
import emit from "./emit";
import processFile from "./processFile";

export const processFiles = async (files: File[], driver: Driver) => {
  let result: File[] = [];
  for (const file of files) {
    const processedFile = await processFile(
      snakeToCamelCaseConversion.ydbToJs(file.name),
      file.content,
      driver
    );
    result.push({
      name: snakeToCamelCaseConversion.ydbToJs(file.name),
      content: emit(processedFile),
    });
  }
  return result;
};

type File = {
  name: string;
  content: string;
};

export const processFolder = async (source: string, driver: Driver) => {
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
  return processFiles(files, driver);
};
