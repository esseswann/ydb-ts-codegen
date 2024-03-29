import { Driver, Ydb } from "ydb-sdk";
import { capitalizeFirstLetter } from "../utils";
import createConvert from "./convert/convert";
import createInterface from "./convert/interface";
import extractTypes from "./extractTypes";

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

export type IO = Awaited<ReturnType<typeof extractOutput>>;

export default extractOutput;
