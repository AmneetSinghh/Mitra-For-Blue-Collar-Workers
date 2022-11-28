const pool = require("../db/connection");


async function getUserByPhonNumber(phonenumber) {
    const user = await pool.query("SELECT * from users where phonenumber=$1",
        [phonenumber]
    );
    if (user && user.rows.length > 0) {
        return user.rows[0].id;
    }
    return null;
}

async function getUserByUserId(userid) {
    const user = await pool.query("SELECT u.*,c.name as city  from users u LEFT JOIN cities c on u.cityid = c.id where u.id=$1 limit 1;",
        [userid]
    );
    if (user && user.rows.length > 0) {
        return user.rows[0];
    }
    return null;
}


module.exports = {
    getUserByPhonNumber,
    getUserByUserId
};
