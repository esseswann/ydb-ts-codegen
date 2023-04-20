// @ts-ignore
import { Driver } from "ydb-sdk";
import handlers from "./handlers";
import stackedParse from "./stacks";

const extractOutput = async (name: string, sql: string, driver: Driver) => {
  const { queryAst, queryPlan } = await driver.tableClient.withSession(
    (session) => {
      return session.explainQuery(sql);
    }
  );
  // const parsed = parse(queryAst);
  // define a map of variable names to values
  // const declares = new Set();
  // const variables: Map<string, any> = new Map();
  // for (const entry of parsed) {
  //   if (entry[0] === "declare") {
  //     declares.add(entry);
  //   } else if (entry[0] === "let") {
  //     const [_, name, valueExp] = entry;
  //     variables.set(name, valueExp);
  //   } else if ((entry[0] = "return") && entry[1][0] === "KqpPhysicalQuery") {
  //     const output = entry[1][2];
  //     console.log(output[output.length - 1]);
  //   }
  // }
  const accumulator = { variables: new Map(), results: [] };
  stackedParse(queryAst, handlers, accumulator);
  console.log(accumulator);
  // console.log(queryAst.match(/\(KqpTxResultBinding.*\)/)?.[0]);
};

export default extractOutput;
