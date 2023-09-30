import { readFile } from "fs/promises";
import path from "path";
import glob from "tiny-glob";
import { Driver } from "ydb-sdk";
import processFiles from "./processFiles";

const processFolder = async (source: string, driver: Driver) => {
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

export default processFolder;
