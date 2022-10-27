const pool = require("../db/connection");


async function getCityIdByName(name) {
    const city = await pool.query("SELECT * from cities where name=$1",
        [name]
    );
    if (city && city.rows.length > 0) {
        return city.rows[0].id;
    }
    return null;
}

async function getCities(name) {
    const city = await pool.query("SELECT name from cities;");
    return city;
}


module.exports = {
    getCityIdByName,
    getCities
};