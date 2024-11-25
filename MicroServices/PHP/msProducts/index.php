<?php 
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/vendor/autoload.php';
require_once 'gestiondb.php'; // Ensure this file contains the Firebase connection and methods

$app = AppFactory::create();
$app->setBasePath("/ws/msProducts");

// Initialize Firebase connection
$project = 'muebleriajmz-e8289-default-rtdb';
$firebase = new db($project);

// Default route
$app->get('/', function (Request $request, Response $response, $args) {
    $response->getBody()->write("Hola Mundo Slim!!!");
    return $response;
});

// New route to get products from Firebase
$app->get('/getProducts/{categoria}', function (Request $request, Response $response, $args) use ($firebase) {
    $categoria = strtolower($args['categoria']); // Get category parameter and convert to lowercase

    // Check if category exists in Firebase
    if ($firebase->isCategoryInDB($categoria)) {
        $products = $firebase->obtainProducts($categoria);
        $json_data = json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $resp = [
            'code' => 200,
            'message' => 'Productos obtenidos correctamente',
            'data' => $json_data,
            'status' => 'success'
        ];
    } else {
        $resp = [
            'code' => 404,
            'message' => 'Categoría no encontrada',
            'data' => '',
            'status' => 'error'
        ];
    }

    $response->getBody()->write(json_encode($resp, JSON_PRETTY_PRINT));
    return $response->withHeader('Content-Type', 'application/json');
});

// Update an existing product
$app->put('/updtProducts/{categoria}/{id}', function (Request $request, Response $response, $args) use ($firebase) {
    $categoria = strtolower($args['categoria'] ?? ''); 
    $id = $args['id'] ?? ''; 
    $producto = $request->getParsedBody(); 

    if (empty($categoria) || empty($id) || empty($producto)) {
        $resp = [
            'code' => 400,
            'message' => 'Datos incompletos. Se requiere categoría, ID y datos del producto.',
            'status' => 'error'
        ];
    } else {
        if ($firebase->isCategoryInDB($categoria)) {
            $producto['id'] = $id;

            $updateStatus = $firebase->updtProducts($categoria, $producto);

            if ($updateStatus) {
                $resp = [
                    'code' => 200,
                    'message' => 'Producto actualizado correctamente',
                    'status' => 'success'
                ];
            } else {
                $resp = [
                    'code' => 500,
                    'message' => 'Error al actualizar el producto',
                    'status' => 'error'
                ];
            }
        } else {
            $resp = [
                'code' => 404,
                'message' => 'Categoría no encontrada',
                'status' => 'error'
            ];
        }
    }

    $response->getBody()->write(json_encode($resp, JSON_PRETTY_PRINT));
    return $response->withHeader('Content-Type', 'application/json');
});

// Add a new product by category
$app->post('/setProduct/{categoria}', function (Request $request, Response $response, $args) use ($firebase) {
    $categoria = strtolower($args['categoria']); // Obtener la categoría de la ruta
    $producto = $request->getParsedBody(); // Obtener el producto del cuerpo de la solicitud

    // Validar que se proporcionen los datos necesarios
    if (empty($categoria) || empty($producto)) {
        $resp = [
            'code' => 400,
            'message' => 'Datos incompletos. Se requiere categoría y datos del producto.',
            'status' => 'error'
        ];
    } else {
        if ($firebase->isCategoryInDB($categoria)) {
            $createStatus = $firebase->setProduct($categoria, $producto);

            if ($createStatus) {
                $resp = [
                    'code' => 201,
                    'message' => 'Producto agregado correctamente',
                    'status' => 'success'
                ];
            } else {
                $resp = [
                    'code' => 500,
                    'message' => 'Error al agregar el producto',
                    'status' => 'error'
                ];
            }
        } else {
            $resp = [
                'code' => 404,
                'message' => 'Categoría no encontrada',
                'status' => 'error'
            ];
        }
    }

    $response->getBody()->write(json_encode($resp, JSON_PRETTY_PRINT));
    return $response->withHeader('Content-Type', 'application/json');
});

// Delete a product by category and ID
$app->delete('/deleteProduct/{categoria}/{id}', function (Request $request, Response $response, $args) use ($firebase) {
    $categoria = strtolower($args['categoria'] ?? '');
    $id = $args['id'] ?? '';

    // Validar que se proporcionen los datos necesarios
    if (empty($categoria) || empty($id)) {
        $resp = [
            'code' => 400,
            'message' => 'Datos incompletos. Se requiere categoría e ID del producto.',
            'status' => 'error'
        ];
    } else {
        if ($firebase->isCategoryInDB($categoria)) {
            $deleteStatus = $firebase->deleteProduct($categoria, $id);

            if ($deleteStatus) {
                $resp = [
                    'code' => 200,
                    'message' => 'Producto eliminado correctamente',
                    'status' => 'success'
                ];
            } else {
                $resp = [
                    'code' => 404,
                    'message' => 'Producto no encontrado en la categoría especificada',
                    'status' => 'error'
                ];
            }
        } else {
            $resp = [
                'code' => 404,
                'message' => 'Categoría no encontrada',
                'status' => 'error'
            ];
        }
    }

    $response->getBody()->write(json_encode($resp, JSON_PRETTY_PRINT));
    return $response->withHeader('Content-Type', 'application/json');
});

// Route to get all products across all categories
$app->get('/getAllProducts', function (Request $request, Response $response, $args) use ($firebase) {
    // Fetch all categories
    $categories = ['comedor', 'habitacion', 'oficina', 'sala']; // Add more categories if necessary
    $allProducts = [];

    // Loop through each category to get products
    foreach ($categories as $category) {
        if ($firebase->isCategoryInDB($category)) {
            $products = $firebase->obtainProducts($category);

            // Add category to each product
            foreach ($products as &$product) {
                $product['categoria'] = $category;
            }

            // Merge products into the main array
            $allProducts = array_merge($allProducts, $products);
        }
    }

    if (!empty($allProducts)) {
        $resp = [
            'code' => 200,
            'message' => 'Todos los productos obtenidos correctamente',
            'data' => $allProducts,
            'status' => 'success'
        ];
    } else {
        $resp = [
            'code' => 404,
            'message' => 'No se encontraron productos',
            'data' => [],
            'status' => 'error'
        ];
    }

    $response->getBody()->write(json_encode($resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $response->withHeader('Content-Type', 'application/json');
});


$app->run();
