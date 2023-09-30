import { Driver, snakeToCamelCaseConversion } from "ydb-sdk";
import processFile from "./processFile";

const processFiles = async (files: File[], driver: Driver) => {
  let result: File[] = [];
  for (const file of files) {
    const processedFile = await processFile(
      snakeToCamelCaseConversion.ydbToJs(file.name),
      file.content,
      driver
    );
    result.push({
      name: snakeToCamelCaseConversion.ydbToJs(file.name),
      content: processedFile,
    });
  }
  return result;
};

type File = {
  name: string;
  content: string;
};

export default processFiles;
