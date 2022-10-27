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



module.exports = {
    getUserByPhonNumber,
};