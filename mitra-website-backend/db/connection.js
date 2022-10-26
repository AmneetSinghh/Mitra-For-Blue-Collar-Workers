const Pool = require("pg").Pool;

const pool = new Pool({
    user: "amneet",
    password: "",
    host: "localhost",
    port: "5433",
    database: "mitra",
});

module.exports = pool;