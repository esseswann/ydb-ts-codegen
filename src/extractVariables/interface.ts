import ts, { factory, QuestionToken, SyntaxKind } from "typescript";
import { snakeToCamelCaseConversion, Ydb } from "ydb-sdk";
import { capitalizeFirstLetter } from "../utils";

const createInterface = (name: string) => {
  const properties: ts.PropertySignature[] = [];
  return {
    append: (key: string, value: Ydb.IType) =>
      properties.push(getType(key, value)),
    get: () =>
      factory.createInterfaceDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        capitalizeFirstLetter(name),
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
    ? factory.createTypeReferenceNode(getPrimitiveType(type.typeId))
    : getContainerType(type);

const getPrimitiveType = (typeId: Ydb.Type.PrimitiveTypeId): string => {
  switch (typeId) {
    case Ydb.Type.PrimitiveTypeId.BOOL:
      return "bool";
    case Ydb.Type.PrimitiveTypeId.INT8:
    case Ydb.Type.PrimitiveTypeId.UINT8:
    case Ydb.Type.PrimitiveTypeId.INT16:
    case Ydb.Type.PrimitiveTypeId.UINT16:
    case Ydb.Type.PrimitiveTypeId.INT32:
    case Ydb.Type.PrimitiveTypeId.UINT32:
    case Ydb.Type.PrimitiveTypeId.INT64:
    case Ydb.Type.PrimitiveTypeId.UINT64:
    case Ydb.Type.PrimitiveTypeId.FLOAT:
    case Ydb.Type.PrimitiveTypeId.DOUBLE:
      return "number";
    case Ydb.Type.PrimitiveTypeId.DATE:
    case Ydb.Type.PrimitiveTypeId.DATETIME:
    case Ydb.Type.PrimitiveTypeId.TIMESTAMP:
    case Ydb.Type.PrimitiveTypeId.TZ_DATE:
    case Ydb.Type.PrimitiveTypeId.TZ_DATETIME:
    case Ydb.Type.PrimitiveTypeId.TZ_TIMESTAMP:
      return "Date";
    case Ydb.Type.PrimitiveTypeId.INTERVAL:
    case Ydb.Type.PrimitiveTypeId.STRING:
    case Ydb.Type.PrimitiveTypeId.UTF8:
    case Ydb.Type.PrimitiveTypeId.YSON:
    case Ydb.Type.PrimitiveTypeId.UUID:
      return "string";
    case Ydb.Type.PrimitiveTypeId.JSON:
    case Ydb.Type.PrimitiveTypeId.JSON_DOCUMENT:
    case Ydb.Type.PrimitiveTypeId.DYNUMBER:
    case Ydb.Type.PrimitiveTypeId.PRIMITIVE_TYPE_ID_UNSPECIFIED:
      return "any";
  }
};

const getContainerType = (type: Ydb.IType): ts.TypeNode => {
  if (type.listType) return getListType(type);
  if (type.emptyListType) return getListType(type);
  if (type.nullType) return factory.createTypeReferenceNode("null");
  if (type.variantType) return factory.createTypeReferenceNode("null");
  if (type.structType) return getStructType(type);
  return factory.createTypeReferenceNode("any");
};

const getListType = (type: Ydb.IType): ts.ArrayTypeNode =>
  factory.createArrayTypeNode(getTypeValue(type.listType!.item!));

const getStructType = (type: Ydb.IType): ts.TypeNode => {
  const members: ts.PropertySignature[] = [];
  for (const member of type.structType!.members!)
    members.push(getType(member.name!, member.type!));
  const objectLiteral = factory.createTypeLiteralNode(members);
  return objectLiteral;
};

export default createInterface;
