using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;


namespace orderManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ordersController : ControllerBase
    {
        private const string FirebaseBaseUrl = "https://muebleriajmz-e8289-default-rtdb.firebaseio.com";

        [HttpPatch("{orderId}/status")]
        public IActionResult SetOrderStatus(string orderId, [FromBody] JsonElement body)
        {
            // Verifica si el cuerpo contiene "orderStatus"
            if (!body.TryGetProperty("orderStatus", out JsonElement orderStatusElement) || string.IsNullOrEmpty(orderStatusElement.GetString()))
            {
                return BadRequest(new { message = "El campo 'orderStatus' es obligatorio" });
            }

            string orderStatus = orderStatusElement.GetString();

            // Consultar todas las órdenes en Firebase
            var client = new RestClient($"{FirebaseBaseUrl}/pedidos.json");
            var request = new RestRequest("", Method.Get);
            var response = client.Execute(request);

            if (response.IsSuccessful)
            {
                try
                {
                    // Deserializar las órdenes como una lista
                    var orders = JsonConvert.DeserializeObject<List<dynamic>>(response.Content);

                    if (orders == null || orders.Count == 0)
                    {
                        return NotFound(new { message = "No hay órdenes disponibles" });
                    }

                    // Buscar la orden por orderID
                    dynamic order = orders.FirstOrDefault(o => o["orderID"] == orderId);

                    if (order == null)
                    {
                        return NotFound(new { message = $"No se encontró una orden con ID {orderId}" });
                    }

                    // Actualizar el estado de la orden
                    order["orderStatus"] = orderStatus;

                    // Serializar la lista completa con la orden actualizada
                    var serializedOrders = JsonConvert.SerializeObject(orders);

                    // Configurar el cliente y la solicitud PUT
                    var updateClient = new RestClient($"{FirebaseBaseUrl}/pedidos.json");
                    var updateRequest = new RestRequest("", Method.Put);
                    updateRequest.AddParameter("application/json", serializedOrders, ParameterType.RequestBody);

                    var updateResponse = updateClient.Execute(updateRequest);

                    if (updateResponse.IsSuccessful)
                    {
                        return Ok(new { message = $"Orden {orderId} actualizada con estado {orderStatus}" });
                    }

                    return StatusCode((int)updateResponse.StatusCode, new
                    {
                        message = "Error al actualizar el estado de la orden",
                        details = updateResponse.Content
                    });
                }
                catch (JsonReaderException ex)
                {
                    return StatusCode(500, new { message = "Error al procesar las órdenes de Firebase", details = ex.Message });
                }
            }

            return StatusCode((int)response.StatusCode, new { message = "Error al obtener las órdenes", details = response.Content });
        }


        // Endpoint para obtener el estado de una orden
        [HttpGet("{orderId}/status")]
        public IActionResult GetOrderStatus(string orderId)
        {
            var client = new RestClient($"{FirebaseBaseUrl}/pedidos.json");
            var request = new RestRequest("", Method.Get);

            var response = client.Execute(request);

            if (response.IsSuccessful)
            {
                try
                {
                    // Deserializar el JSON como una lista de órdenes
                    var orders = JsonConvert.DeserializeObject<List<dynamic>>(response.Content);

                    if (orders == null || orders.Count == 0)
                    {
                        return NotFound(new { message = "No hay órdenes disponibles" });
                    }

                    // Buscar la orden por orderID
                    dynamic order = orders.FirstOrDefault(o => o["orderID"] == orderId);

                    if (order == null)
                    {
                        return NotFound(new { message = $"No se encontró una orden con ID {orderId}" });
                    }

                    // Extraer el estado de la orden
                    string orderStatus = order["orderStatus"] ?? "Estado no especificado";

                    return Ok(new { orderId, orderStatus });
                }
                catch (JsonReaderException ex)
                {
                    return StatusCode(500, new { message = "Error al procesar la respuesta de Firebase", details = ex.Message });
                }
            }

            return StatusCode((int)response.StatusCode, new { message = "Error al obtener las órdenes", details = response.Content });
        }
    }
}