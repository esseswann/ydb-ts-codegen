import { Node } from "typescript";
import { Driver, Session, TypedValues, Types } from "ydb-sdk";
import emit from "./emit";
import getImports from "./getImports";
import processFile from "./processFile";

const IMPORTS = [TypedValues.name, Types.name, Driver.name, Session.name];

const processFiles = (
  name: string,
  files: { name: string; content: string }[]
) => {
  let result: Node[] = [];
  result = [getImports(IMPORTS, "ydb-sdk")];
  for (const file of files) {
    result = result.concat(...processFile(file.name, file.content));
  }
  return emit(name, result);
};

export default processFiles;
