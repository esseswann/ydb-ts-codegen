// @ts-ignore
import { Driver } from "ydb-sdk";
import getHandler, { Accumulator } from "./handlers";
import stackedParse from "./stacks";

const extractOutput = async (name: string, sql: string, driver: Driver) => {
  const { queryAst, queryPlan } = await driver.tableClient.withSession(
    (session) => {
      return session.explainQuery(sql);
    }
  );
  const accumulator: Accumulator = {
    declares: new Map(),
    variables: new Map(),
    resultSets: [],
  };
  stackedParse(queryAst, getHandler(accumulator));
  console.log(accumulator.declares);
  console.log(accumulator.resultSets);
  console.log(queryAst);
  // console.log(queryAst.match(/\(KqpTxResultBinding.*\)/)?.[0]);
};

export default extractOutput;
