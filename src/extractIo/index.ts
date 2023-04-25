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
  const preparedName = capitalizeFirstLetter(name);
  const input = Object.keys(result.input).length
    ? getInputDefinitions(preparedName, result.input)
    : null;
  const outputs = getOutputsDefinitions(preparedName, result.outputs);
  return {
    input,
    outputs,
  };
};

const getInputDefinitions = (name: string, input: Record<string, Ydb.Type>) => {
  const preparedName = `${name}Variables`;
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

const getOutputsDefinitions = (name: string, outputs: Ydb.Type[]) => {
  const result = [];
  for (let index = 0; index < outputs.length; index++) {
    // FIXME
    const structType = outputs[index].listType?.item?.structType;
    if (structType)
      result.push(getOutputDefinition(`${name}Result${index}`, structType));
  }
  return result;
};

const getOutputDefinition = (name: string, output: Ydb.IStructType) => {
  const interfaceType = createInterface(name, false);
  for (const { name, type } of output.members!)
    interfaceType.append(name!, type!);
  return interfaceType.build();
};

const extractTypes = (queryAst: string) => {
  const accumulator: Accumulator = {
    declares: {},
    variables: {},
    resultSets: [],
  };
  stackedParse(queryAst, getHandler(accumulator));
  const input: Record<string, Ydb.Type> = {};
  for (const key in accumulator.declares)
    if (key.startsWith("$")) {
      const type = accumulator.declares[key];
      if (typeof type !== "string") input[key] = type;
    }
  return {
    input,
    outputs: accumulator.resultSets,
  };
};

export type IO = Awaited<ReturnType<typeof extractOutput>>;

export default extractOutput;
