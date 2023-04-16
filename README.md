# ydb-ts-codegen
Generates TypeScript queries from sql files.


Given a file `complex.sql`
```sql
declare $primitive as Uint64;
declare $optional_primitive as Optional<Datetime>;
declare $list as List<Struct<id: Uint64, created_at: Datetime, sublist: List<Optional<Uint64>>>>;

select * from As_Table($list)
 where id = $primitive
    or created_at = $optional_primitive;
```

will generate 
```typescript
import { Driver, Session, TypedValues, Types, withRetries } from "ydb-sdk";

export interface ComplexVariables {
  list: {
    createdAt: Date;
    id: number;
    sublist: any[];
  }[];
  primitive: number;
  optionalPrimitive?: Date;
}

function prepareComplexVariables(variables: ComplexVariables) {
  return {
    $list: TypedValues.list(
      Types.struct({
        created_at: Types.DATETIME,
        id: Types.UINT64,
        sublist: Types.list(Types.optional(Types.UINT64)),
      }),
      variables.list
    ),
    $primitive: TypedValues.uint64(variables.primitive),
    $optional_primitive: TypedValues.optional(
      TypedValues.datetime(variables.optionalPrimitive!)
    ),
  };
}

export function executeComplex(
  driver: Driver,
  variables: ComplexVariables,
  queryOptions?: Parameters<Session["executeQuery"]>[2]
) {
  const payload = prepareComplexVariables(variables);
  const sql =
    "declare $primitive as Uint64;\r\ndeclare $optional_primitive as Optional<Datetime>;\r\ndeclare $list as List<Struct<id: Uint64, created_at: Datetime, sublist: List<Optional<Uint64>>>>;\r\n\r\nselect * from As_Table($list)\r\n where id = $primitive\r\n    or created_at = $optional_primitive;";
  async function sessionHandler(session: Session) {
    return withRetries(() => session.executeQuery(sql, payload, queryOptions));
  }
  const result = driver.tableClient.withSession(sessionHandler);
  return result;
}
```

## Usage
Work very much in progress. \
`src/processFolder` can be used directly to generate queries file from simple .sql files 