import { Node } from "typescript";
import { Driver } from "ydb-sdk";
import extractVariables from "./extractVariables";
import getExecuteQueryDefinition from "./getExecuteQueryDefinition";

const processFile = async (name: string, sql: string, driver: Driver) => {
  const result: Node[] = [];
  const variables = await extractVariables(sql, driver);

  const functionDefintion = getExecuteQueryDefinition(
    name,
    sql,
    variables ? variables.name : undefined
  );

  if (variables) {
    result.push(variables.interface);
    result.push(variables.converter);
  }
  result.push(functionDefintion);
  return result;
};

export default processFile;
