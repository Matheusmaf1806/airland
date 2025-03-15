document.addEventListener('DOMContentLoaded', function() {
    const images = [
        {
            "imageTypeCode": "RES",
            "path": "01/012755/012755a_hb_r_002.jpg",
            "order": 2,
            "visualOrder": 503
        },
        {
            "imageTypeCode": "HAB",
            "path": "01/012755/012755a_hb_w_019.jpg",
            "order": 19,
            "visualOrder": 217
        },
        {
            "imageTypeCode": "COM",
            "path": "01/012755/012755a_hb_l_001.jpg",
            "order": 1,
            "visualOrder": 103
        }
    ];

    // URL base para as imagens
    const baseURL = "https://images.hotelbeds.com";

    // Container onde as imagens serão exibidas
    const gallery = document.getElementById('image-gallery');

    // Função para criar e exibir as imagens
    function displayImages(imageArray) {
        // Loop sobre o array de imagens
        imageArray.forEach(image => {
            // Criar o elemento de imagem
            const img = document.createElement('img');
            img.src = `${baseURL}/${image.path}`; // Definir o caminho completo da imagem
            img.alt = `Imagem do tipo ${image.imageTypeCode}`;
            
            // Criar o container da imagem e adicionar a imagem
            const container = document.createElement('div');
            container.classList.add('image-container');
            container.appendChild(img);

            // Adicionar o container ao galeria
            gallery.appendChild(container);
        });
    }

    // Chamar a função para exibir as imagens
    displayImages(images);
});
