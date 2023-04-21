import ts from "typescript";
import { Driver } from "ydb-sdk";
import { capitalizeFirstLetter } from "../utils";
import createConvert from "./convert";
import createInterface from "./interface";

const extractVariables = async (
  name: string,
  sql: string,
  driver: Driver
): Promise<Variables | null> => {
  const response = await driver.tableClient.withSession((session) =>
    session.prepareQuery(sql)
  );
  if (!Object.entries(response.parametersTypes).length) return null;
  const preparedName = capitalizeFirstLetter(name);
  const interfaceType = createInterface(preparedName);
  const convertFunction = createConvert(preparedName);
  for (const key in response.parametersTypes) {
    const element = response.parametersTypes[key];
    interfaceType.append(key, element);
    convertFunction.append(key, element);
  }
  return {
    interface: interfaceType.build(),
    converter: convertFunction.build(),
  };
};

export type Variables = {
  interface: ts.InterfaceDeclaration;
  converter: ts.FunctionDeclaration;
};

export default extractVariables;
