const express = require("express");
const app  = express();
const cors = require("cors");
const pool = require("./db/connection");

// middle ware.
app.use(cors());

app.use(express.json());


console.log(pool);

app.post("/todos", async (req, res) => {
    try {
        const { tododescription } = req.body;
        const newTodo = await pool.query("INSERT INTO todo  (description) VALUES($1) RETURNING *",
            [tododescription]
        );
        return res.json(newTodo.rows);
    } catch (err) {
        console.log(err.message);
    }
})

app.listen(5000,() =>{
    console.log("Server has started on port 5000");
});
