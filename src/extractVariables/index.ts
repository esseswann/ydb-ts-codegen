import ts from "typescript";
import { Driver } from "ydb-sdk";
import createConvert from "./convert";
import createInterface from "./interface";

const extractVariables = async (
  sql: string,
  driver: Driver
): Promise<Variables | null> => {
  const response = await driver.tableClient.withSession((session) =>
    session.prepareQuery(sql)
  );
  if (!Object.entries(response.parametersTypes).length) return null;
  const interfaceType = createInterface("Variables");
  const convertFunction = createConvert("Variables");
  for (const key in response.parametersTypes) {
    const element = response.parametersTypes[key];
    interfaceType.append(key, element);
    convertFunction.append(key, element);
  }
  return {
    name: "Variables",
    interface: interfaceType.get(),
    converter: convertFunction.get(),
  };
};

export type Variables = {
  name: string;
  interface: ts.InterfaceDeclaration;
  converter: ts.FunctionDeclaration;
};

export default extractVariables;
