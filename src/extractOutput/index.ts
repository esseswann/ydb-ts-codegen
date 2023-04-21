// @ts-ignore
import { Driver } from "ydb-sdk";
import getHandler, { Accumulator } from "./handlers";
import stackedParse from "./stacks";

const extractOutput = async (name: string, sql: string, driver: Driver) => {
  const { queryAst } = await driver.tableClient.withSession((session) =>
    session.explainQuery(sql)
  );
  const accumulator: Accumulator = {
    declares: new Map(),
    variables: new Map(),
    resultSets: [],
  };
  stackedParse(queryAst, getHandler(accumulator));
  console.log(accumulator.declares);
  console.log(accumulator.resultSets);
  // const interfaceBuilder = createInterface(name);
  console.log(queryAst);
};

export default extractOutput;
