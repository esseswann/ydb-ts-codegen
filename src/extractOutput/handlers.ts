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
          handler.append(value);
        },
        build: handler.build,
      };
    }

    return undefined;
  };

const keyValue = (key: string): Handler => {
  let value: Type;

  return {
    append: (symbol: Type) => {
      value = symbol;
    },
    build: () => ({ key, value }),
  };
};

const containerTypeHandlers: Partial<
  Record<Capitalize<ContainerTypes>, AccumulatedHandler>
> = {
  StructType(): Handler<Entry, Type> {
    const entries: Record<string, Type> = {};
    return {
      append: ({ key, value }) => (entries[key] = value),
      build: () => ({
        type: "StructType",
        entries,
      }),
    };
  },
  OptionalType: (): Handler<Type, Type> => {
    let optionalType: Type;

    return {
      append: (symbol) => (optionalType = symbol),
      build: () => ({
        type: "Optional",
        item: optionalType,
      }),
    };
  },
  ListType: (): Handler<Type, Type> => {
    const list: Type[] = [];

    return {
      append: (symbol) => {
        list.push(symbol);
      },
      build: () => ({
        type: "List",
        items: list,
      }),
    };
  },
};

const syntaxHandlers: Record<string, AccumulatedHandler> = {
  declare: (context): Handler<string | Type> => {
    let binding: string;
    let dataType: Type;

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
  DataType: (): Handler<string> => {
    let dataType: string;

    return {
      append: (symbol) => {
        dataType = symbol;
      },
      build: () => ({
        type: dataType,
      }),
    };
  },
};

const handlers = { ...containerTypeHandlers, ...syntaxHandlers };

export type Accumulator = {
  declares: Map<string, Type>;
  variables: Map<string, Type>;
  resultSets: Type[];
};

type Type = {
  type: string;
};

type Entry = { key: string; value: Type };

type AccumulatedHandler = (accumulator: Accumulator) => Handler;
type ContainerTypes = keyof Omit<Ydb.IType, "typeId" | "pgType">;

export default getHandler;
