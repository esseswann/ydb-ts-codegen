import { factory } from "typescript";
import { snakeToCamelCaseConversion, TypedValues } from "ydb-sdk";
import type { Variable } from "./extractVariables";
import { capitalizeFirstLetter } from "./utils";

const getProperty = (variable: Variable) =>
  factory.createPropertySignature(
    undefined,
    snakeToCamelCaseConversion.ydbToJs(variable.name),
    undefined,
    factory.createIndexedAccessTypeNode(
      factory.createTypeReferenceNode("Parameters", [
        factory.createTypeReferenceNode(
          `typeof ${TypedValues.name}.${variable.type.toLowerCase()}`
        ),
      ]),
      factory.createLiteralTypeNode(factory.createNumericLiteral("0"))
    )
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
