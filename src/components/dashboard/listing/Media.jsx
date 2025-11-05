// Importa dados iniciais (provavelmente imagens/vídeos padrão) de um arquivo local.
import { mediaUpload } from "@/data/dashboard";

// Importa o React e o hook 'useState' (para gerenciar o estado do componente).
import React, { useState } from "react";

// Define e exporta o componente React chamado 'Media'.
export default function Media() {
  // --- Estados ---

  // Cria um estado chamado 'previewImage'.
  // 'setPreviewImage' é a função usada para atualizar esse estado.
  // O valor inicial é pego dos dados importados (mediaUpload[0]).
  const [previewImage, setPreviewImage] = useState(mediaUpload[0].imgSrc);

  // Cria um estado chamado 'previewVideo'.
  // 'setPreviewVideo' é a função usada para atualizar esse estado.
  // O valor inicial é pego dos dados importados (mediaUpload[1]).
  const [previewVideo, setPreviewVideo] = useState(mediaUpload[1].imgSrc);

  // --- Funções (Manipuladores de Eventos) ---

  // Esta função é chamada quando o usuário seleciona um arquivo no input de IMAGEM.
  const handleImageChange = (event) => {
    const file = event.target.files[0]; // Pega o primeiro arquivo selecionado.

    if (file) {
      const reader = new FileReader(); // Cria um "leitor de arquivos" do navegador.

      // Define o que fazer QUANDO o leitor terminar de ler o arquivo.
      reader.onloadend = () => {
        // Atualiza o estado 'previewImage' com o resultado da leitura (uma Data URL).
        // Isso faz a nova imagem aparecer na tela.
        setPreviewImage(reader.result);
      };

      reader.readAsDataURL(file); // Inicia a leitura do arquivo.
    }
  };

  // Esta função é chamada quando o usuário seleciona um arquivo no input de VÍDEO.
  // (Nota: o input no HTML está aceitando "image/*", mas a lógica é a mesma).
  const handleVideoChange = (event) => {
    const file = event.target.files[0]; // Pega o arquivo.

    if (file) {
      const reader = new FileReader(); // Cria um leitor.

      // Define o que fazer quando o leitor terminar.
      reader.onloadend = () => {
        // Atualiza o estado 'previewVideo' com o resultado.
        setPreviewVideo(reader.result);
      };

      reader.readAsDataURL(file); // Inicia a leitura.
    }
  };

  // Esta função é chamada quando qualquer um dos formulários é "enviado".
  const handleSubmit = (e) => {
    // Impede o comportamento padrão do navegador (que é recarregar a página).
    e.preventDefault();
  };

  // --- Renderização (JSX) ---
  // O que o componente vai desenhar na tela.
  return (
    <div className="col-12">
      {/* O card principal (fundo branco, sombra, etc.) */}
      <div className="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
        {/* Cabeçalho do card com o título "Média" */}
        <div className="d-flex items-center py-20 px-30 border-bottom-light">
          <h2 className="text-17 lh-1 fw-500">Média</h2>
        </div>

        {/* Corpo principal do card */}
        <div className="py-30 px-30">
          <div className="row y-gap-50">
            {/* Seção 1: Formulário de Upload de Imagem (Miniatura) */}
            <div className="col-12">
              <form
                onSubmit={handleSubmit} // Usa a função para não recarregar a página.
                className="contact-form d-flex lg:flex-column"
              >
                {/* Lado Esquerdo: A pré-visualização da imagem */}
                <div
                  className="relative shrink-0"
                  // Define um fundo cinza se não houver imagem
                  style={
                    previewImage
                      ? {}
                      : { backgroundColor: "#f2f3f4", width: 250, height: 200 }
                  }
                >
                  {/* Mostra a tag <img> APENAS SE 'previewImage' tiver um valor */}
                  {previewImage && (
                    <img
                      className="w-1/1"
                      style={{
                        width: "250px",
                        height: "200px",
                        objectFit: "contain",
                      }}
                      src={previewImage} // A imagem exibida vem do estado.
                      alt="image"
                    />
                  )}

                  {/* Botão (ícone de lixeira) para remover a imagem */}
                  <div className="absolute-full-center d-flex justify-end py-20 px-20">
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        // Limpa o valor do input (para permitir selecionar o mesmo arquivo de novo)
                        document.getElementById("imageUpload1").value = "";
                        // Limpa o estado 'previewImage', escondendo a imagem.
                        setPreviewImage("");
                      }}
                      className="d-flex justify-center items-center bg-white size-40 rounded-8 shadow-1"
                    >
                      <i className="icon-bin text-16"></i>
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Inputs e texto de ajuda */}
                <div className="w-1/1 ml-30 lg:ml-0 lg:mt-20">
                  <div className="form-upload col-12">
                    <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                      Miniatura do curso*
                    </label>
                    <div className="form-upload__wrap">
                      {/* Um input de texto (parece ser apenas para mostrar um placeholder) */}
                      <input
                        required
                        type="text"
                        name="name"
                        placeholder={"Cover-1.png"}
                      />
                      {/* O botão "Carregar Arquivos" */}
                      <button className="button -dark-3 text-white">
                        {/* Este 'label' é o que o usuário clica. */}
                        <label
                          style={{ cursor: "pointer" }}
                          htmlFor="imageUpload1" // 'htmlFor' conecta este label ao input com id="imageUpload1"
                        >
                          Carregar Arquivos
                        </label>
                        {/* O input de arquivo real, que fica ESCONDIDO */}
                        <input
                          required
                          id="imageUpload1" // O ID que o 'label' acima usa.
                          type="file"
                          accept="image/*" // Aceita apenas arquivos de imagem.
                          onChange={handleImageChange} // Chama a função quando um arquivo é escolhido.
                          style={{ display: "none" }} // Esconde este elemento.
                        />
                      </button>
                    </div>
                  </div>

                  {/* Texto de ajuda/diretrizes */}
                  <p className="mt-10">
                    Carregue a imagem do seu curso aqui. Ela deve atender aos
                    nossos padrões de qualidade...
                  </p>
                </div>
              </form>
            </div>

            {/* Seção 2: Formulário de Upload de Vídeo (estrutura idêntica à de imagem) */}
            <div className="col-12">
              <form
                onSubmit={handleSubmit}
                className="contact-form d-flex lg:flex-column"
              >
                {/* Lado Esquerdo: Pré-visualização (usa 'previewVideo') */}
                <div
                  className="relative shrink-0"
                  style={
                    previewVideo
                      ? {}
                      : { backgroundColor: "#f2f3f4", width: 250, height: 200 }
                  }
                >
                  {/* Mostra a imagem SE 'previewVideo' tiver valor */}
                  {previewVideo && (
                    <img
                      className="w-1/1"
                      style={{
                        width: "250px",
                        height: "200px",
                        objectFit: "contain",
                      }}
                      src={previewVideo} // Usa o estado 'previewVideo'.
                      alt="image"
                    />
                  )}

                  {/* Botão de remover */}
                  <div className="absolute-full-center d-flex justify-end py-20 px-20">
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        // Limpa o input 'imageUpload2'
                        document.getElementById("imageUpload2").value = "";
                        // Limpa o estado 'previewVideo'
                        setPreviewVideo("");
                      }}
                      className="d-flex justify-center items-center bg-white size-40 rounded-8 shadow-1"
                    >
                      <i className="icon-bin text-16"></i>
                    </span>
                  </div>
                </div>

                {/* Lado Direito: Inputs e texto de ajuda */}
                <div className="w-1/1 ml-30 lg:ml-0 lg:mt-20">
                  <div className="form-upload col-12">
                    <label className="text-16 lh-1 fw-500 text-dark-1 mb-10">
                      Video URL*
                    </label>
                    <div className="form-upload__wrap">
                      <input
                        required
                        type="text"
                        name="name"
                        placeholder={"Video-1.mp3"}
                      />
                      <button className="button -dark-3 text-white">
                        {/* Label que clica no input 'imageUpload2' */}
                        <label
                          style={{ cursor: "pointer" }}
                          htmlFor="imageUpload2"
                        >
                          Carregar Arquivos
                        </label>
                        {/* Input de arquivo escondido */}
                        <input
                          required
                          id="imageUpload2"
                          type="file"
                          accept="image/*" // (Nota: Este também aceita imagens, não vídeos)
                          onChange={handleVideoChange} // Chama a função 'handleVideoChange'
                          style={{ display: "none" }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Texto de ajuda */}
                  <p className="mt-10">
                    {
                      "Insira uma URL de vídeo válida. Estudantes que assistem a um vídeo..."
                    }
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Botões de navegação na parte inferior do card */}
          <div className="row y-gap-20 justify-between pt-30">
            <div className="col-auto">
              <button className="button -md -outline-purple-1 text-purple-1">
                Prévia
              </button>
            </div>

            <div className="col-auto">
              <button className="button -md -purple-1 text-white">Próximo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}