// @ts-ignore
import { Driver, Ydb } from "ydb-sdk";
import { capitalizeFirstLetter } from "../utils";
import createConvert from "./convert/convert";
import createInterface from "./convert/interface";
import getHandler, { Accumulator } from "./handlers";
import stackedParse from "./stacks";

const extractOutput = async (name: string, sql: string, driver: Driver) => {
  const { queryAst } = await driver.tableClient.withSession((session) =>
    session.explainQuery(sql)
  );
  const result = extractTypes(queryAst);
  const input = getInputDefinitions(name, result.input);
  return {
    input,
    outputs: [],
  };
};

const getInputDefinitions = (name: string, input: Record<string, Ydb.Type>) => {
  const preparedName = capitalizeFirstLetter(`${name}Variables`);
  const interfaceType = createInterface(preparedName);
  const convertFunction = createConvert(preparedName);
  for (const key in input) {
    const element = input[key];
    interfaceType.append(key, element);
    convertFunction.append(key, element);
  }
  return {
    interface: interfaceType.build(),
    converter: convertFunction.build(),
  };
};

const extractTypes = (queryAst: string) => {
  const accumulator: Accumulator = {
    declares: {},
    variables: {},
    resultSets: [],
  };
  stackedParse(queryAst, getHandler(accumulator));
  return {
    input: accumulator.declares,
    outputs: accumulator.resultSets,
  };
};

export type IO = Awaited<ReturnType<typeof extractOutput>>;

export default extractOutput;
