const URL_DEPARTAMENTOS = "https://collectionapi.metmuseum.org/public/collection/v1/departments";
const URL_OBJETO = "https://collectionapi.metmuseum.org/public/collection/v1/objects/";
const URL_SEARCH_IMAGES = "https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true";
const URL_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1/search";

let currentObjectIDs = []; // IDs de objetos actuales
let currentIndex = 0; // Índice actual de paginación
const objectsPerPage = 20; // Número de objetos por página
let numPag = 1; // Página actual

// Fetch para cargar departamentos en el select
function departementosFetch() {
    fetch(URL_DEPARTAMENTOS)
        .then((response) => response.json())
        .then((data) => {
            const departamento = document.getElementById("departamento");
            data.departments.forEach((depar) => {
                const option = document.createElement("option");
                option.value = depar.departmentId;
                option.textContent = depar.displayName;
                departamento.appendChild(option);
            });
        });
}

function objetosFetch(objectIDs) {
    let objetosHtml = ''; 
    let promises = [];

    const nextObjects = objectIDs.slice(currentIndex, currentIndex + objectsPerPage);

    for (let objectID of nextObjects) {
        let promise = fetch(URL_OBJETO + objectID)
            .then((response) => response.json())
            .then((data) => {
                const creacionData = data.accessionYear || 'Fecha desconocida';
                const imagen = data.primaryImageSmall 
                    ? `<img src="${data.primaryImageSmall}" alt="${data.title}">`
                    : '<img src="../imagenes/sin-imagen.jpg" alt="Imagen no disponible">';

                objetosHtml +=
                    `<div class="card">
                        ${imagen}
                        <h3 class="fecha">Creado en: ${creacionData}</h3>
                        <h4 class="titulo">${data.title}</h4>
                        <h6 class="cultura">${data.culture ? data.culture : 'Sin datos'}</h6>
                        <h6 class="dinastia">${data.dynasty ? data.dynasty : 'Sin datos'}</h6>
                    </div>`;
            });
         promises.push(promise);
    }

    Promise.all(promises).then(() => {
        document.getElementById("cards-container").innerHTML = objetosHtml; 
        document.getElementById("numPag").textContent = numPag; 
        deshabilitarBtn()
    });
}


departementosFetch();


fetch(URL_SEARCH_IMAGES)
    .then((response) => response.json())
    .then((data) => {
        currentObjectIDs = data.objectIDs; 
        objetosFetch(currentObjectIDs); 
    });


document.getElementById("buscarBtn").addEventListener("click", () => {
    const departamento = document.getElementById("departamento").value;
    const palabraClave = document.getElementById("palabraClave").value;
    const localizacion = document.getElementById("localizacion").value;

    // reiniciar paginacion
    currentIndex = 0;
    numPag = 1;
    currentObjectIDs = [];

 
    let searchURL = URL_SEARCH + `?q=${palabraClave}`;

    if (departamento) {
        searchURL += `&departmentId=${departamento}`;
    }
    if (localizacion) {
        searchURL += `&geoLocation=${localizacion}`;
    }

    // Fetch con los parámetros personalizados
    fetch(searchURL)
        .then((response) => response.json())
        .then((data) => {
            if (data.objectIDs && data.objectIDs.length > 0) {
                currentObjectIDs = data.objectIDs; 
                document.getElementById("cards-container").innerHTML = ''; 
                objetosFetch(currentObjectIDs); 
            } else {
                document.getElementById("cards-container").innerHTML = "No se encontraron resultados.";
            }
        })
        .catch((error) => { 
            console.error('Error en la búsqueda:', error);
            document.getElementById("cards-container").innerHTML = "Error en la búsqueda.";
        });
});

// Funcion  "Siguiente"
document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentIndex + objectsPerPage < currentObjectIDs.length) {
        currentIndex += objectsPerPage; // Avanza a la siguiente pagina
        numPag++; 
        objetosFetch(currentObjectIDs); // Carga los siguientes objetos
    }
});

// Funcion  "Anterior"
document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentIndex - objectsPerPage >= 0) {
        currentIndex -= objectsPerPage; // a la pagina anterior
        numPag--; 
        objetosFetch(currentObjectIDs); // Carga los objetos anteriores
    }
});

//funcion para deshabilitar botones
function deshabilitarBtn() {
    document.getElementById("prevBtn").disabled = currentIndex === 0;
    document.getElementById("nextBtn").disabled = currentIndex + objectsPerPage >= currentObjectIDs.length;
}
