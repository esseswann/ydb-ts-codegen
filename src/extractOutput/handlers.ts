import { Ydb } from "ydb-sdk";
import { GetHandler, Handler } from "./stacks";

const getHandler =
  (context: Accumulator): GetHandler =>
  (symbol) => {
    const handler = symbol.startsWith('"')
      ? keyValue(symbol)
      : handlers[symbol as keyof typeof handlers]?.(context);

    if (handler) {
      return {
        append: (value: unknown) => {
          if (
            typeof value === "string" &&
            value.startsWith("$") &&
            context.variables.has(value)
          ) {
            value = context.variables.get(value);
          }
          handler.append(value as any);
        },
        build: handler.build,
      };
    }

    return undefined;
  };

const keyValue = (name: string): Handler<Ydb.IType, Ydb.IStructMember> => {
  let type: Ydb.IType;

  return {
    append: (symbol) => {
      type = symbol;
    },
    build: () => Ydb.StructMember.create({ name, type }),
  };
};

const containerTypeHandlers: Partial<ContainerTypeHandlers> = {
  StructType() {
    const members: Ydb.IStructMember[] = [];
    return {
      append: (member: Ydb.StructMember) => members.push(member),
      build: () =>
        Ydb.Type.create({
          structType: Ydb.StructType.create({
            members,
          }),
        }),
    };
  },
  OptionalType: () => {
    let item: Ydb.IType;

    return {
      append: (symbol: Ydb.IType) => (item = symbol),
      build: () =>
        Ydb.Type.create({
          optionalType: Ydb.OptionalType.create({
            item,
          }),
        }),
    };
  },
  ListType: () => {
    let item: Ydb.IType;

    return {
      append: (symbol: Ydb.IType) => (item = symbol),
      build: () =>
        Ydb.Type.create({
          listType: Ydb.ListType.create({
            item,
          }),
        }),
    };
  },
};

const syntaxHandlers: Record<string, AccumulatedHandler<unknown, unknown>> = {
  declare: (context): Handler<string | Value> => {
    let binding: string;
    let dataType: Value;

    return {
      append: (symbol) => {
        if (typeof symbol === "string") binding = symbol;
        else dataType = symbol;
      },
      build: () => {
        if (binding && dataType) {
          context.variables.set(binding, dataType);
          context.declares.set(binding, dataType);
        }
      },
    };
  },
  let: (context): Handler<string | any> => {
    let binding: string;
    let value: any;

    return {
      append: (symbol) => {
        if (binding) {
          value = symbol;
        } else {
          binding = symbol;
        }
      },
      build: () => {
        if (binding && value) {
          context.variables.set(binding, value);
        }
      },
    };
  },
  KqpTxResultBinding: (context): Handler<Type> => {
    let dataType: Type;

    return {
      append: (symbol) => {
        if (!dataType) {
          dataType = symbol;
        }
      },
      build: () => {
        context.resultSets.push(dataType);
      },
    };
  },
  DataType: (): Handler<string, Ydb.Type> => {
    let dataType: keyof typeof Ydb.Type.PrimitiveTypeId;

    return {
      append: (symbol) => {
        dataType =
          symbol.toUpperCase() as keyof typeof Ydb.Type.PrimitiveTypeId;
      },
      build: () =>
        Ydb.Type.create({
          typeId: Ydb.Type.PrimitiveTypeId[dataType],
        }),
    };
  },
};

const handlers = { ...containerTypeHandlers, ...syntaxHandlers };

export type Accumulator = {
  declares: Map<string, Value>;
  variables: Map<string, Value>;
  resultSets: Type[];
};

export type Type = {
  type: ContainerTypes;
};

type AccumulatedHandler<Entry, Result> = (
  accumulator: Accumulator
) => Handler<Entry, Result>;

type ContainerTypes = keyof Omit<Ydb.IType, "typeId" | "pgType">;

type ContainerTypeHandlers = {
  [K in Capitalize<ContainerTypes>]: AccumulatedHandler<
    unknown,
    Ydb.IType //NonNullable<Ydb.IType[Uncapitalize<K>]>
  >;
};

type Value = ContainerTypeHandlers[keyof ContainerTypeHandlers];

export default getHandler;
