import { Node, factory } from "typescript";
import { Driver } from "ydb-sdk";
import getExecuteQueryDefinition from "./getExecuteQueryDefinition";
import getImports from "./getImports";

import { Session, Types, withRetries } from "ydb-sdk";
import extractIo from "./extractIo";
// import getQueryOptions from "./getQueryOptions";
const IMPORTS = [Types.name, Driver.name, Session.name, withRetries.name];

const processFile = async (name: string, sql: string, driver: Driver) => {
  const comment = factory.createJSDocComment(
    "This file is generated by ydb-ts-codegen and should not be modified directly"
  );
  let result: Node[] = [comment, getImports(IMPORTS, "ydb-sdk")];
  const io = await extractIo(name, sql, driver);
  const functionDefintion = getExecuteQueryDefinition(name, sql, io);

  if (io.input) {
    result.push(io.input.interface);
    result.push(io.input.converter);
  }
  for (const output of io.outputs) {
    result.push(output);
    // result.push(output.class);
  }
  result.push(functionDefintion);
  result.push(
    factory.createExportDefault(
      factory.createIdentifier(functionDefintion.name!.text)
    )
  );
  return result;
};

export default processFile;
