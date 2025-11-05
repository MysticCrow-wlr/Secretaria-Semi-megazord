// src/components/ScreenshotWrapper.jsx

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

/**
 * Um componente que "embrulha" outro conteúdo (children)
 * e fornece um botão para baixar um screenshot desse conteúdo.
 * * @param {object} props
 * @param {React.ReactNode} props.children - O conteúdo que você quer capturar.
 * @param {string} props.filename - O nome do arquivo a ser baixado (ex: "relatorio.png").
 */
const ScreenshotWrapper = ({ children, filename = "screenshot.png" }) => {
    
    // 1. Criamos uma 'ref' para saber qual elemento do DOM queremos capturar
    const contentRef = useRef(null);

    // 2. Esta é a função que será chamada pelo botão
    const handleCaptureClick = () => {
        // Verifica se a 'ref' está anexada a um elemento
        if (!contentRef.current) {
            console.error("Erro: A 'ref' do conteúdo não foi encontrada.");
            return;
        }

        console.log("Iniciando captura de tela...");

        // 3. Usamos a biblioteca html2canvas no elemento da nossa 'ref'
        html2canvas(contentRef.current, {
            // Opção para tentar carregar imagens de outros domínios (pode precisar de config de CORS)
            useCORS: true, 
        }).then((canvas) => {
            // 'canvas' é a imagem desenhada
            
            // 4. Criamos um link <a> temporário
            const link = document.createElement('a');
            
            // Define o nome do arquivo que será baixado
            link.download = filename;
            
            // Converte o 'canvas' para uma imagem PNG
            link.href = canvas.toDataURL('image/png');
            
            // 5. Simula um clique no link para iniciar o download
            link.click();
            
            console.log("Download do screenshot iniciado.");
        }).catch((err) => {
            console.error("Erro ao capturar a tela:", err);
        });
    };

    return (
        <div>
            {/* 6. O Botão que aciona a captura */}
            <button onClick={handleCaptureClick}>
                Baixar como Imagem
            </button>
            
            <hr style={{ margin: '10px 0' }} />

            {/* 7. O conteúdo a ser capturado é "embrulhado" pela div com a 'ref' */}
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

export default ScreenshotWrapper;