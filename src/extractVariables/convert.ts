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

const getType = (key: string, type: Ydb.IType): ts.PropertyAssignment => {
  const targetValue = factory.createPropertyAccessExpression(
    factory.createIdentifier(PARAMETER_NAME),
    snakeToCamelCaseConversion.ydbToJs(key)
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
  if (type.listType) return getListType(type.listType, argument);
  if (type.optionalType) return getOptionalType(type.optionalType, argument);
  if (type.structType) return getStructType(variant, type.structType, argument);
  // if (type.variantType) return getVariantType(type.variantType);
  return factory.createCallExpression(
    factory.createIdentifier("kek"),
    undefined,
    undefined
  );
};

const getListType = (
  type: Ydb.IListType,
  argument: ts.PropertyAccessExpression
) => {
  const functionName = getPropertyAccess(Variant.TypedValue, "list");
  const subType = getTypedValueCall(Variant.Type, type.item!, argument);
  return factory.createCallExpression(functionName, undefined, [
    subType,
    argument,
  ]);
};

const getOptionalType = (
  type: Ydb.IOptionalType,
  argument: ts.PropertyAccessExpression
) => {
  const functionName = factory.createPropertyAccessExpression(
    factory.createIdentifier(TypedValues.name),
    snakeToCamelCaseConversion.ydbToJs("optional")
  );
  const subType = getTypedValueCall(Variant.TypedValue, type.item!, argument);
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
        member.name!,
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
): ts.PropertyAccessExpression => {
  let method = primitiveTypes[type.typeId!][
    variant === Variant.Type ? "type" : "typedValue"
  ] as string;
  return getPropertyAccess(variant, method);
};

const getPropertyAccess = (variant: Variant, method: string) => {
  const identifier =
    variant === Variant.TypedValue ? TypedValues.name : Types.name;
  return factory.createPropertyAccessExpression(
    factory.createIdentifier(identifier),
    snakeToCamelCaseConversion.ydbToJs(method)
  );
};

enum Variant {
  TypedValue,
  Type,
}

type Handler<T extends Ydb.Type | any> = (
  variant: Variant,
  type: T,
  argument: ts.PropertyAccessExpression
) => ts.CallExpression;

const PARAMETER_NAME = "variables";

export default createConvert;
