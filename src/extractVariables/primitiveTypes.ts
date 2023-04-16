import { TypedValues, Types, Ydb } from "ydb-sdk";

const primitiveTypes: PrimitiveTypes = {
  [Ydb.Type.PrimitiveTypeId.BOOL]: {
    typedValue: "bool",
    type: "BOOL",
    native: "bool",
  },
  [Ydb.Type.PrimitiveTypeId.INT8]: {
    typedValue: "int8",
    type: "INT8",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.UINT8]: {
    typedValue: "uint8",
    type: "UINT8",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.INT16]: {
    typedValue: "int16",
    type: "INT16",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.UINT16]: {
    typedValue: "uint16",
    type: "UINT16",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.INT32]: {
    typedValue: "int32",
    type: "INT32",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.UINT32]: {
    typedValue: "uint32",
    type: "UINT32",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.INT64]: {
    typedValue: "int64",
    type: "INT64",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.UINT64]: {
    typedValue: "uint64",
    type: "UINT64",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.FLOAT]: {
    typedValue: "float",
    type: "FLOAT",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.DOUBLE]: {
    typedValue: "double",
    type: "DOUBLE",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.DATE]: {
    typedValue: "date",
    type: "DATE",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.DATETIME]: {
    typedValue: "datetime",
    type: "DATETIME",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.TIMESTAMP]: {
    typedValue: "timestamp",
    type: "BOOL",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.TZ_DATE]: {
    typedValue: "tzDate",
    type: "TZ_DATE",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.TZ_DATETIME]: {
    typedValue: "tzDatetime",
    type: "TZ_DATETIME",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.TZ_TIMESTAMP]: {
    typedValue: "tzTimestamp",
    type: "TZ_TIMESTAMP",
    native: "Date",
  },
  [Ydb.Type.PrimitiveTypeId.INTERVAL]: {
    typedValue: "interval",
    type: "INTERVAL",
    native: "string",
  },
  [Ydb.Type.PrimitiveTypeId.STRING]: {
    typedValue: "string",
    type: "STRING",
    native: "string",
  },
  [Ydb.Type.PrimitiveTypeId.UTF8]: {
    typedValue: "utf8",
    type: "UTF8",
    native: "string",
  },
  [Ydb.Type.PrimitiveTypeId.YSON]: {
    typedValue: "yson",
    type: "YSON",
    native: "any",
  },
  [Ydb.Type.PrimitiveTypeId.UUID]: {
    typedValue: "uuid",
    type: "UUID",
    native: "string",
  },
  [Ydb.Type.PrimitiveTypeId.JSON]: {
    typedValue: "json",
    type: "JSON",
    native: "any",
  },
  [Ydb.Type.PrimitiveTypeId.JSON_DOCUMENT]: {
    typedValue: "jsonDocument",
    type: "JSON_DOCUMENT",
    native: "any",
  },
  [Ydb.Type.PrimitiveTypeId.DYNUMBER]: {
    typedValue: "dynumber",
    type: "DYNUMBER",
    native: "number",
  },
  [Ydb.Type.PrimitiveTypeId.PRIMITIVE_TYPE_ID_UNSPECIFIED]: {
    typedValue: "json",
    type: "JSON",
    native: "any",
  },
};

type PrimitiveTypes = Record<Ydb.Type.PrimitiveTypeId, Config>;

type Config = {
  typedValue: keyof typeof TypedValues;
  type: keyof typeof Types;
  native: string;
};

export default primitiveTypes;
