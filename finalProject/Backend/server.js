import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import path from 'path';
import winston from 'winston';
import fs from 'fs';
import { fileURLToPath } from 'url';

const saltRounds = 10;
const app = express();
// const path = require("path");

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
    const token = req.cookies.token; //     uperar el token del usuario desde las cookies
    if (!token) {
        return res.json({ Error: "You are not authenticated" });
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json({ Error: "Token is not valid" });
            } else {
                req.name = decoded.name; // Decodificar el nombre desde el token
                req.id = decoded.id; // Decodificar el ID desde el token
                next();
            }
        });
    }
};

app.use('/images', express.static(path.join(process.cwd(), '../Frontend/src/assets/products')));

// Actualizar el endpoint principal para devolver el nombre y el ID
app.get('/', verifyUser, (req, res) => {
    const sql = 'SELECT id FROM users WHERE userName = ?'; // Consultar el ID basado en el nombre de usuario

    db.query(sql, [req.name], (err, data) => {
        if (err) {
            return res.json({ Error: "Error fetching user data" });
        } else {
            return res.json({
                Status: "Success",
                name: req.name, // Enviar el nombre del usuario
                id: data[0]?.id, // Enviar el ID del usuario
            });
        }
    });
});




app.post('/Register', (req, res) => {
    const sql = "INSERT INTO users (userName, passwd, emailAddress) VALUES (?)";
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
                    const id = data[0].id; // Obtiene el ID del usuario desde la base de datos
                    const token = jwt.sign({ name, id }, "jwt-secret-key", { expiresIn: '1d' });
                    res.cookie('token', token);

                    return res.json({ 
                        Status: "Success", 
                        userId: id, // Devuelve el ID del usuario 
                        userName: name // Devuelve el nombre del usuario
                    });
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
    const apiProducts = 'http://localhost:81/ws/msProducts/apiPHP';

    // Fetch data from the external API
    axios.get(apiProducts)
        .then(apiRes => {
            if (apiRes.data.status === 'success') {
                // Aquí asociamos la URL de la imagen a cada producto
                const productsWithImages = apiRes.data.data.map(product => {
                    // Asegúrate de que el producto tiene un campo adecuado para identificar la imagen
                    const imagenNombre = `${product.id}.png`;  // Suponiendo que 'codigoProducto' es el campo que usas
                    return {
                        ...product,
                        imagen: imagenNombre  // Asocia el nombre de la imagen
                    };
                });

                // Enviar los productos con la imagen asociada
                res.json({ status: 'success', data: productsWithImages });
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
    const apiUrl = `http://localhost:81/ws/msProducts/apiPHP/${categoria}`;

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
    const apiDeleteProduct = `http://localhost:81/ws/msProducts/apiPHP/${categoria}/${id}`;

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
    const apiUrl = `http://localhost:81/ws/msProducts/apiPHP/${categoria}/${id}`;

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


app.get('/getOrders', async (req, res) => {
    const apiOrdersUrl = 'http://127.0.0.1:4000/orders'; // URL del microservicio

    try {
        // Solicitud al microservicio
        const response = await axios.get(apiOrdersUrl);

        // Verificar si el microservicio respondió con éxito
        if (response.status === 200) {
            res.status(200).json({
                status: 'success',
                data: response.data, // Pasar directamente la respuesta del microservicio
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error al obtener los pedidos desde el microservicio',
            });
        }
    } catch (error) {
        console.error('Error al comunicarse con el microservicio:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno al comunicarse con el microservicio',
            error: error.message,
        });
    }
});



// Eliminar orden y reordenar productos
app.delete('/deleteOrder/:id', (req, res) => {
    const { id } = req.params;
    
    const apiDeleteOrder = `http://127.0.0.1:4000/orders/${id}`; // Endpoint del microservicio

    // Enviar la solicitud DELETE al microservicio
    axios
        .delete(apiDeleteOrder)
        .then(apiRes => {
            if (apiRes.status === 200) { // Verificar si la eliminación fue exitosa
                return res.json({ status: 'success', message: 'Orden eliminada correctamente' });
            } else {
                return res.json({
                    status: 'error',
                    message: apiRes.data.message || 'Error al eliminar la orden desde el microservicio',
                });
            }
        })
        .catch(err => {
            console.error('Error en la solicitud DELETE:', err.message);
            return res.json({
                status: 'error',
                message: 'Error al comunicarse con el microservicio',
                error: err.message,
            });
        });
});



app.post('/createOrder', async (req, res) => {
    const apiOrdersUrl = 'http://127.0.0.1:4000/orders'; // URL del microservicio para obtener todas las órdenes

    try {
        // Obtener todas las órdenes para calcular el siguiente orderID
        const response = await axios.get(apiOrdersUrl);

        let lastOrderId = 0;

        if (response.status === 200 && response.data) {
            // Obtener el último ID si hay órdenes existentes
            const orders = response.data;
            if (orders.length > 0) {
                const lastOrder = orders.reduce((prev, current) =>
                    parseInt(prev.orderID) > parseInt(current.orderID) ? prev : current
                );
                lastOrderId = parseInt(lastOrder.orderID);
            }
        }

        // Crear un nuevo ID
        const newOrderId = lastOrderId + 1;

        // Preparar el payload para la nueva orden
        const newOrder = {
            orderID: newOrderId.toString(),
            clientID: req.body.clientID,
            orderAddress: req.body.orderAddress,
            productOrdered: req.body.productOrdered,
            productClasification: req.body.productClasification,
            orderQuantity: req.body.orderQuantity,
            orderAmount: req.body.orderAmount,
            orderStatus: "En proceso", // Valor por defecto
        };

        // Enviar la nueva orden al microservicio
        const postResponse = await axios.post(apiOrdersUrl, newOrder);

        if (postResponse.status === 201) {
            res.status(201).json({
                status: 'success',
                message: 'Orden creada correctamente',
                order: postResponse.data, // Pasar la respuesta del microservicio
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error al crear la orden en el microservicio',
            });
        }
    } catch (error) {
        console.error('Error al comunicarse con el microservicio:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno al comunicarse con el microservicio',
            error: error.message,
        });
    }
});


app.get('/getProduct/:categoria/:id', (req, res) => {
    const { categoria, id } = req.params; // Extraemos la categoría y el ID de los parámetros

    // Construir la URL del microservicio
    const apiUrl = `http://localhost:81/ws/msProducts/apiPHP/${categoria}/${id}`;

    // Realizar la solicitud al microservicio
    axios.get(apiUrl)
        .then(apiRes => {
            if (apiRes.data.status === 'success') {
                res.json({
                    status: 'success',
                    data: apiRes.data.data,
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: apiRes.data.message,
                });
            }
        })
        .catch(err => {
            console.error('Error fetching product:', err.message);
            res.status(500).json({
                status: 'error',
                message: 'Error fetching product',
                error: err.message,
            });
        });
});
 

import https from "https";

const agent = new https.Agent({
    rejectUnauthorized: false, // Ignorar certificados autofirmados
  });

app.get('/getOrdersByClient/:clientId', async (req, res) => {
    const clientId = req.params.clientId; // Obtener el ClientID de los parámetros de la URL
    const apiOrdersUrl = `http://localhost:52476/api/orders/client/${clientId}`; // URL del microservicio para obtener pedidos por ClientID

    try {
        // Realizar la solicitud al microservicio con el agente HTTPS
        const response = await axios.get(apiOrdersUrl, { httpsAgent: agent });

        // Verificar si la respuesta es exitosa
        if (response.status === 200) {
            return res.status(200).json({
                status: 'success',
                data: response.data, // Pasar los datos del microservicio
            });
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Error al obtener los pedidos desde el microservicio',
            });
        }
    } catch (error) {
        console.error('Error al comunicarse con el microservicio:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Error interno al comunicarse con el microservicio',
            error: error.message,
        });
    }
});


