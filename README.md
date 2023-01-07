# ydb-ts-codegen
Generates TypeScript queries from sql files. \
Given a file `user.sql`
```sql
declare $user_id as Utf8;
select *
  from `auth/user`
 where id = $user_id
```

will generate 
```typescript
import { TypedValues, Driver, Session } from "ydb-sdk";

interface UserVariables {
    userId: Parameters<typeof TypedValues.utf8>[0];
}

export function executeUser(variables: UserVariables, driver: Driver, queryOptions?: Parameters<Session["executeQuery"]>[2]) {
    const payload = {
        user_id: variables.userId
    };
    const sql = "declare $user_id as Utf8; \r\n select *\r\n  from `auth/user`\r\n where id = $user_id";
    async function sessionHandler(session: Session) {
        return session.executeQuery(sql, payload, queryOptions);
    }
    const result = driver.tableClient.withSession(sessionHandler);
    return result;
}
```
so it can be used as 
```typescript
const result = executeUser(driver, { userId: 'id' })
```

## Usage
Work very much in progress. \
`src/processFolder` can be used directly to generate queries file from simple .sql files 