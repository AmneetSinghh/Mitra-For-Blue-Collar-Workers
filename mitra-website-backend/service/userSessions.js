const pool = require("../db/connection");

async function insertIntoUserSessions(userId,status) {
        await pool.query("INSERT INTO user_sessions(id,userid,status,createdat,updatedat,deletedat"
        + ") VALUES(uuid_generate_v4(),$1,$2,now(),now(),null) RETURNING *",
            [userId, status]
        );
}

async function getLatestUserSession(userId) {
    const response = await pool.query("SELECT status from user_sessions where userid=$1 order by createdat desc limit 1",
        [userId]
    );
    if (response && response.rows.length > 0) {
        return response.rows[0].status;
    }
    return null;
}

module.exports = {
    insertIntoUserSessions,
    getLatestUserSession
};
