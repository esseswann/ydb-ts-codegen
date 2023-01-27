const extractVariables = (sql: string): Variable[] => {
  const matches = sql.matchAll(/declare \$(?<name>.*) as (?<type>.*);/gi);
  const result: Variable[] = [];
  for (const { groups } of matches) result.push(groups as Variable);
  return result;
};

export type Variable = {
  name: string;
  type: string;
};

export default extractVariables;
