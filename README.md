# ydb-ts-codegen
[![Node version](https://img.shields.io/npm/v/ydb-codegen.svg?style=flat)](https://www.npmjs.com/package/ydb-codegen) \
Generates TypeScript queries from sql files.

Given a file `complex.sql`
```sql
declare $primitive as Uint64;
declare $optional_primitive as Optional<Datetime>;
declare $list as List<Struct<id: Uint64, created_at: Datetime, sublist: List<Struct<paid_for: Optional<Uint64>>>>>;

select * from As_Table($list)
 where id = $primitive
    or created_at = $optional_primitive;

select *
  from company;
```

will generate
```typescript
import { TypedData, TypedValues, Types, Driver, Session, withRetries } from "ydb-sdk";

import Long from "long";

export interface ComplexVariables {
    list: {
        "created_at": Date;
        "id": number | Long;
        "sublist": {
            "paid_for"?: number | Long;
        }[];
    }[];
    optionalPrimitive?: Date;
    primitive: number | Long;
}

function prepareComplexVariables(variables: ComplexVariables) {
    return {
        $list: TypedValues.list(Types.struct({
            "created_at": Types.DATETIME,
            "id": Types.UINT64,
            "sublist": Types.list(Types.struct({
                "paid_for": Types.optional(Types.UINT64)
            }))
        }), variables.list!),
        $optional_primitive: TypedValues.optional(TypedValues.datetime(variables.optionalPrimitive!)),
        $primitive: TypedValues.uint64(variables.primitive!)
    };
}

export interface ComplexResult0 {
    "created_at": Date;
    "id": number | Long;
    "sublist": {
        "paid_for"?: number | Long;
    }[];
}

export interface ComplexResult1 {
    "id": number | Long;
    "name"?: string;
}

async function executeComplex(driver: Driver, variables: ComplexVariables, queryOptions?: Parameters<Session["executeQuery"]>[2]) {
    const payload = prepareComplexVariables(variables);
    const sql = "declare $primitive as Uint64;\r\ndeclare $optional_primitive as Optional<Datetime>;\r\ndeclare $list as List<Struct<id: Uint64, created_at: Datetime, sublist: List<Struct<paid_for: Optional<Uint64>>>>>;\r\n\r\nselect * from As_Table($list)\r\n where id = $primitive\r\n    or created_at = $optional_primitive;\r\n\r\nselect *\r\n  from company;";
    async function sessionHandler(session: Session) {
        return withRetries(() => session.executeQuery(sql, payload, queryOptions));
    }
    const response = await driver.tableClient.withSession(sessionHandler);
    const result = {
        ComplexResult0: TypedData.createNativeObjects(response.resultSets[0]) as unknown as ComplexResult0[],
        ComplexResult1: TypedData.createNativeObjects(response.resultSets[1]) as unknown as ComplexResult1[]
    };
    return result;
}

export default executeComplex;
```

so you can then use it like this with all the nice typings:
```typescript
executeComplex(driver, {
    list: [{ id: 1, created_at: new Date(), sublist: [] }],
    primitive: 1,
}).then(console.log)

```

## Usage
Work very much in progress, but we use it in production. \
Here is an example on how to use the library. Notice that it's important to pass connection to the database, because this is how it finds out about input (and in the future output) types. It's recommended to use `IamAuthService()` but you can also try `getCredentialsFromEnv()`
```typescript
import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import { Driver, IamAuthService, getSACredentialsFromJson } from "ydb-sdk";
import { processFolder } from "ydb-codegen";

const config = {
  endpoint: process.env["DATABASE_ENDPOINT"],
  database: process.env["DATABASE_NAME"],
};

const saCredentials = getSACredentialsFromJson("./authorized_key.json");
const authService = new IamAuthService(saCredentials);

const driver = new Driver({
  authService,
  ...config,
});

processFolder(".", driver).then((files) =>
  files.forEach((file) =>
    writeFile(`./my/output/${file.name}.ts`, file.content)
  )
);
```
