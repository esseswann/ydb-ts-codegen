import { Ydb } from "ydb-sdk";
import { GetHandler, Handler } from "./stacks";

const getHandler =
  (context: Accumulator): GetHandler =>
  (rawSymbol: string) => {
    const symbol = rawSymbol?.startsWith("$")
      ? context.variables[rawSymbol] || context.declares[rawSymbol]
      : rawSymbol;

    if (typeof symbol !== "string") return undefined;

    const handler = symbol.startsWith('"')
      ? keyValue(symbol)
      : handlers[symbol as keyof typeof handlers]?.(context);

    if (handler) {
      return {
        append: (value: unknown) => {
          if (typeof value === "string") {
            const variable =
              context.variables[value] || context.declares[value];
            if (variable) value = variable;
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
  TupleType() {
    const elements: Ydb.IType[] = [];
    return {
      append: (element: Ydb.IType) => elements.push(element),
      build: () =>
        Ydb.Type.create({
          tupleType: Ydb.TupleType.create({
            elements,
          }),
        }),
    };
  },
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
  declare: (context): Handler<string | Ydb.Type> => {
    let binding: string;
    let dataType: Ydb.Type;

    return {
      append: (symbol) => {
        if (typeof symbol === "string") binding = symbol;
        else dataType = symbol;
      },
      build: () => {
        if (binding && dataType) {
          context.variables[binding] = dataType;
          context.declares[binding] = dataType;
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
          context.variables[binding] = value;
        }
      },
    };
  },
  KqpTxResultBinding: (context) => {
    let dataType: Ydb.Type;
    let unknown: string;
    let position: number;

    return {
      append: (symbol: Ydb.Type | string) => {
        if (typeof symbol === "string") {
          if (!unknown) unknown = symbol;
          else position = parseInt(symbol);
        } else if (!dataType) {
          dataType = symbol;
        }
      },
      build: () => {
        context.resultSets[position] = dataType;
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
  declares: Record<string, Ydb.Type | string>;
  variables: Record<string, Ydb.Type | string>;
  resultSets: Ydb.Type[];
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

export default getHandler;
