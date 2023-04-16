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
import { TypedValues, Types, Driver, Session, withRetries } from "ydb-sdk";

export interface ComplexVariables {
    optionalPrimitive?: Date;
    primitive: number;
    list: {
        createdAt: Date;
        id: number;
        sublist: number[];
    }[];
}

function prepareComplexVariables(variables: ComplexVariables) {
    return {
        $optional_primitive: TypedValues.optional(TypedValues.datetime(variables.optionalPrimitive!)),
        $primitive: TypedValues.uint64(variables.primitive!),
        $list: TypedValues.list(Types.struct({
            createdAt: Types.DATETIME,
            id: Types.UINT64,
            sublist: Types.list(Types.optional(Types.UINT64))
        }), variables.list!)
    };
}

function executeComplex(driver: Driver, variables: ComplexVariables, queryOptions?: Parameters<Session["executeQuery"]>[2]) {
    const payload = prepareComplexVariables(variables);
    const sql = "declare $primitive as Uint64;\r\ndeclare $optional_primitive as Optional<Datetime>;\r\ndeclare $list as List<Struct<id: Uint64, created_at: Datetime, sublist: List<Optional<Uint64>>>>;\r\n\r\nselect * from As_Table($list)\r\n where id = $primitive\r\n    or created_at = $optional_primitive;";
    async function sessionHandler(session: Session) {
        return withRetries(() => session.executeQuery(sql, payload, queryOptions));
    }
    const result = driver.tableClient.withSession(sessionHandler);
    return result;
}

export default executeComplex;
```

## Usage
Work very much in progress, but we use it in production. \
Here is an example on how to use the library. Notice that it's important to pass connection to the database, because this is how it finds out about input (and in the future output) types
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