app.get('/getProductsByCategory/:category', async (req, res) => {
    const category = req.params.category; // Obtener la categoría desde los parámetros
    const apiProductsUrl = `http://127.0.0.1:4000/products/${category}`; // URL del microservicio Flask

    try {
        // Realizar la solicitud al microservicio de Flask
        const response = await axios.get(apiProductsUrl);

        // Verificar si la respuesta del microservicio fue exitosa
        if (response.status === 200) {
            // Agregar el atributo 'imagen' a cada producto
            const productsWithImages = response.data.products.map(product => ({
                ...product,
                imagen: `${product.id}.png`, // Asumimos que el nombre de la imagen es el ID del producto con la extensión .png
            }));

            res.status(200).json({
                status: 'success',
                category: category,
                products: productsWithImages, // Devolver productos con el atributo 'imagen'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error al obtener los productos desde el microservicio',
            });
        }
    } catch (error) {
        console.error('Error al comunicarse con el microservicio:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Error interno al comunicarse con el microservicio',
            error: error.message,
        });
    }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'notifications.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Ruta para actualizar la orden
app.put('/putOrders/:id', (req, res) => {
  const { id } = req.params; // ID de la orden
  const { orderStatus, clientID } = req.body; // El nuevo estado y el clientID

  if (!orderStatus) {
    return res.status(400).json({
      status: 'error',
      message: 'El campo orderStatus es requerido.',
    });
  }

  axios
    .put(`http://localhost:4000/orders/${id}`, { orderStatus }) // Microservicio de órdenes
    .then((apiRes) => {
      if (apiRes.status === 200) {
        // Registrar la notificación en el archivo de log usando Winston
        logger.info(`Tu pedido con ID: ${id} fue actualizado a ${orderStatus}`, {
          clientID,
          orderID: id,
          status: orderStatus,
          read: false // Nueva notificación, aún no leída
        });

        // Enviar el Webhook (Notificación) al cliente
        axios.post(`http://localhost:8081/webhook/${clientID}`, {
          message: `El estado de tu pedido ${id} ha sido actualizado a: ${orderStatus}`,
          orderID: id,
        })
        .then((response) => {
          console.log(`Notificación enviada correctamente a cliente ${clientID}`);
        })
        .catch((error) => {
          console.error('Error al enviar el webhook al cliente:', error.message);
        });

        res.status(200).json({
          message: 'Orden actualizada correctamente',
          order: apiRes.data.order, // Incluye la respuesta de la API del microservicio
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: apiRes.data.message || 'Error al actualizar la orden',
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

// Ruta para el webhook que recibe las notificaciones
app.post('/webhook/:clientID', (req, res) => {
    const { clientID } = req.params;
    const { message, orderID } = req.body;
  
    // Log de la notificación con la fecha personalizada
    const formattedTimestamp = new Date().toLocaleString(); // La fecha y hora formateada
    
    logger.info(`Notificación enviada a cliente ${clientID}: ${message}`, {
      clientID,
      orderID,
      message,
      read: false, // Nueva notificación, aún no leída
      timestamp: formattedTimestamp, // Añadir fecha y hora formateada
    });
  
    // Responder con la notificación y timestamp
    res.status(200).json({
      status: 'success',
      message: `Notificación enviada al cliente ${clientID}`,
      timestamp: formattedTimestamp // Pasamos el timestamp formateado al frontend
    });
  });
  
// Ruta para obtener las notificaciones del cliente y marcarlas como leídas
app.get('/getNotifications/:clientID', (req, res) => {
  const { clientID } = req.params;

  if (!clientID) {
    return res.status(400).json({ message: 'clientID es requerido' });
  }

  const logFilePath = path.join(__dirname, 'notifications.log');

  // Leemos el archivo de log
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de log:', err);
      return res.status(500).json({ message: 'Error al leer el archivo de log' });
    }

    const logEntries = data.split('\n');
    const clientNotifications = logEntries
      .map(entry => {
        try {
          return JSON.parse(entry); // Intentamos parsear cada línea como un JSON
        } catch (error) {
          return null; // Si no es un JSON válido, lo ignoramos
        }
      })
      .filter(entry => entry && entry.clientID === parseInt(clientID)); // Filtramos por clientID

    // No marcamos las notificaciones como leídas aquí, solo las devolvemos
    res.json({
      unreadCount: clientNotifications.filter(notif => !notif.read).length,
      notifications: clientNotifications, // Notificaciones sin cambios
    });
  });
});

// Ruta para marcar las notificaciones como leídas
app.put('/markNotificationsRead/:clientID', (req, res) => {
    const { clientID } = req.params;
  
    const logFilePath = path.join(__dirname, 'notifications.log');
  
    // Leemos el archivo de log
    fs.readFile(logFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer el archivo de log:', err);
        return res.status(500).json({ message: 'Error al leer el archivo de log' });
      }
  
      const logEntries = data.split('\n');
      let updatedLogs = [];
      let updatedNotifications = [];
  
      logEntries.forEach(entry => {
        try {
          const notif = JSON.parse(entry);
          if (notif && notif.clientID === parseInt(clientID) && !notif.read) {
            notif.read = true; // Marcamos la notificación como leída
            updatedNotifications.push(notif);
          }
          updatedLogs.push(JSON.stringify(notif)); // Añadimos el log actualizado
        } catch (error) {
          updatedLogs.push(entry); // Si no es un JSON válido, lo dejamos tal cual
        }
      });
  
      // Escribimos de nuevo el archivo de log con las notificaciones marcadas
      fs.writeFile(logFilePath, updatedLogs.join('\n'), 'utf8', (err) => {
        if (err) {
          console.error('Error al actualizar el archivo de log:', err);
          return res.status(500).json({ message: 'Error al actualizar el archivo de log' });
        }
  
        // Devolvemos las notificaciones marcadas como leídas
        res.json({
          status: 'success',
          message: 'Notificaciones marcadas como leídas',
          notifications: updatedNotifications,
        });
      });
    });
  });
  



// manage users
// Ruta para obtener un usuario por ID
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener el usuario', error: err });
      }
      res.json(results[0]);
    });
  });
  
  // Ruta para crear un nuevo usuario (con cifrado de contraseña)
  app.post('/users', (req, res) => {
    const { name, email, password } = req.body;
    
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.json({ Error: "Error al cifrar la contraseña" });
  
      const sql = 'INSERT INTO users (userName, passwd, emailAddress) VALUES (?, ?, ?)';
      const values = [name, hash, email];
  
      db.query(sql, values, (err, result) => {
        if (err) return res.json({ Error: "Error al insertar el usuario", error: err });
        res.status(201).json({ Status: "Success", userId: result.insertId });
      });
    });
  });
  
  // Ruta para actualizar un usuario (cifrado de contraseña si es necesario)
  app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
  
    // Si se actualiza la contraseña, se cifra
    let sql = 'UPDATE users SET userName = ?, emailAddress = ?';
    let values = [name, email];
  
    if (password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.json({ Error: "Error al cifrar la contraseña" });
  
        // Añadir el hash de la nueva contraseña a los valores de la consulta
        sql += ', passwd = ?';
        values.push(hash);
  
        db.query(sql + ' WHERE id = ?', [...values, id], (err) => {
          if (err) return res.status(500).json({ Error: "Error al actualizar el usuario", error: err });
          res.json({ Status: "Usuario actualizado exitosamente" });
        });
      });
    } else {
      // Si no se actualiza la contraseña, solo se actualizan los demás campos
      db.query(sql + ' WHERE id = ?', [...values, id], (err) => {
        if (err) return res.status(500).json({ Error: "Error al actualizar el usuario", error: err });
        res.json({ Status: "Usuario actualizado exitosamente" });
      });
    }   
  });
  
  // Ruta para eliminar un usuario
  app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al eliminar el usuario', error: err });
      }
      res.json({ Status: 'Usuario eliminado exitosamente' });
    });
  });

  // Endpoint para obtener todos los usuarios
app.get('/users', (req, res) => {
    const sql = 'SELECT id, userName, emailAddress FROM users'; // Selecciona solo los campos necesarios
    db.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error fetching users" });
        res.json(result); // Devuelve los usuarios en formato JSON
    });
});


app.listen(8081, () => {
    console.log("Listening on port 8081...");
});


