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
  const input = getInputDefinitions(preparedName, result.input);
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
  for (let index = 0; index < outputs.length; index++)
    result.push(
      getOutputDefinition(
        `${name}Result${index}`,
        outputs[index].listType!.item!.structType!
      )
    );
  return result;
};

const getOutputDefinition = (name: string, output: Ydb.IStructType) => {
  const interfaceType = createInterface(name);
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
  const input: Accumulator["declares"] = {};
  for (const key in accumulator.declares)
    if (key.startsWith("$")) input[key] = accumulator.declares[key];
  return {
    input,
    outputs: accumulator.resultSets,
  };
};

export type IO = Awaited<ReturnType<typeof extractOutput>>;

export default extractOutput;
