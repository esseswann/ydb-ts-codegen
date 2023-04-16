import ts, { factory } from "typescript";
import { TypedValues, Types, Ydb, snakeToCamelCaseConversion } from "ydb-sdk";
import primitiveTypes from "./primitiveTypes";

const createConvert = (name: string) => {
  const properties: ts.PropertyAssignment[] = [];
  return {
    append: (key: string, value: Ydb.IType) =>
      properties.push(getType(key, value)),
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
            factory.createTypeReferenceNode(name, undefined),
            undefined
          ),
        ],
        undefined,
        factory.createBlock([factory.createReturnStatement(object)], true)
      );
    },
  };
};

const getType = (key: string, type: Ydb.IType): ts.PropertyAssignment => {
  const targetValue = factory.createPropertyAccessExpression(
    factory.createIdentifier(PARAMETER_NAME),
    `${snakeToCamelCaseConversion.ydbToJs(key)}!` // FIXME
  );
  return factory.createPropertyAssignment(
    key,
    getTypedValueCall(Variant.TypedValue, type, targetValue)
  );
};

const getTypedValueCall = (
  variant: Variant,
  type: Ydb.IType,
  argument: ts.PropertyAccessExpression
) => {
  if (!type.typeId) return getContainerType(variant, type, argument);
  const functionName = getPrimitivePropertyAccess(variant, type);
  return variant === Variant.Type
    ? functionName
    : factory.createCallExpression(functionName, undefined, [argument]);
};

const getContainerType: Handler<Ydb.IType> = (
  variant,
  type,
  argument
): ts.CallExpression => {
  if (type.listType) return getListType(variant, type.listType, argument);
  if (type.optionalType)
    return getOptionalType(variant, type.optionalType, argument);
  if (type.structType) return getStructType(variant, type.structType, argument);
  // if (type.variantType) return getVariantType(type.variantType);
  return factory.createCallExpression(
    factory.createIdentifier("kek"),
    undefined,
    undefined
  );
};

const getListType = (
  variant: Variant,
  type: Ydb.IListType,
  argument: ts.PropertyAccessExpression
) => {
  const functionName = getPropertyAccess(variant, "list");
  const subType = getTypedValueCall(Variant.Type, type.item!, argument);
  const args = [subType];
  if (variant === Variant.TypedValue) args.push(argument);
  return factory.createCallExpression(functionName, undefined, args);
};

const getOptionalType = (
  variant: Variant,
  type: Ydb.IOptionalType,
  argument: ts.PropertyAccessExpression
) => {
  const functionName = getPropertyAccess(variant, "optional");
  const subType = getTypedValueCall(variant, type.item!, argument);
  return factory.createCallExpression(functionName, undefined, [subType]);
};

const getStructType = (
  variant: Variant,
  type: Ydb.IStructType,
  argument: ts.PropertyAccessExpression
) => {
  const properties: ts.PropertyAssignment[] = [];
  for (const member of type.members!)
    properties.push(
      factory.createPropertyAssignment(
        snakeToCamelCaseConversion.ydbToJs(member.name!),
        getTypedValueCall(Variant.Type, member.type!, argument)
      )
    );
  const object = factory.createObjectLiteralExpression(properties, true);
  const args: ts.Expression[] = [object];
  if (variant === Variant.TypedValue) args.push(argument);
  return factory.createCallExpression(
    getPropertyAccess(variant, "struct"),
    undefined,
    args
  );
};

const getPrimitivePropertyAccess = (
  variant: Variant,
  type: Ydb.IType
): ts.PropertyAccessExpression =>
  getPropertyAccess(variant, primitiveTypes[type.typeId!][variant]);

const getPropertyAccess = (variant: Variant, method: string) => {
  const identifier =
    variant === Variant.TypedValue ? TypedValues.name : Types.name;
  return factory.createPropertyAccessExpression(
    factory.createIdentifier(identifier),
    method
  );
};

enum Variant {
  TypedValue = "typedValue",
  Type = "type",
}

type Handler<T extends Ydb.Type | any> = (
  variant: Variant,
  type: T,
  argument: ts.PropertyAccessExpression
) => ts.CallExpression;

const PARAMETER_NAME = "variables";

export default createConvert;
