from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# URL base de la base de datos Firebase
FIREBASE_URL = "https://muebleriajmz-e8289-default-rtdb.firebaseio.com"

# Crear una nueva orden con ID proporcionado manualmente
@app.route('/orders', methods=['POST'])
def create_order():
    new_order = request.get_json()
    if not new_order or "orderID" not in new_order:
        return {"error": "Datos de la orden no proporcionados o falta el campo 'orderID'"}, 400

    order_id = new_order["orderID"]
    orders_url = f"{FIREBASE_URL}/pedidos/pedidos/{order_id}.json"

    # Verificar si la orden con el ID ya existe
    existing_order = requests.get(orders_url)
    if existing_order.status_code == 200 and existing_order.json():
        return {"error": f"La orden con el ID '{order_id}' ya existe."}, 409

    # Guardar la nueva orden en Firebase
    response = requests.put(orders_url, json=new_order)

    if response.status_code == 200:
        return jsonify({"message": "Orden creada correctamente", "order": new_order}), 201
    else:
        return {"error": "No se pudo crear la orden"}, 500

# Obtener todas las órdenes (para la sección de administrador)
@app.route('/orders', methods=['GET'])
def get_all_orders():
    orders_url = f"{FIREBASE_URL}/pedidos/pedidos.json"
    response = requests.get(orders_url)

    if response.status_code == 200:
        orders = response.json()
        return jsonify(orders), 200
    else:
        return {"error": "No se pudo obtener las órdenes"}, 500


@app.route('/products/<category>', methods=['GET'])
def get_products_by_category(category):
    products_url = f"{FIREBASE_URL}/productos.json"  # URL base de los productos en Firebase
    response = requests.get(products_url)

    if response.status_code == 200:
        try:
            # Cargar los productos desde Firebase
            products = response.json()

            # Verificar que los productos sean un diccionario
            if isinstance(products, dict):
                # Obtener los productos de la categoría solicitada
                filtered_products = products.get(category, [])

                # Verificar si existen productos para la categoría
                if not filtered_products:
                    return {"message": f"No se encontraron productos para la categoría '{category}'"}, 404

                # Retornar los productos filtrados
                return jsonify({"category": category, "products": filtered_products}), 200
            else:
                # Si los datos no son un diccionario, lanzar error
                print("Formato inesperado de productos:", products)
                return {"error": "Formato inesperado de productos en Firebase"}, 500
        except Exception as e:
            # Capturar errores y devolver mensaje claro
            print("Error al procesar los datos de productos:", str(e))
            return {"error": "Error al procesar los datos de productos", "details": str(e)}, 500
    else:
        # Error al conectarse a Firebase
        print("Error al conectarse a Firebase:", response.text)
        return {"error": "No se pudo obtener los productos desde Firebase", "details": response.text}, 500



# Modificar una orden existente
@app.route('/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    updated_order = request.get_json()
    if not updated_order:
        return {"error": "Datos de la orden no proporcionados"}, 400

    # Verificar si la orden existe
    order_url = f"{FIREBASE_URL}/pedidos/pedidos/{order_id}.json"
    response = requests.get(order_url)

    if response.status_code == 200 and response.json():
        # Actualizar la orden en Firebase
        response = requests.patch(order_url, json=updated_order)

        if response.status_code == 200:
            return jsonify({"message": "Orden actualizada correctamente", "order": response.json()}), 200
        else:
            return {"error": "No se pudo actualizar la orden"}, 500
    else:
        return {"error": "Orden no encontrada"}, 404

# Microservicio (Python Flask) para eliminar la orden y reordenar los productos

@app.route('/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    # URL para acceder a la lista de pedidos
    orders_url = f"{FIREBASE_URL}/pedidos/pedidos.json"
    
    # Obtener todos los pedidos actuales
    response = requests.get(orders_url)

    if response.status_code != 200:
        print("Error al obtener los pedidos:", response.text)  # Depuración
        return jsonify({"error": "No se pudieron obtener los pedidos de Firebase", "details": response.text}), 500
    
    try:
        orders = response.json()
    except ValueError as e:
        print("Error al parsear la respuesta JSON:", str(e))  # Depuración
        return jsonify({"error": "Error al procesar la respuesta de Firebase", "details": str(e)}), 500

    # Verificar si la respuesta contiene pedidos
    if not orders:
        return jsonify({"error": "No hay pedidos disponibles para eliminar"}), 404
    
    # Filtrar los pedidos para eliminar el que coincide con el order_id
    updated_orders = [order for order in orders if order["orderID"] != order_id]

    # Si el número de pedidos ha cambiado, actualizamos Firebase
    if len(updated_orders) != len(orders):
        # Reemplazar la lista de pedidos existente en Firebase con la lista actualizada
        updated_data = {"pedidos": updated_orders}

        # Realizar el PUT solo sobre la ruta correcta para actualizar los pedidos sin crear un nuevo apartado
        update_response = requests.put(f"{FIREBASE_URL}/pedidos.json", json=updated_data)

        if update_response.status_code == 200:
            return jsonify({"message": "Orden eliminada correctamente"}), 200
        else:
            print("Error al actualizar los pedidos:", update_response.text)  # Depuración
            return jsonify({"error": "No se pudo actualizar la lista de pedidos", "details": update_response.text}), 500
    else:
        return jsonify({"error": "No se encontró la orden para eliminar"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=4000)
