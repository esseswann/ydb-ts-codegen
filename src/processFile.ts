import { Node, factory } from "typescript";
import { Driver, TypedData } from "ydb-sdk";
import getExecuteQueryDefinition from "./getExecuteQueryDefinition";
import getImports from "./getImports";
import emit from "./emit";

import { Session, TypedValues, Types, withRetries } from "ydb-sdk";
import extractIo from "./extractIo";
// import getQueryOptions from "./getQueryOptions";
const IMPORTS = [
  TypedData.name,
  TypedValues.name,
  Types.name,
  Driver.name,
  Session.name,
  withRetries.name,
];

const processFile = async (name: string, sql: string, driver: Driver) => {
  const comment = factory.createJSDocComment(
    "This file is generated by ydb-ts-codegen and should not be modified directly"
  );
  const result: Node[] = [comment, getImports(IMPORTS, "ydb-sdk")];
  // FIXME
  result.push(
    factory.createImportDeclaration(
      [],
      factory.createImportClause(
        false,
        factory.createIdentifier("Long"),
        undefined
      ),
      factory.createStringLiteral("long")
    )
  );
  const io = await extractIo(name, sql, driver);
  const functionDefintion = getExecuteQueryDefinition(name, sql, io);

  if (io.input) {
    result.push(io.input.interface);
    result.push(io.input.converter);
  }
  for (const output of io.outputs) result.push(output);
  result.push(functionDefintion);
  result.push(
    factory.createExportDefault(
      factory.createIdentifier(functionDefintion.name!.text)
    )
  );
  return emit(result);
};

export default processFile;
