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
    orders_url = f"{FIREBASE_URL}/pedidos/{order_id}.json"

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
    orders_url = f"{FIREBASE_URL}/pedidos.json"
    response = requests.get(orders_url)

    if response.status_code == 200:
        orders = response.json()
        return jsonify(orders), 200
    else:
        return {"error": "No se pudo obtener las órdenes"}, 500

# Modificar una orden existente
@app.route('/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    updated_order = request.get_json()
    if not updated_order:
        return {"error": "Datos de la orden no proporcionados"}, 400

    # Verificar si la orden existe
    order_url = f"{FIREBASE_URL}/pedidos/{order_id}.json"
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

# Eliminar una orden
@app.route('/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    order_url = f"{FIREBASE_URL}/pedidos/{order_id}.json"
    response = requests.delete(order_url)

    if response.status_code == 200:
        return {"message": "Orden eliminada correctamente"}, 200
    else:
        return {"error": "No se pudo eliminar la orden"}, 500

if __name__ == '__main__':
    app.run(debug=True, port=4000)
