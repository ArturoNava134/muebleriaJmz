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

        [HttpGet("client/{clientId}")]
        public IActionResult GetOrdersByClientId(string clientId)
        {
            var client = new RestClient($"{FirebaseBaseUrl}/pedidos/pedidos.json");
            var request = new RestRequest("", Method.Get);

            var response = client.Execute(request);

            if (response.IsSuccessful)
            {
                try
                {
                    // Deserializar las órdenes como un array de objetos
                    var orders = JsonConvert.DeserializeObject<List<Order>>(response.Content);

                    if (orders == null || orders.Count == 0)
                    {
                        return NotFound(new { message = "No se encontraron órdenes disponibles" });
                    }

                    // Filtrar las órdenes por clientID
                    var filteredOrders = orders.Where(order => order.ClientID == clientId).ToList();

                    if (filteredOrders.Count == 0)
                    {
                        return NotFound(new { message = $"No se encontraron órdenes para el cliente con ID {clientId}" });
                    }

                    return Ok(new { clientId, orders = filteredOrders });
                }
                catch (JsonSerializationException ex)
                {
                    return StatusCode(500, new { message = "Error al procesar la respuesta de Firebase", details = ex.Message });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Error inesperado", details = ex.Message });
                }
            }

            return StatusCode((int)response.StatusCode, new { message = "Error al obtener las órdenes", details = response.Content });
        }


        public class Order
        {
            [JsonProperty("clientID")]
            public string ClientID { get; set; }

            [JsonProperty("orderAddress")]
            public string OrderAddress { get; set; }

            [JsonProperty("orderAmount")]
            public int OrderAmount { get; set; }

            [JsonProperty("orderID")]
            public string OrderID { get; set; }

            [JsonProperty("orderQuantity")]
            public int OrderQuantity { get; set; }

            [JsonProperty("orderStatus")]
            public string OrderStatus { get; set; }

            [JsonProperty("productClasification")]
            public string ProductClasification { get; set; }

            [JsonProperty("productOrdered")]
            public string ProductOrdered { get; set; }
        }




        [HttpPatch("{orderId}/status")]
        public IActionResult SetOrderStatus(string orderId, [FromBody] JsonElement body)
        {
            // Código existente para actualizar el estado de una orden
            if (!body.TryGetProperty("orderStatus", out JsonElement orderStatusElement) || string.IsNullOrEmpty(orderStatusElement.GetString()))
            {
                return BadRequest(new { message = "El campo 'orderStatus' es obligatorio" });
            }

            string orderStatus = orderStatusElement.GetString();

            var client = new RestClient($"{FirebaseBaseUrl}/pedidos/pedidos.json");
            var request = new RestRequest("", Method.Get);
            var response = client.Execute(request);

            if (response.IsSuccessful)
            {
                try
                {
                    var orders = JsonConvert.DeserializeObject<List<dynamic>>(response.Content);

                    if (orders == null || orders.Count == 0)
                    {
                        return NotFound(new { message = "No hay órdenes disponibles" });
                    }

                    dynamic order = orders.FirstOrDefault(o => o["orderID"] == orderId);

                    if (order == null)
                    {
                        return NotFound(new { message = $"No se encontró una orden con ID {orderId}" });
                    }

                    order["orderStatus"] = orderStatus;

                    var serializedOrders = JsonConvert.SerializeObject(orders);
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

        [HttpGet("{orderId}/status")]
        public IActionResult GetOrderStatus(string orderId)
        {
            // Código existente para obtener el estado de una orden
            var client = new RestClient($"{FirebaseBaseUrl}/pedidos/pedidos.json");
            var request = new RestRequest("", Method.Get);

            var response = client.Execute(request);

            if (response.IsSuccessful)
            {
                try
                {
                    var orders = JsonConvert.DeserializeObject<List<dynamic>>(response.Content);

                    if (orders == null || orders.Count == 0)
                    {
                        return NotFound(new { message = "No hay órdenes disponibles" });
                    }

                    dynamic order = orders.FirstOrDefault(o => o["orderID"] == orderId);

                    if (order == null)
                    {
                        return NotFound(new { message = $"No se encontró una orden con ID {orderId}" });
                    }

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
