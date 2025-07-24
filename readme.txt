# Gráfico de Trading con Lightweight Charts

---

## 📈 Descripción General

Este proyecto implementa una aplicación web interactiva para visualizar datos de trading en tiempo real, utilizando la librería **Lightweight Charts**. Permite a los usuarios seleccionar diferentes pares de activos y marcos de tiempo (intervalos de velas), y visualizar indicadores técnicos populares como el **Estocástico**, **RSI (Índice de Fuerza Relativa)**, **Bandas de Bollinger**, **Parabolic SAR** y **Fractales de Bill Williams**.

El objetivo principal es proporcionar una herramienta clara y personalizable para el análisis técnico de precios, con sincronización de la escala de tiempo entre el gráfico principal y los subgráficos de indicadores.

---

## ✨ Características Principales

* **Gráfico de Velas Interactivo:** Visualiza el precio de los activos con datos históricos y en tiempo real.
* **Selección de Activos:** Cambia fácilmente entre diferentes pares de criptomonedas (ej. BTC/USDT, ETH/USDT).
* **Selección de Intervalos:** Ajusta el marco de tiempo de las velas (ej. 1 minuto, 5 minutos, 1 hora, 1 día).
* **Indicadores Técnicos Personalizables:**
    * **Estocástico:** Líneas %K y %D con zonas de sobrecompra/sobreventa (80/20).
    * **RSI:** Gráfico del Índice de Fuerza Relativa con zonas de sobrecompra/sobreventa (70/30).
    * **Bandas de Bollinger:** Muestra la media móvil simple, banda superior e inferior.
    * **Parabolic SAR:** Puntos que indican posibles reversiones de tendencia.
    * **Fractales de Bill Williams:** Marcadores visuales de fractales alcistas y bajistas.
* **Configuración de Indicadores:** Ajusta los parámetros de cada indicador (ej. períodos, factores de aceleración) directamente desde la interfaz.
* **Sincronización de Gráficos:** El scroll y zoom en cualquier subgráfico se refleja en los demás, manteniendo la coherencia visual.
* **Autoscroll:** Opción para seguir automáticamente la vela más reciente, o desactivarla para un análisis detallado del historial.
* **Datos en Tiempo Real:** Conectividad a través de WebSockets con la API de Binance para actualizaciones de precios en vivo.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura de la página.
* **CSS3 (SCSS):** Estilos y diseño responsivo.
* **JavaScript (ES6+):** Lógica principal, cálculos de indicadores y manejo de API/WebSocket.
* **Lightweight Charts:** Librería para la representación de gráficos financieros.
* **Binance API (REST & WebSockets):** Obtención de datos históricos y en tiempo real.

---

## 🚀 Cómo Ejecutar el Proyecto

Para ejecutar este proyecto localmente, sigue estos pasos:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/nombre-del-repositorio.git](https://github.com/tu-usuario/nombre-del-repositorio.git)
    ```
2.  **Navega al directorio del proyecto:**
    ```bash
    cd nombre-del-repositorio
    ```
3.  **Abre `index.html` en tu navegador:**
    Simplemente haz doble clic en el archivo `index.html` o ábrelo desde tu navegador web. No se necesita un servidor local para la funcionalidad básica, ya que los datos se obtienen directamente de la API pública de Binance.

    * **Nota:** Si estás usando un compilador SCSS (SASS), asegúrate de compilar `src/style/style.scss` a `src/style/style.css` antes de abrir `index.html`.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encuentras un error o tienes alguna sugerencia de mejora, no dudes en abrir un *issue* o enviar un *pull request*.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

## 📧 Contacto

[Oscar Garateguy-OLGP] - [oscargarateguy@hotmail.com]