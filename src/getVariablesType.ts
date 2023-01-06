import { factory } from "typescript";
import { TypedValues } from "ydb-sdk";
import type { Variable } from "./extractVariables";
import { capitalizeFirstLetter } from "./utils";

const getProperty = (variable: Variable) =>
  factory.createPropertySignature(
    undefined,
    variable.name,
    undefined,

    factory.createTypeReferenceNode("Parameters", [
      factory.createTypeReferenceNode(
        `typeof ${TypedValues.name}.${variable.type.toLowerCase()}`
      ),
    ])
  );

const getVariablesType = (name: string, variables: Variable[]) =>
  factory.createInterfaceDeclaration(
    [],
    `${capitalizeFirstLetter(name)}Variables`,
    undefined,
    undefined,
    variables.map(getProperty)
  );

export default getVariablesType;
