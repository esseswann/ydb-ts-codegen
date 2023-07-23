import { Ydb } from "ydb-sdk";
import getHandler, { Accumulator } from "./handlers";
import stackedParse from "./stacks";

const extractTypes = (queryAst: string) => {
  const accumulator: Accumulator = {
    declares: {},
    variables: {},
    resultSets: [],
    // errors: [],
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
    // errors: accumulator.errors,
  };
};

export default extractTypes;
