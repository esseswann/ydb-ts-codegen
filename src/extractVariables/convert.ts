import ts, { factory } from "typescript";
import { Ydb, snakeToCamelCaseConversion } from "ydb-sdk";

const createConvert = (name: string) => {
  const properties: ts.PropertyAssignment[] = [];
  return {
    append: (key: string, value: Ydb.IType) =>
      properties.push(
        factory.createPropertyAssignment(
          key,
          factory.createPropertyAccessExpression(
            factory.createIdentifier(PARAMETER_NAME),
            snakeToCamelCaseConversion.ydbToJs(key)
          )
        )
      ),
    get: () => {
      const object = factory.createObjectLiteralExpression(properties, true);
      return factory.createFunctionDeclaration(
        undefined,
        undefined,
        `prepare${name}`,
        undefined,
        [
          factory.createParameterDeclaration(
            undefined,
            undefined,
            PARAMETER_NAME,
            undefined,
            factory.createTypeReferenceNode("Variables", undefined),
            undefined
          ),
        ],
        undefined,
        factory.createBlock([factory.createReturnStatement(object)], true)
      );
    },
  };
};

const PARAMETER_NAME = "variables";

export default createConvert;
