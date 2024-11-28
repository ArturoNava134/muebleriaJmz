<?php

class db {
    private $project;

    public function __construct(string $project) {
        $this->project = $project;
    }

    public function runCurl(string $collection, string $document, string $method = 'GET', array $data = null) {
        $url = 'https://' . $this->project . '.firebaseio.com/' . $collection . '/' . $document . '.json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        if ($method === 'PUT' || $method === 'PATCH') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'response' => json_decode($response, true),
            'httpCode' => $httpCode
        ];
    }

    public function isUserInDB($name) {
        $res = $this->runCurl('usuarios', $name);
        return !is_null($res['response']);
    }

    public function obtainPassword($user) {
        $res = $this->runCurl('usuarios', $user);
        return $res['response'];
    }

    public function isCategoryInDB($name) {
        $res = $this->runCurl('productos', $name);
        return !is_null($res['response']);
    }

    public function obtainProducts($category) {
        $res = $this->runCurl('productos', $category);
        return $res['response'];
    }

    public function isLsbnInDB($clave) {
        $res = $this->runCurl('detalles', $clave);
        return !is_null($res['response']);
    }

    public function obtainDetails($isbn) {
        $res = $this->runCurl('detalles', $isbn);
        return $res['response'];
    }

    public function obtainMessage($code) {
        $res = $this->runCurl('respuestas', $code);
        return $res['response'];
    }

    // Nueva función: actualizar o agregar productos
    public function updtProducts(string $category, array $product) {
        if (!$this->isCategoryInDB($category)) {
            return false; // Si la categoría no existe, no se puede actualizar
        }

        // Obtener los productos actuales de la categoría
        $currentProducts = $this->obtainProducts($category);

        // Buscar si el producto ya existe (comparando por 'id')
        $productFound = false;
        foreach ($currentProducts as $index => $existingProduct) {
            if ($existingProduct['id'] === $product['id']) {
                $currentProducts[$index] = $product; // Actualizar el producto
                $productFound = true;
                break;
            }
        }

        if (!$productFound) {
            // Si no se encuentra el producto, agregarlo al final del arreglo
            $currentProducts[] = $product;
        }

        // Enviar los productos actualizados de vuelta a Firebase
        $res = $this->runCurl('productos', $category, 'PUT', $currentProducts);

        return $res['httpCode'] === 200; // Devuelve true si la operación fue exitosa
    }


    public function setProduct(string $category, array $product) {
        if (!$this->isCategoryInDB($category)) {
            return false; // Si la categoría no existe, no se puede agregar el producto
        }
    
        // Obtener los productos actuales de la categoría
        $currentProducts = $this->obtainProducts($category);
    
        // Asignar un nuevo ID si no se proporciona
        $product['id'] = $product['id'] ?? uniqid('PROD');
    
        // Agregar el nuevo producto al final del arreglo
        $currentProducts[] = $product;
    
        // Guardar los productos actualizados en Firebase
        $res = $this->runCurl('productos', $category, 'PUT', $currentProducts);
    
        return $res['httpCode'] === 200; // Devuelve true si la operación fue exitosa
    }    
    
    public function deleteProduct(string $category, string $productId) {
        if (!$this->isCategoryInDB($category)) {
            return false; // Si la categoría no existe, no se puede eliminar el producto
        }
        
        // Obtener los productos actuales de la categoría
        $currentProducts = $this->obtainProducts($category);
        
        // Buscar y eliminar el producto por ID
        $filteredProducts = array_filter($currentProducts, function ($product) use ($productId) {
            return $product['id'] !== $productId;
        });
        
        // Verificar si algún producto fue eliminado
        if (count($currentProducts) === count($filteredProducts)) {
            return false; // Ningún producto fue eliminado
        }
        
        // Guardar los productos actualizados en Firebase
        $res = $this->runCurl('productos', $category, 'PUT', array_values($filteredProducts));
        
        return $res['httpCode'] === 200; // Devuelve true si la operación fue exitosa
    }
    
    

    public function getProductById(string $category, string $productId) {
        if (!$this->isCategoryInDB($category)) {
            return null; // Si la categoría no existe, devolver null
        }

        // Obtener los productos de la categoría
        $products = $this->obtainProducts($category);

        // Buscar el producto por ID
        foreach ($products as $product) {
            if ($product['id'] === $productId) {
                return $product; // Devolver el producto si se encuentra
            }
        }

        return null; // Devolver null si no se encuentra el producto
    }
    
}


?>
