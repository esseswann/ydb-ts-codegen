import { Driver } from "ydb-sdk";
import createInterface from "./interface";

const extractVariables = async (sql: string, driver: Driver) => {
  const response = await driver.tableClient.withSession((session) =>
    session.prepareQuery(sql)
  );
  const interfaceType = createInterface("Variables");
  for (const key in response.parametersTypes) {
    const element = response.parametersTypes[key];
    interfaceType.append(key, element);
  }
  const matches = sql.matchAll(/declare \$(?<name>.*) as (?<type>.*);/gi);
  const result: Variable[] = [];
  for (const { groups } of matches) result.push(groups as Variable);
  return {
    name: "Variables",
    interface: interfaceType.get(),
    typehandler: "",
  };
};

export type Variable = {
  name: string;
  type: string;
};

export default extractVariables;
