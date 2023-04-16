import ts, { factory, QuestionToken, SyntaxKind } from "typescript";
import { snakeToCamelCaseConversion, Ydb } from "ydb-sdk";
import primitiveTypes from "./primitiveTypes";

const createInterface = (name: string) => {
  const properties: ts.PropertySignature[] = [];
  return {
    append: (key: string, value: Ydb.IType) =>
      properties.push(getType(key, value)),
    get: () =>
      factory.createInterfaceDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        name,
        undefined,
        undefined,
        properties
      ),
  };
};

const getType = (key: string, type: Ydb.IType) =>
  factory.createPropertySignature(
    undefined,
    snakeToCamelCaseConversion.ydbToJs(key),
    ...getOptionalType(type)
  );

const getOptionalType = (
  input: Ydb.IType
): [QuestionToken | undefined, ts.TypeNode] => {
  let questionToken = undefined;
  let target = input;
  if (input.optionalType) {
    questionToken = factory.createToken(SyntaxKind.QuestionToken);
    target = input.optionalType.item!;
  }
  const type = getTypeValue(target);
  return [questionToken, type];
};

const getTypeValue = (type: Ydb.IType) =>
  type.typeId
    ? factory.createTypeReferenceNode(primitiveTypes[type.typeId].native)
    : getContainerType(type);

const getContainerType = (type: Ydb.IType): ts.TypeNode => {
  if (type.listType) return getListType(type.listType);
  if (type.nullType) return factory.createTypeReferenceNode("null");
  if (type.variantType) return factory.createTypeReferenceNode("null");
  if (type.structType) return getStructType(type.structType);
  if (type.variantType) return getVariantType(type.variantType);
  if (type.optionalType) return getOptionalType(type)[1]; // FIXME
  return factory.createTypeReferenceNode("any");
};

const getListType = (type: Ydb.IListType): ts.ArrayTypeNode =>
  factory.createArrayTypeNode(getTypeValue(type.item!));

const getStructType = (type: Ydb.IStructType): ts.TypeNode => {
  const members: ts.PropertySignature[] = [];
  for (const member of type.members!)
    members.push(getType(member.name!, member.type!));
  const objectLiteral = factory.createTypeLiteralNode(members);
  return objectLiteral;
};

const getVariantType = (type: Ydb.IVariantType) => {
  const members: ts.TypeNode[] = [];
  for (const member of type.tupleItems!.elements!)
    members.push(getTypeValue(member));
  return factory.createUnionTypeNode(members);
};

export default createInterface;
