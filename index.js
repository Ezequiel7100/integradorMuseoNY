const express = require('express');
const translate = require('node-google-translate-skidz');
const { Translate }  = require("node-google-translate-skidz");
const app = express();
const port = 3000;



app.use(express.static("public"));

app.listen(port, () =>{
    console.log(`server port ${port}`);
});

// Función para traducir texto usando node-google-translate-skidz
async function translateText(text, targetLang) {
    try {
        const result = await Translate({
            text: text,
            target: targetLang, //  especificar el idioma 
        });
        return result.translation; //  texto traducido
    } catch (error) {
        console.error('Error en la traducción:', error);
        return text; // Si hay un error, devolvemos el texto original
    }
}

app.get('/', async (req, res) => {
    try {
        // 1. Obtiene el listado de objetos de arte desde la API del Met
        const response = await axios.get('https://collectionapi.metmuseum.org/public/collection/v1/objects');
        const productos = response.data.objectIDs.slice(0, 20);

        // 2. Itera los objetos y traduce los campos necesarios
        const productosTraducidos = await Promise.all(productos.map(async (productoID) => {
            try {
                const responseObjeto = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${productoID}`);
                const dataObjeto = responseObjeto.data;

                console.log("Objeto original: ", dataObjeto); // Verificar los datos obtenidos

                // 3. Traducir los textos relevantes
                const nombreTraducido = await translateText(dataObjeto.title || "Sin título", 'es');
                const culturaTraducida = await translateText(dataObjeto.culture || "Sin datos",'es');
                const dinastiaTraducida = await translateText(dataObjeto.dynasty || "Sin datos",'es');

                console.log(`Título: ${nombreTraducido}, Cultura: ${culturaTraducida}, Dinastía: ${dinastiaTraducida}`); // Verificación de la traducción

                // 4. Retorna el objeto traducido con los campos originales y traducidos
                return {
                    id: dataObjeto.objectID,
                    title: nombreTraducido,
                    image: dataObjeto.primaryImage || "Sin imagen",
                    culture: culturaTraducida,
                    dynasty: dinastiaTraducida
                };
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`Objeto con ID ${productoID} no encontrado (404).`);
                    return null; // Ignorar objetos que no existen
                } else {
                    console.error(`Error al obtener el objeto con ID ${productoID}:`, error);
                    return null;
                }
            }
        }));

        // 5. Filtrar objetos nulos (los que no se encontraron)
        const productosFiltrados = productosTraducidos.filter(producto => producto !== null);

        console.log("Objetos traducidos: ", productosFiltrados); // Verificar que se tradujeron

        // 6. Renderiza los productos traducidos a la vista
        res.render('index', { productos: productosFiltrados });

    } catch (error) {
        console.error("Error en la obtención o traducción de productos:", error);
        res.status(500).send("Error interno del servidor");
    }
});