import { TypedValues, Types, Driver, Session } from "ydb-sdk";

interface DeclareVariables {
    connection_id: Parameters<typeof TypedValues.utf8>;
    kek: Parameters<typeof TypedValues.utf8>;
}

export function executeDeclare(driver: Driver, variables: DeclareVariables) {
    const sql = "declare $connection_id as Utf8;\r\ndeclare $kek as Utf8;\r\n$user_id = select u.id\r\n             from `auth/session` s\r\n             join `auth/token_request` view session_id_idx tr\r\n               on tr.session_id = s.session_id\r\n             join `auth/token_confirmation` tc\r\n               on tc.id = tr.id\r\n        left join `auth/logout` l\r\n               on l.session_id = s.session_id\r\n             join `auth/user` view email_idx u\r\n               on u.email = tr.email\r\n            where s.connection_id = $connection_id;";
    const payload = {
        $connection_id: TypedValues.fromNative(Types.UTF8, variables.connection_id),
        $kek: TypedValues.fromNative(Types.UTF8, variables.kek)
    };
    async function sessionHandler(session: Session) {
        return session.executeQuery(sql, payload);
    }
    const result = driver.tableClient.withSession(sessionHandler);
    return result;
}