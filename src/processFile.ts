import { Node } from "typescript";
import { snakeToCamelCaseConversion } from "ydb-sdk";
import extractVariables from "./extractVariables";
import getExecuteQueryDefinition from "./getExecuteQueryDefinition";
import getVariablesType from "./getVariablesType";

const processFile = (name: string, sql: string) => {
  const result: Node[] = [];
  const variables = extractVariables(sql);
  
  const variablesType = getVariablesType(name, variables);
  const functionDefintion = getExecuteQueryDefinition(
    name,
    sql,
    variablesType.name.text,
    variables
  );
  if (variables.length) result.push(variablesType);
  result.push(functionDefintion);
  return result;
};

export default processFile;
