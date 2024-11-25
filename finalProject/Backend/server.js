import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import axios from 'axios';


const saltRounds = 10;
const app = express();

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true
}));

app.use(cookieParser());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "muebleriajmz"
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({ Error: "You are not authenticated"});
    }else{
        jwt.verify(token, "jwt-secret-key", (err, decoded) =>{
            if(err){
                return res.json({ Error: "Token is not valid" });
            }else{
                req.name = decoded.name;
                next();
            }
        })
    }
}

app.get('/', verifyUser, (req, res) => {
    return res.json({Status: "Success", name: req.name});
})



app.post('/Register', (req, res) => {
    const sql = "INSERT INTO users (`userName`, `passwd`, `emailAddress`) VALUES (?)";
    const password = req.body.password.toString();

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.json({ Error: "Error hashing password" });

        const values = [
            req.body.name,
            hash,
            req.body.email
        ];

        db.query(sql, [values], (err, result) => {
            if (err) return res.json({ Error: "Error inserting data in server" });
            return res.json({ Status: "Success" });
        });
    });
});

app.post('/Login', async (req, res) => {
    const sql = 'SELECT * FROM users WHERE emailAddress = ? and crdtls = "user"';

    db.query(sql, [req.body.email], async (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            const password = req.body.password.toString();
            const storedHash = data[0].passwd;
            try {
                const isMatch = await bcrypt.compare(password, storedHash);
                if (isMatch) {
                    const name = data[0].userName;
                    const token = jwt.sign({ name }, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);

                    return res.json({ Status: "Success" });
                } else {
                    return res.json({ Error: "Password not matched" });
                }
            } catch (err) {
                return res.json({ Error: "Password comparison error" });
            }
        } else {
            return res.json({ Error: "Email not found" });
        }
    });
});


app.post('/LoginAdmin', async (req, res) => {
    const sql = 'SELECT * FROM users WHERE emailAddress = ? AND crdtls = "admin"';

    db.query(sql, [req.body.email], async (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            const password = req.body.password.toString();
            const storedHash = data[0].passwd;
            try {
                const isMatch = await bcrypt.compare(password, storedHash);
                if (isMatch) {
                    const name = data[0].userName;
                    const token = jwt.sign({ name }, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);

                    return res.json({ Status: "Success" });
                } else {
                    return res.json({ Error: "Password not matched" });
                }
            } catch (err) {
                return res.json({ Error: "Password comparison error" });
            }
        } else {
            return res.json({ Error: "Email not found" });
        }
    });
});


app.get('/Logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})


app.get('/getAllProducts', (req, res) => {
    const apiProducts = 'http://localhost:81/ws/msProducts/getAllProducts';
    // Fetch data from the external API
    // jsonhabitacion = axios.get(apiHabitacion)
    axios.get(apiProducts)
        .then(apiRes => {
            if (apiRes.data.status === 'success') {
                res.json({ status: 'success', data: apiRes.data.data });
            } else {
                res.json({ status: 'error', message: apiRes.data.message });
            }
        })
        .catch(err => res.json({ status: 'error', message: 'Error fetching products', error: err.message }));
});


app.post('/addProduct', (req, res) => {
    const { id, nombre, descripcion, precio, stock, categoria } = req.body;

    // Verificar que todos los campos requeridos estén presentes
    if (!id || !nombre || !descripcion || !precio || !stock || !categoria) {
        return res.status(400).json({
            status: 'error',
            message: 'Todos los campos son requeridos: id, nombre, descripcion, precio, stock, categoria.',
        });
    }

    // Construir la URL dinámica basada en la categoría
    const apiUrl = `http://localhost:81/ws/msProducts/setProduct/${categoria}`;

    // Enviar los datos al microservicio correspondiente
    axios
        .post(apiUrl, {
            id,
            nombre,
            descripcion,
            precio,
            stock,
        })
        .then((apiRes) => {
            if (apiRes.data.status === 'success') {
                res.status(201).json({
                    status: 'success',
                    message: 'Producto agregado correctamente',
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: apiRes.data.message || 'Error al agregar el producto',
                });
            }
        })
        .catch((err) => {
            res.status(500).json({
                status: 'error',
                message: 'Error comunicándose con el microservicio',
                error: err.message,
            });
        });
});

app.delete('/deleteProduct/:categoria/:id', (req, res) => {
    const { categoria, id } = req.params;
    const apiDeleteProduct = `http://localhost:81/ws/msProducts/deleteProduct/${categoria}/${id}`;

    // Enviar la solicitud DELETE sin body
    axios
        .delete(apiDeleteProduct)
        .then(apiRes => {
            if (apiRes.data.status === 'success') {
                res.json({ status: 'success', message: apiRes.data.message });
            } else {
                res.json({
                    status: 'error',
                    message: apiRes.data.message || 'Error eliminando producto',
                });
            }
        })
        .catch(err => {
            console.error('Error en la solicitud DELETE:', err.message);
            res.json({
                status: 'error',
                message: 'Error al comunicarse con el servidor backend',
                error: err.message,
            });
        });
});

app.put('/editProduct/:categoria/:id', (req, res) => {
    const { categoria, id } = req.params; // Extraemos la categoría y el ID de los parámetros
    const { nombre, descripcion, precio, stock } = req.body; // Extraemos el body del request

    // Verificar que todos los campos requeridos estén presentes
    if (!id || !nombre || !descripcion || !precio || !stock || !categoria) {
        return res.status(400).json({
            status: 'error',
            message: 'Todos los campos son requeridos: id, nombre, descripcion, precio, stock, categoria.',
        });
    }

    // Construir la URL dinámica basada en la categoría y el ID
    const apiUrl = `http://localhost:81/ws/msProducts/updtProducts/${categoria}/${id}`;

    // Enviar los datos al microservicio correspondiente
    axios
        .put(apiUrl, {
            id,
            nombre,
            descripcion,
            precio,
            stock,
        })
        .then((apiRes) => {
            if (apiRes.data.status === 'success') {
                res.status(200).json({
                    status: 'success',
                    message: 'Producto actualizado correctamente',
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: apiRes.data.message || 'Error al actualizar el producto',
                });
            }
        })
        .catch((err) => {
            console.error('Error en la solicitud PUT:', err.message);
            res.status(500).json({
                status: 'error',
                message: 'Error comunicándose con el microservicio',
                error: err.message,
            });
        });
});


app.get('/orders', (req, res) => {
    const apiGetOrders = 'http://127.0.0.1:4000/orders';
    axios.get(apiGetOrders)
    .then(apiRes => {
        if (apiRes.data.status === 'success'){
            res.json({ status: 'success', data: JSON.parse(apiRes.data.data)});
        } else{
            res.json({ status: 'error', message: 'Error fatching products', error: err.message });
        }
        })
        .catch(err => res.json({ status: 'error', message: 'Error fetching orders', error: err.message }));
});

app.listen(8081, () => {
    console.log("Listening on port 8081...");
});


