"""Servidor de las pruebas e2e: el mismo http.server de la biblioteca estándar con el que se usa la
app, pero con una cola de 128 conexiones en vez de 5. Con varios navegadores en paralelo, la cola
por defecto rechazaba conexiones (ERR_CONNECTION_REFUSED). Lo arranca playwright.config.js."""
import http.server as h

h.ThreadingHTTPServer.request_queue_size = 128
h.test(HandlerClass=h.SimpleHTTPRequestHandler, ServerClass=h.ThreadingHTTPServer, port=8000, bind="127.0.0.1")
